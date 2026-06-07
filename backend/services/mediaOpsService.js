import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new media job
export async function createMediaJob(mediaId, mediaType, jobType, fileSize = null, fileUrl = null, metadata = {}) {
  const job = await prisma.mediaJob.create({
    data: {
      mediaId,
      mediaType,
      jobType,
      status: 'pending',
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
      fileSize,
      fileUrl,
      metadata
    }
  });
  return job;
}

// Update job progress
export async function updateJobProgress(jobId, progress, status = null) {
  const data = { progress };
  if (status) data.status = status;
  if (progress === 100) data.completedAt = new Date();
  if (status === 'processing' && !data.startedAt) data.startedAt = new Date();
  
  const job = await prisma.mediaJob.update({
    where: { id: jobId },
    data
  });
  return job;
}

// Mark job as failed
export async function markJobFailed(jobId, errorMessage, errorCode = null) {
  const job = await prisma.mediaJob.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      errorMessage,
      errorCode,
      completedAt: new Date()
    }
  });
  return job;
}

// Get all media jobs with pagination and filters
export async function getMediaJobs(filters = {}, page = 1, limit = 50) {
  const where = {};
  
  if (filters.status) where.status = filters.status;
  if (filters.mediaType) where.mediaType = filters.mediaType;
  if (filters.jobType) where.jobType = filters.jobType;
  if (filters.mediaId) where.mediaId = filters.mediaId;
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const [jobs, total] = await Promise.all([
    prisma.mediaJob.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.mediaJob.count({ where })
  ]);
  
  return { jobs, total, page, limit };
}

// Get failed jobs
export async function getFailedJobs(page = 1, limit = 50) {
  return getMediaJobs({ status: 'failed' }, page, limit);
}

// Get pending jobs
export async function getPendingJobs(page = 1, limit = 50) {
  return getMediaJobs({ status: 'pending' }, page, limit);
}

// Get media operations dashboard stats
export async function getMediaOpsStats() {
  const [total, pending, processing, completed, failed, byType, byJobType] = await Promise.all([
    prisma.mediaJob.count(),
    prisma.mediaJob.count({ where: { status: 'pending' } }),
    prisma.mediaJob.count({ where: { status: 'processing' } }),
    prisma.mediaJob.count({ where: { status: 'completed' } }),
    prisma.mediaJob.count({ where: { status: 'failed' } }),
    prisma.mediaJob.groupBy({
      by: ['mediaType'],
      _count: true
    }),
    prisma.mediaJob.groupBy({
      by: ['jobType', 'status'],
      _count: true
    })
  ]);
  
  // Calculate average processing time for completed jobs (in seconds)
  const avgProcessingTime = await prisma.$queryRaw`
    SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))) as avg_seconds
    FROM "MediaJob"
    WHERE status = 'completed' AND "startedAt" IS NOT NULL AND "completedAt" IS NOT NULL
  `;
  
  return {
    counts: { total, pending, processing, completed, failed },
    byType,
    byJobType,
    averageProcessingTimeSeconds: Number(avgProcessingTime[0]?.avg_seconds) || 0,
    successRate: total > 0 ? Math.round((completed / total) * 100) : 100
  };
}

// Get single job by ID
export async function getMediaJobById(jobId) {
  const job = await prisma.mediaJob.findUnique({
    where: { id: jobId }
  });
  return job;
}

// Get jobs by media ID
export async function getJobsByMediaId(mediaId) {
  const jobs = await prisma.mediaJob.findMany({
    where: { mediaId },
    orderBy: { createdAt: 'desc' }
  });
  return jobs;
}

// ============ RETRY QUEUE (FUTURE 8B) ============

// Retry a single failed job
export async function retryJob(jobId) {
  const originalJob = await prisma.mediaJob.findUnique({
    where: { id: jobId }
  });
  
  if (!originalJob) {
    throw new Error('Job not found');
  }
  
  if (originalJob.status !== 'failed') {
    throw new Error('Only failed jobs can be retried');
  }
  
  if (originalJob.retryCount >= originalJob.maxRetries) {
    throw new Error('Max retries reached for this job');
  }
  
  // Create a new retry job
  const retryJob = await prisma.mediaJob.create({
    data: {
      mediaId: originalJob.mediaId,
      mediaType: originalJob.mediaType,
      jobType: originalJob.jobType,
      status: 'pending',
      progress: 0,
      retryCount: originalJob.retryCount + 1,
      maxRetries: originalJob.maxRetries,
      fileSize: originalJob.fileSize,
      fileUrl: originalJob.fileUrl,
      metadata: originalJob.metadata,
      storageProvider: originalJob.storageProvider,
      storagePath: originalJob.storagePath,
      retriedFromId: originalJob.id
    }
  });
  
  // Mark original as retrying
  await prisma.mediaJob.update({
    where: { id: jobId },
    data: { 
      status: 'retrying',
      lastRetryAt: new Date(),
      retryScheduledAt: new Date()
    }
  });
  
  return retryJob;
}

