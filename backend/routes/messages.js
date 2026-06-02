import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure file upload for messages
const messagesDir = path.join(__dirname, '..', 'uploads', 'messages');
if (!fs.existsSync(messagesDir)) {
  fs.mkdirSync(messagesDir, { recursive: true });
}

const messageFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, messagesDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `msg-${unique}${path.extname(file.originalname)}`);
  }
});

const uploadMessageFile = multer({ storage: messageFileStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// ============================================
// MESSAGE REQUEST ENDPOINTS
// ============================================

// Send message request (non-follower to user)
router.post("/message-request", authenticateToken, uploadMessageFile.single('attachment'), async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { toUserId, message } = req.body;
    const attachmentFile = req.file;

    if (!toUserId || !message) {
      return res.status(400).json({ error: "User ID and message are required" });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ error: "Cannot send message to yourself" });
    }

    // Check if users are following each other
    const isFollowing = await prisma.follow.findFirst({
      where: {
        followerId: fromUserId,
        followingId: toUserId
      }
    });

    // If following, create direct conversation instead of request
    if (isFollowing) {
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: fromUserId, user2Id: toUserId },
            { user1Id: toUserId, user2Id: fromUserId }
          ]
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            user1Id: fromUserId,
            user2Id: toUserId,
            lastMessage: message,
            lastMessageAt: new Date()
          }
        });
      } else {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessage: message, lastMessageAt: new Date() }
        });
      }

      const directMessage = await prisma.directMessage.create({
        data: {
          conversationId: conversation.id,
          fromUserId,
          toUserId,
          message,
          fileUrl: attachmentFile ? `/uploads/messages/${attachmentFile.filename}` : null,
          fileName: attachmentFile ? attachmentFile.originalname : null
        }
      });

      return res.json({ success: true, message: "Message sent", type: "direct", data: directMessage });
    }

    // Not following - create message request
    const existingRequest = await prisma.messageRequest.findFirst({
      where: {
        fromUserId,
        toUserId,
        status: "pending"
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: "You already have a pending request to this user" });
    }

    const messageRequest = await prisma.messageRequest.create({
      data: {
        fromUserId,
        toUserId,
        message,
        fileUrl: attachmentFile ? `/uploads/messages/${attachmentFile.filename}` : null,
        fileName: attachmentFile ? attachmentFile.originalname : null,
        status: "pending"
      }
    });

    res.json({ success: true, message: "Message request sent", type: "request", data: messageRequest });
  } catch (error) {
    console.error("Send message request error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get pending message requests for current user
router.get("/message-requests/pending", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingRequests = await prisma.messageRequest.findMany({
      where: {
        toUserId: userId,
        status: "pending"
      },
      include: {
        fromUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profilePicUrl: true,
            userType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get count of pending requests for notification badge
    const pendingCount = pendingRequests.length;

    res.json({ success: true, pendingRequests, pendingCount });
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({ error: "Failed to get pending requests" });
  }
});

// Accept message request
router.post("/message-requests/:requestId/accept", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const messageRequest = await prisma.messageRequest.findFirst({
      where: {
        id: requestId,
        toUserId: userId,
        status: "pending"
      }
    });

    if (!messageRequest) {
      return res.status(404).json({ error: "Message request not found" });
    }

    // Create conversation between users
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: messageRequest.fromUserId, user2Id: messageRequest.toUserId },
          { user1Id: messageRequest.toUserId, user2Id: messageRequest.fromUserId }
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: messageRequest.fromUserId,
          user2Id: messageRequest.toUserId,
          lastMessage: messageRequest.message,
          lastMessageAt: new Date()
        }
      });
    }

    // Move the request message to direct messages
    await prisma.directMessage.create({
      data: {
        conversationId: conversation.id,
        fromUserId: messageRequest.fromUserId,
        toUserId: messageRequest.toUserId,
        message: messageRequest.message,
        fileUrl: messageRequest.fileUrl,
        fileName: messageRequest.fileName
      }
    });

    // Update request status to accepted
    await prisma.messageRequest.update({
      where: { id: requestId },
      data: { status: "accepted" }
    });

    res.json({ success: true, message: "Message request accepted", conversationId: conversation.id });
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({ error: "Failed to accept request" });
  }
});

// Reject message request
router.post("/message-requests/:requestId/reject", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const messageRequest = await prisma.messageRequest.findFirst({
      where: {
        id: requestId,
        toUserId: userId,
        status: "pending"
      }
    });

    if (!messageRequest) {
      return res.status(404).json({ error: "Message request not found" });
    }

    await prisma.messageRequest.update({
      where: { id: requestId },
      data: { status: "rejected" }
    });

    res.json({ success: true, message: "Message request rejected" });
  } catch (error) {
    console.error("Reject request error:", error);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

// ============================================
// DIRECT MESSAGE ENDPOINTS
// ============================================

// Get all conversations for current user
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profilePicUrl: true,
            userType: true
          }
        },
        user2: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profilePicUrl: true,
            userType: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    // Format conversations with the other user's info
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0];
      return {
        id: conv.id,
        otherUser,
        lastMessage: lastMessage?.message || "",
        lastMessageAt: conv.lastMessageAt,
        unreadCount: 0 // Will implement unread count separately
      };
    });

    res.json({ success: true, conversations: formattedConversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

// Get messages for a conversation
router.get("/conversations/:conversationId/messages", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read
    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        toUserId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ success: true, messages });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Send direct message (for existing conversations)
router.post("/conversations/:conversationId/messages", authenticateToken, uploadMessageFile.single('attachment'), async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { conversationId } = req.params;
    const { message } = req.body;
    const attachmentFile = req.file;

    if (!message && !attachmentFile) {
      return res.status(400).json({ error: "Message or attachment is required" });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: fromUserId },
          { user2Id: fromUserId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const toUserId = conversation.user1Id === fromUserId ? conversation.user2Id : conversation.user1Id;

    const directMessage = await prisma.directMessage.create({
      data: {
        conversationId,
        fromUserId,
        toUserId,
        message: message || "",
        fileUrl: attachmentFile ? `/uploads/messages/${attachmentFile.filename}` : null,
        fileName: attachmentFile ? attachmentFile.originalname : null
      }
    });

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: message || "📎 Attachment",
        lastMessageAt: new Date()
      }
    });

    res.json({ success: true, message: directMessage });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get unread message count
router.get("/messages/unread-count", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [pendingRequestsCount, unreadMessagesCount] = await Promise.all([
      prisma.messageRequest.count({
        where: { toUserId: userId, status: "pending" }
      }),
      prisma.directMessage.count({
        where: { toUserId: userId, isRead: false }
      })
    ]);

    res.json({
      success: true,
      pendingRequests: pendingRequestsCount,
      unreadMessages: unreadMessagesCount,
      total: pendingRequestsCount + unreadMessagesCount
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

export default router;