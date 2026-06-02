import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { uploadFile } from '../services/storage.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for memory storage (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mpeg', 'audio/mpeg', 'audio/wav'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and audio files are allowed.'));
    }
  },
});

// AUDIT: POST /api/upload/file - Upload file to R2
router.post('/upload/file', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    const { title, description } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Determine media type
    let mediaType = 'unknown';
    if (file.mimetype.startsWith('video/')) mediaType = 'video';
    else if (file.mimetype.startsWith('audio/')) mediaType = 'audio';
    else if (file.mimetype.startsWith('image/')) mediaType = 'image';

    // Upload to R2
    const result = await uploadFile(file.buffer, file.originalname, userId, file.mimetype);

    res.json({
      success: true,
      mediaUrl: result.publicUrl,
      mediaType,
      fileSize: file.size,
      fileName: result.fileName
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

// AUDIT: POST /api/upload/complete - Create post after upload
router.post('/upload/complete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      contentType,
      price,
      distributionChannels,
      mediaUrl,
      mediaType,
      duration
    } = req.body;

    // Validate required fields
    if (!title || !mediaUrl) {
      return res.status(400).json({ error: 'Title and media URL are required' });
    }

    // Validate content type
    const validContentTypes = ['free', 'subscriber', 'direct_purchase', 'creator_page_only'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    // Validate price for direct purchase
    if (contentType === 'direct_purchase') {
      if (!price || price < 500 || price > 50000) {
        return res.status(400).json({ error: 'Direct purchase price must be between R5 and R500 (500-50000 cents)' });
      }
    }

    // Create post with pending status (awaiting admin approval)
    const post = await prisma.post.create({
      data: {
        creatorId: userId,
        title,
        description: description || '',
        contentType,
        price: contentType === 'direct_purchase' ? price : null,
        distributionChannels: distributionChannels || ['steeze'],
        mediaUrl,
        mediaType,
        duration: duration || null,
        status: 'pending' // Requires admin approval
      }
    });

    res.status(201).json({
      success: true,
      post,
      message: 'Content uploaded and pending admin approval'
    });
  } catch (error) {
    console.error('Complete upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

// AUDIT: GET /api/upload/status/:uploadId - Check upload status
router.get('/upload/status/:uploadId', authenticateToken, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user.id;

    // For now, return basic status
    res.json({
      success: true,
      uploadId,
      status: 'processing',
      message: 'Upload is being processed'
    });
  } catch (error) {
    console.error('Upload status error:', error);
    res.status(500).json({ error: 'Failed to check upload status' });
  }
});

export default router;