// Bulk retry multiple failed jobs
export async function bulkRetryJobs(jobIds) {
  const results = [];
  for (const jobId of jobIds) {
    try {
      const retryJob = await retryJob(jobId);
      results.push({ jobId, success: true, retryJobId: retryJob.id });
    } catch (error) {
      results.push({ jobId, success: false, error: error.message });
    }
  }
  return results;
}

// Get retryable jobs (failed jobs that can be retried)
export async function getRetryableJobs(page = 1, limit = 50) {
  return getMediaJobs({ status: 'failed' }, page, limit);
}

// Get retry history for a media item
export async function getRetryHistory(mediaId) {
  const jobs = await prisma.mediaJob.findMany({
    where: {
      OR: [
        { mediaId },
        { retriedFromId: { not: null } }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });
  
  // Build retry chain
  const history = [];
  const jobMap = new Map();
  jobs.forEach(job => jobMap.set(job.id, job));
  
  for (const job of jobs) {
    if (job.retriedFromId) {
      const original = jobMap.get(job.retriedFromId);
      history.push({
        originalId: job.retriedFromId,
        retryId: job.id,
        retriedAt: job.createdAt,
        status: job.status
      });
    }
  }
  
  return history;
}

// ============ STORAGE MONITORING (FUTURE 8B) ============

// Check storage health (CDN/R2)
export async function checkStorageHealth() {
  const results = {
    r2: { status: 'healthy', lastCheck: new Date(), error: null },
    cdn: { status: 'healthy', lastCheck: new Date(), error: null }
  };
  
  try {
    // Check R2 health by attempting to list buckets (lightweight check)
    // This is a simulation - actual implementation would call R2 API
    const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');
    
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
    
    await r2Client.send(new ListBucketsCommand({ maxBuckets: 1 }));
    results.r2.status = 'healthy';
  } catch (error) {
    results.r2.status = 'degraded';
    results.r2.error = error.message;
    console.error('R2 health check failed:', error.message);
  }
  
  // Check CDN health by pinging a known endpoint
  try {
    const cdnUrl = process.env.R2_PUBLIC_URL || 'https://cdn.steeze.com';
    const response = await fetch(`${cdnUrl}/health-check`, { method: 'HEAD' });
    results.cdn.status = response.ok ? 'healthy' : 'degraded';
  } catch (error) {
    results.cdn.status = 'down';
    results.cdn.error = error.message;
  }
  
  // Log the health check
  await prisma.mediaJob.create({
    data: {
      mediaId: 'storage-health-check',
      mediaType: 'system',
      jobType: 'health_check',
      status: results.r2.status === 'healthy' ? 'completed' : 'failed',
      metadata: results,
      completedAt: new Date()
    }
  });
  
  return results;
}

// Get storage usage statistics
export async function getStorageStats() {
  // Get total file size from completed media jobs
  const completedJobs = await prisma.mediaJob.aggregate({
    where: { status: 'completed' },
    _sum: { fileSize: true }
  });
  
  // Get failed uploads count
  const failedUploads = await prisma.mediaJob.count({
    where: { 
      jobType: 'upload',
      status: 'failed'
    }
  });
  
  // Get storage failures in last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const recentFailures = await prisma.mediaJob.count({
    where: {
      status: 'failed',
      createdAt: { gte: oneDayAgo }
    }
  });
  
  return {
    totalStorageBytes: completedJobs._sum.fileSize || 0,
    totalStorageMB: Math.round((completedJobs._sum.fileSize || 0) / (1024 * 1024)),
    failedUploads,
    recentFailures24h: recentFailures,
    health: await checkStorageHealth()
  };
}

// Get media repair queue (failed jobs ready for retry)
export async function getRepairQueue(page = 1, limit = 50) {
  const where = {
    status: 'failed',
    retryCount: { lt: 3 } // Only jobs that can still be retried
  };
  
  const skip = (page - 1) * limit;
  
  const [jobs, total] = await Promise.all([
    prisma.mediaJob.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.mediaJob.count({ where })
  ]);
  
  return { jobs, total, page, limit };
}

// Schedule automatic retry for failed jobs
export async function scheduleRetries() {
  const retryableJobs = await getRepairQueue(1, 100);
  const results = [];
  
  for (const job of retryableJobs.jobs) {
    // Only retry if last attempt was more than 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (job.updatedAt < fiveMinutesAgo) {
      try {
        const retryJob = await retryJob(job.id);
        results.push({ jobId: job.id, success: true, retryJobId: retryJob.id });
      } catch (error) {
        results.push({ jobId: job.id, success: false, error: error.message });
      }
    }
  }
  
  return results;
}
