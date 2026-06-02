import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'steeze-media';

// AUDIT: Generate unique filename
function generateFileName(originalName, userId) {
  const ext = originalName.split('.').pop();
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${userId}/${timestamp}_${random}.${ext}`;
}

// AUDIT: Upload file to R2
export async function uploadFile(fileBuffer, originalName, userId, mimeType) {
  if (!fileBuffer || !originalName || !userId) {
    throw new Error('Missing required parameters for upload');
  }

  const fileName = generateFileName(originalName, userId);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await r2Client.send(command);

  // Generate public URL
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

  return {
    success: true,
    fileName,
    publicUrl,
    mimeType,
    size: fileBuffer.length
  };
}

// AUDIT: Generate signed URL for temporary access (for private content)
export async function getSignedDownloadUrl(fileName, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
  return signedUrl;
}

// AUDIT: Delete file from R2
export async function deleteFile(fileName) {
  if (!fileName) {
    throw new Error('File name is required');
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  await r2Client.send(command);
  return { success: true };
}

// AUDIT: Check if file exists
export async function fileExists(fileName) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    await r2Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

export default {
  uploadFile,
  getSignedDownloadUrl,
  deleteFile,
  fileExists
};