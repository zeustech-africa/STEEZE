import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'steeze-secret-key-2025';

/**
 * authenticateToken - Verifies JWT token and attaches user to req.user.
 */
export const authenticateToken = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token) {
      token = req.headers.authorization?.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.', success: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session exists
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.id,
        expiresAt: { gt: new Date() }
      }
    });

    if (session) {
      // Update last active timestamp
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() }
      }).catch(() => {}); // Silently fail - non-critical update
    }

    // Fetch the user to attach full user object with roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        userType: true,
        role: true,
        artistName: true,
        profilePicUrl: true,
        verificationStatus: true,
        isBanned: true,
        isSuspended: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found', success: false });
    }

    if (user.isBanned || user.isSuspended) {
      return res.status(403).json({ error: 'Account is suspended or banned', success: false });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType,
      ...user,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', success: false });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token', success: false });
    }
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed', success: false });
  }
};

/**
 * requireAdmin - Simple admin check middleware that verifies the user has admin userType.
 */
export const requireAdmin = (req, res, next) => {
  try {
    const userType = req.user?.userType;
    if (!userType || userType !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions', success: false });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Permission check failed', success: false });
  }
};

export const requireSuperAdmin = requireAdmin;
export const requireVerificationAdmin = requireAdmin;
export const requireFinanceAdmin = requireAdmin;
export const requireSupportAdmin = requireAdmin;
export const requireRole = () => requireAdmin;

// Check if user has any admin privilege
export async function checkAdminAccess(userId) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { userType: true } });
    return user?.userType === 'admin';
  } catch {
    return false;
  }
}

// Check if user has specific role
export async function hasRole(userId, roleName) {
  return checkAdminAccess(userId);
}

// ---- Backward-compatible exports (used by existing admin routes) ----

/**
 * authenticateAdmin - Legacy middleware for admin routes.
 * Uses cookie-first auth then checks admin role.
 */
export const authenticateAdmin = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token) {
      token = req.headers.authorization?.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, userType: true, role: true }
    });

    if (!user) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const isAdmin = user.userType === 'admin' || user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    req.user = {
      ...user,
      id: user.id,
      email: user.email,
      userType: user.userType,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * authenticateAny - Cookie-first auth for non-admin routes.
 */
/**
 * optionalAuth - Authenticate if token present, continue without error if not.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token) {
      token = req.headers.authorization?.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (user) {
      req.user = {
        ...user,
        id: user.id,
        email: user.email,
        userType: user.userType,
      };
    }
    next();
  } catch (_error) {
    next();
  }
};

export const authenticateAny = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token) {
      token = req.headers.authorization?.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = {
      ...user,
      id: user.id,
      email: user.email,
      userType: user.userType,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};