import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import {
  getMediaJobs,
  getFailedJobs,
  getPendingJobs,
  getMediaOpsStats,
  getMediaJobById,
  getJobsByMediaId,
  retryJob,
  bulkRetryJobs,
  getRetryableJobs,
  getRetryHistory,
  checkStorageHealth,
  getStorageStats,
  getRepairQueue,
  scheduleRetries
} from '../../services/mediaOpsService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ MEDIA JOBS ============

// GET /api/admin/media/jobs - List all media jobs
router.get('/jobs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1, limit = 50,
      status, mediaType, jobType,
      mediaId, startDate, endDate
    } = req.query;
    
    const filters = { status, mediaType, jobType, mediaId, startDate, endDate };
    const result = await getMediaJobs(filters, parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get media jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch media jobs' });
  }
});

// GET /api/admin/media/jobs/failed - List failed jobs
router.get('/jobs/failed', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await getFailedJobs(parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get failed jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch failed jobs' });
  }
});

// GET /api/admin/media/jobs/pending - List pending jobs
router.get('/jobs/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await getPendingJobs(parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get pending jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending jobs' });
  }
});

// GET /api/admin/media/jobs/:id - Get single job
router.get('/jobs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const job = await getMediaJobById(id);
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    res.json({ success: true, job });
  } catch (error) {
    console.error('Get media job error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch job' });
  }
});

// GET /api/admin/media/jobs/by-media/:mediaId - Get jobs by media ID
router.get('/jobs/by-media/:mediaId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const jobs = await getJobsByMediaId(mediaId);
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Get jobs by media error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

// ============ MEDIA OPERATIONS DASHBOARD ============

// GET /api/admin/media/stats - Dashboard statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getMediaOpsStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get media stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch media stats' });
  }
});

// GET /api/admin/media/status - Overall media processing status
router.get('/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getMediaOpsStats();
    const recentFailed = await getFailedJobs(1, 10);
    
    res.json({
      success: true,
      status: {
        isHealthy: stats.counts.failed < 10, // Consider unhealthy if more than 10 failed jobs
        totalJobs: stats.counts.total,
        pendingJobs: stats.counts.pending,
        processingJobs: stats.counts.processing,
        failedJobs: stats.counts.failed,
        completedJobs: stats.counts.completed,
        successRate: stats.successRate,
        averageProcessingTime: stats.averageProcessingTimeSeconds,
        recentFailedJobs: recentFailed.jobs.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get media status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch media status' });
  }
});

// ============ JOB TYPES ============

// GET /api/admin/media/job-types - Get available job types
router.get('/job-types', authenticateToken, requireAdmin, async (req, res) => {
  const jobTypes = [
    { value: 'upload', label: 'File Upload', description: 'Initial file upload to storage' },
    { value: 'transcode', label: 'Video Transcoding', description: 'Convert video to streaming formats' },
    { value: 'thumbnail', label: 'Thumbnail Generation', description: 'Generate thumbnail images' },
    { value: 'normalize', label: 'Audio Normalization', description: 'Normalize audio levels' },
    { value: 'waveform', label: 'Waveform Generation', description: 'Generate audio waveform visualization' }
  ];
  res.json({ success: true, jobTypes });
});

// GET /api/admin/media/media-types - Get available media types
router.get('/media-types', authenticateToken, requireAdmin, async (req, res) => {
  const mediaTypes = [
    { value: 'video', label: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv'] },
    { value: 'audio', label: 'Audio', extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg'] },
    { value: 'image', label: 'Image', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
  ];
  res.json({ success: true, mediaTypes });
});

// ============ RETRY QUEUE (FUTURE 8B) ============

// POST /api/admin/media/jobs/:id/retry - Retry a single failed job
router.post('/jobs/:id/retry', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const retryJob = await retryJob(id);
    res.json({ success: true, retryJob });
  } catch (error) {
    console.error('Retry job error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to retry job' });
  }
});

// POST /api/admin/media/jobs/retry-bulk - Bulk retry multiple failed jobs
router.post('/jobs/retry-bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { jobIds } = req.body;
    
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ success: false, message: 'jobIds array is required' });
    }
    
    const results = await bulkRetryJobs(jobIds);
    res.json({ success: true, results, totalProcessed: results.length });
  } catch (error) {
    console.error('Bulk retry error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk retry jobs' });
  }
});

// GET /api/admin/media/jobs/retryable - Get retryable jobs
router.get('/jobs/retryable', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await getRetryableJobs(parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get retryable jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch retryable jobs' });
  }
});

// GET /api/admin/media/jobs/retry-history/:mediaId - Get retry history for media
router.get('/jobs/retry-history/:mediaId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const history = await getRetryHistory(mediaId);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Get retry history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch retry history' });
  }
});

// ============ STORAGE MONITORING (FUTURE 8B) ============

// GET /api/admin/media/storage/health - Check storage health
router.get('/storage/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const health = await checkStorageHealth();
    res.json({ success: true, health });
  } catch (error) {
    console.error('Check storage health error:', error);
    res.status(500).json({ success: false, message: 'Failed to check storage health' });
  }
});

// GET /api/admin/media/storage/stats - Get storage statistics
router.get('/storage/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getStorageStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get storage stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch storage stats' });
  }
});

// GET /api/admin/media/repair-queue - Get media repair queue
router.get('/repair-queue', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await getRepairQueue(parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get repair queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch repair queue' });
  }
});

// POST /api/admin/media/repair-queue/process - Process repair queue (auto-retry)
router.post('/repair-queue/process', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const results = await scheduleRetries();
    res.json({ success: true, results, processedCount: results.length });
  } catch (error) {
    console.error('Process repair queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to process repair queue' });
  }
});

export default router;
