import { uploadFile } from './storage.js';

// Upload ID document
export async function uploadIDDocument(fileBuffer, userId) {
  const result = await uploadFile(fileBuffer, `id-${Date.now()}`, userId, 'application/octet-stream');
  return { url: result.publicUrl };
}

// Upload selfie
export async function uploadSelfie(fileBuffer, userId) {
  const result = await uploadFile(fileBuffer, `selfie-${Date.now()}`, userId, 'image/jpeg');
  return { url: result.publicUrl };
}