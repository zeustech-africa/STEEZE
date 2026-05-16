import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import multerS3 from 'multer-s3';

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Generate presigned URL for direct upload (secure, client-side)
export async function generatePresignedUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    CacheControl: 'max-age=31536000',
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  return url;
}

// Upload file directly to R2
export async function uploadFile(key, body, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'max-age=31536000',
  });
  await r2Client.send(command);
  return getFileUrl(key);
}

// Get file URL
export function getFileUrl(key) {
  if (!key) return null;
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

// Delete file
export async function deleteFile(key) {
  if (!key) return;
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await r2Client.send(command);
}

// List files in a folder
export async function listFiles(prefix) {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });
  const response = await r2Client.send(command);
  return response.Contents || [];
}

// Multer middleware for file uploads (server-side)
export const upload = multer({
  storage: multerS3({
    s3: r2Client,
    bucket: BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname, userId: req.user?.id || 'anonymous' });
    },
    key: (req, file, cb) => {
      const userId = req.user?.id || 'anonymous';
      const timestamp = Date.now();
      const ext = file.originalname.split('.').pop();
      cb(null, `uploads/${userId}/${timestamp}.${ext}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  },
});

/*
 * CORS Policy for R2 bucket (MUST BE SET IN CLOUDFLARE DASHBOARD)
 * Go to your bucket -> Settings -> CORS Policy -> Add:
 * [
 *   {
 *     "AllowedOrigins": ["http://localhost:3000", "https://steeze.com", "https://*.vercel.app"],
 *     "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
 *     "AllowedHeaders": ["*"],
 *     "ExposeHeaders": ["ETag", "Content-Length"],
 *     "MaxAgeSeconds": 3000
 *   }
 * ]
 */

export default r2Client;