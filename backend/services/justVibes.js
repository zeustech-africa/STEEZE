import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: Session duration in milliseconds (1 hour)
const SESSION_DURATION_MS = 60 * 60 * 1000;

// AUDIT: Cooldown duration in milliseconds (3 hours)
const COOLDOWN_DURATION_MS = 3 * 60 * 60 * 1000;

// AUDIT: JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'steeze-jwt-secret-production-2026';

// AUDIT: Create a new session for a Just VIBES user
export async function createSession(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const now = new Date();
  const expiryTime = new Date(now.getTime() + SESSION_DURATION_MS);
  const cooldownEndsAt = new Date(expiryTime.getTime() + COOLDOWN_DURATION_MS);

  // First, expire any existing active sessions
  await prisma.justVibesSession.updateMany({
    where: {
      userId,
      status: 'active'
    },
    data: {
      status: 'expired',
      endTime: now
    }
  });

  // Create new session
  const session = await prisma.justVibesSession.create({
    data: {
      userId,
      startTime: now,
      expiryTime,
      cooldownEndsAt,
      status: 'active'
    }
  });

  return session;
}

// AUDIT: Validate if a session is still active
export async function validateSession(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const now = new Date();

  // Find active session
  const session = await prisma.justVibesSession.findFirst({
    where: {
      userId,
      status: 'active',
      expiryTime: { gt: now }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!session) {
    return { valid: false, reason: 'no_active_session' };
  }

  // Check if session has expired
  if (new Date(session.expiryTime) <= now) {
    await expireSession(session.id);
    return { valid: false, reason: 'session_expired' };
  }

  return {
    valid: true,
    session,
    remainingMs: new Date(session.expiryTime).getTime() - now.getTime(),
    remainingMinutes: Math.ceil((new Date(session.expiryTime).getTime() - now.getTime()) / 60000)
  };
}

// AUDIT: Check if user is in cooldown period
export async function checkCooldown(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const now = new Date();

  // Find most recent session (active or expired)
  const lastSession = await prisma.justVibesSession.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastSession) {
    return { inCooldown: false, remainingMs: 0, remainingMinutes: 0 };
  }

  if (lastSession.status === 'active') {
    return { inCooldown: false, remainingMs: 0, remainingMinutes: 0 };
  }

  if (lastSession.cooldownEndsAt && new Date(lastSession.cooldownEndsAt) > now) {
    const remainingMs = new Date(lastSession.cooldownEndsAt).getTime() - now.getTime();
    return {
      inCooldown: true,
      remainingMs,
      remainingMinutes: Math.ceil(remainingMs / 60000),
      cooldownEndsAt: lastSession.cooldownEndsAt
    };
  }

  return { inCooldown: false, remainingMs: 0, remainingMinutes: 0 };
}

// AUDIT: Get remaining time in current session
export async function getRemainingTime(userId) {
  const validation = await validateSession(userId);
  if (!validation.valid) {
    return { hasActiveSession: false, remainingMinutes: 0, reason: validation.reason };
  }

  return {
    hasActiveSession: true,
    remainingMinutes: validation.remainingMinutes,
    remainingMs: validation.remainingMs,
    expiryTime: validation.session.expiryTime
  };
}

// AUDIT: Expire a session
export async function expireSession(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Invalid sessionId');
  }

  const updated = await prisma.justVibesSession.update({
    where: { id: sessionId },
    data: {
      status: 'expired',
      endTime: new Date()
    }
  });

  return updated;
}

// AUDIT: Check if user can start a new session
export async function canStartNewSession(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  // Check if user has any existing session
  const lastSession = await prisma.justVibesSession.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastSession) {
    return { canStart: true, reason: 'first_session' };
  }

  // Check if currently in cooldown
  const cooldownCheck = await checkCooldown(userId);
  if (cooldownCheck.inCooldown) {
    return {
      canStart: false,
      reason: 'cooldown',
      remainingMinutes: cooldownCheck.remainingMinutes,
      cooldownEndsAt: cooldownCheck.cooldownEndsAt
    };
  }

  return { canStart: true, reason: 'cooldown_complete' };
}

// AUDIT: Login Just VIBES user
export async function loginJustVibes(email, password, ipAddress = null, userAgent = null) {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email');
  }
  if (!password || typeof password !== 'string') {
    throw new Error('Invalid password');
  }

  // Find user
  const user = await prisma.justVibesUser.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check status
  if (user.status === 'pending') {
    throw new Error('Your account is pending admin approval. Please check back later.');
  }

  if (user.status === 'rejected') {
    throw new Error('Your account request was rejected. Please contact support for more information.');
  }

  if (user.status === 'expired') {
    throw new Error('Your account has expired. Please contact support.');
  }

  if (user.status !== 'approved') {
    throw new Error('Account not authorized for login');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Check if user can start a new session
  const canStart = await canStartNewSession(user.id);
  if (!canStart.canStart) {
    throw new Error(`Cannot start new session. Please wait ${canStart.remainingMinutes} minutes for cooldown to complete.`);
  }

  // Create new session
  const session = await createSession(user.id);

  // Generate JWT token (expires with session)
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'just_vibes',
      sessionId: session.id
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      status: user.status,
      type: 'just_vibes'
    },
    session: {
      id: session.id,
      startTime: session.startTime,
      expiryTime: session.expiryTime,
      remainingMinutes: SESSION_DURATION_MS / 60000
    },
    token
  };
}

export default {
  createSession,
  validateSession,
  checkCooldown,
  getRemainingTime,
  expireSession,
  canStartNewSession,
  loginJustVibes,
  SESSION_DURATION_MS,
  COOLDOWN_DURATION_MS
};