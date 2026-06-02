import { PrismaClient } from '@prisma/client';
import { canSaveContent, getUserAccessLevel } from './contentVisibility.js';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: Save a post (VIBER saves content)
export async function savePost(userId, postId, playlistId = null) {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }

  // Check if user can save content
  const userAccess = await getUserAccessLevel(userId);
  const saveCheck = await canSaveContent(userId, userAccess.level);
  
  if (!saveCheck.canSave) {
    throw new Error(saveCheck.reason);
  }

  // Get the post to check its content type and original creator
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      contentType: true,
      status: true,
      creatorId: true,
      repostCount: true,
      saveCount: true
    }
  });

  if (!post) {
    throw new Error('Post not found');
  }

  // Check if already saved
  const existingSave = await prisma.savedPost.findUnique({
    where: {
      userId_postId: {
        userId,
        postId
      }
    }
  });

  if (existingSave) {
    throw new Error('Post already saved');
  }

  // Create saved post record
  const savedPost = await prisma.$transaction(async (tx) => {
    // Create the saved post entry
    const saved = await tx.savedPost.create({
      data: {
        userId,
        postId,
        playlistId
      }
    });

    // Increment save count on the original post
    await tx.post.update({
      where: { id: postId },
      data: { saveCount: { increment: 1 } }
    });

    // If the post is in global feed (status approved_global), repost to global feed
    if (post.status === 'approved_global') {
      await tx.post.update({
        where: { id: postId },
        data: { repostCount: { increment: 1 } }
      });
    }

    return saved;
  });

  // Send notification to original creator (non-blocking)
  if (post.creatorId !== userId) {
    notifyOriginalCreator(post.creatorId, userId, postId).catch(console.error);
  }

  return {
    success: true,
    savedPost,
    isGlobalRepost: post.status === 'approved_global',
    message: post.status === 'approved_global' 
      ? 'Post saved and reposted to global feed' 
      : 'Post saved to your profile'
  };
}

// AUDIT: Unsave a post (remove saved content)
export async function unsavePost(userId, postId) {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }

  // Check if the save exists
  const existingSave = await prisma.savedPost.findUnique({
    where: {
      userId_postId: {
        userId,
        postId
      }
    }
  });

  if (!existingSave) {
    throw new Error('Post not saved');
  }

  // Get post to check if it was a global feed repost
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { status: true, repostCount: true, saveCount: true }
  });

  // Remove the saved post
  await prisma.$transaction(async (tx) => {
    await tx.savedPost.delete({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    // Decrement save count
    await tx.post.update({
      where: { id: postId },
      data: { saveCount: { decrement: 1 } }
    });

    // If it was a global feed post, decrement repost count
    if (post && post.status === 'approved_global') {
      await tx.post.update({
        where: { id: postId },
        data: { repostCount: { decrement: 1 } }
      });
    }
  });

  return {
    success: true,
    message: 'Post removed from saved'
  };
}

// AUDIT: Check if a user has saved a specific post
export async function isPostSaved(userId, postId) {
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  if (!postId || typeof postId !== 'string') {
    return false;
  }

  const saved = await prisma.savedPost.findUnique({
    where: {
      userId_postId: {
        userId,
        postId
      }
    },
    select: { id: true, createdAt: true }
  });

  return saved ? { saved: true, savedAt: saved.createdAt } : { saved: false };
}

// AUDIT: Get all posts saved by a user (with pagination)
export async function getUserSavedPosts(userId, options = {}) {
  const { limit = 50, offset = 0, playlistId = null } = options;

  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const parsedLimit = Math.min(100, parseInt(limit) || 50);
  const parsedOffset = parseInt(offset) || 0;

  const where = { userId };
  if (playlistId) {
    where.playlistId = playlistId;
  }

  const [savedPosts, total] = await Promise.all([
    prisma.savedPost.findMany({
      where,
      include: {
        post: {
          include: {
            creator: {
              select: {
                id: true,
                artistName: true,
                fullName: true,
                profilePicUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
      skip: parsedOffset
    }),
    prisma.savedPost.count({ where })
  ]);

  return {
    savedPosts,
    total,
    hasMore: parsedOffset + parsedLimit < total,
    limit: parsedLimit,
    offset: parsedOffset
  };
}

// AUDIT: Get save count for a post
export async function getSavedPostCount(postId) {
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { saveCount: true }
  });

  return { saveCount: post?.saveCount || 0 };
}

// AUDIT: Get repost count for a post
export async function getRepostCount(postId) {
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { repostCount: true }
  });

  return { repostCount: post?.repostCount || 0 };
}

// AUDIT: Notify original creator when content is saved/reposted
export async function notifyOriginalCreator(creatorId, saverId, postId) {
  if (!creatorId || !saverId || !postId) return;

  try {
    // Get saver info
    const saver = await prisma.user.findUnique({
      where: { id: saverId },
      select: { artistName: true, fullName: true, email: true }
    });

    const saverName = saver?.artistName || saver?.fullName || saver?.email || 'A VIBER';

    // Create notification
    await prisma.notification.create({
      data: {
        userId: creatorId,
        type: 'content_saved',
        title: 'Content Saved',
        message: `${saverName} saved your content to their profile.`,
        link: `/post/${postId}`,
        metadata: {
          saverId,
          postId,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Notify creator error:', error);
  }
}

export default {
  savePost,
  unsavePost,
  isPostSaved,
  getUserSavedPosts,
  getSavedPostCount,
  getRepostCount,
  notifyOriginalCreator
};