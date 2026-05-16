import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, role: true, isBanned: true, isSuspended: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      if (user.isBanned) {
        return next(new Error('Account is banned'));
      }

      if (user.isSuspended && user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
        return next(new Error('Account is suspended'));
      }

      socket.userId = user.id;
      socket.username = user.username;
      socket.userRole = user.role;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.username} (${socket.userId})`);

    // Join user's personal room for direct notifications
    socket.join(`user:${socket.userId}`);

    // Join role-based rooms
    if (socket.userRole === 'admin' || socket.userRole === 'super_admin') {
      socket.join('admin:alerts');
    }

    // Handle typing indicators (future)
    socket.on('typing:start', (data) => {
      if (data.recipientId) {
        socket.to(`user:${data.recipientId}`).emit('typing:start', {
          userId: socket.userId,
          username: socket.username,
        });
      }
    });

    socket.on('typing:stop', (data) => {
      if (data.recipientId) {
        socket.to(`user:${data.recipientId}`).emit('typing:stop', {
          userId: socket.userId,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User disconnected: ${socket.username} (${socket.userId}) - Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket] Error for ${socket.username}:`, error.message);
    });
  });

  console.log('[Socket] Socket.io initialized successfully');
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket() first.');
  }
  return io;
}

// Emit notification to a specific user
export function emitNotification(userId, notification) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', notification);
}

// Emit post update to all watching users
export function emitPostUpdate(postId, update) {
  if (!io) return;
  io.to(`post:${postId}`).emit('post:update', update);
}

// Join a user to a post room (for live updates like comments, likes)
export function joinPostRoom(socket, postId) {
  socket.join(`post:${postId}`);
}

// Emit to admins
export function emitAdminAlert(alert) {
  if (!io) return;
  io.to('admin:alerts').emit('admin:alert', alert);
}

// Broadcast system message to all connected users
export function broadcastSystemMessage(message) {
  if (!io) return;
  io.emit('system:message', message);
}

// Send real-time stats update
export function emitStatsUpdate(type, data) {
  if (!io) return;
  io.emit(`stats:${type}`, data);
}

export default { initSocket, getIO, emitNotification, emitPostUpdate, joinPostRoom, emitAdminAlert, broadcastSystemMessage, emitStatsUpdate };