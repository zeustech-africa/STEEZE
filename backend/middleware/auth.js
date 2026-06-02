import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'steeze-secret-key-2025';

/**
 * optionalAuth - Like authenticateToken but doesn't reject unauthenticated requests.
 * Sets req.user if a valid token is present, otherwise continues without error.
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

    if (user && !user.isBanned && !user.isSuspended) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        userType: decoded.userType,
        ...user,
      };
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * authenticateToken - Cookie-first auth middleware.
 * Reads accessToken from HttpOnly cookie, falls back to Authorization header.
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Prefer HttpOnly cookie, fall back to Authorization header for backward compat
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
 * requireRole - RBAC middleware that checks UserRole records.
 * @param {string[]} allowedRoles - Array of role names to allow
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required', success: false });
      }

      const userRoles = await prisma.userRole.findMany({
        where: {
          userId,
          revokedAt: null
        }
      });

      const userRoleNames = userRoles.map(r => r.role);
      const hasRole = allowedRoles.some(role => userRoleNames.includes(role));

      if (!hasRole) {
        return res.status(403).json({ error: 'Insufficient permissions', success: false });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Permission check failed', success: false });
    }
  };
};

// Convenience middleware for specific role groups
export const requireAdmin = requireRole([
  'super_admin', 'moderator', 'verification_admin', 'finance_admin', 'support_admin'
]);
export const requireSuperAdmin = requireRole(['super_admin']);
export const requireVerificationAdmin = requireRole(['super_admin', 'verification_admin']);
export const requireFinanceAdmin = requireRole(['super_admin', 'finance_admin']);

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
      include: { userRoles: { where: { revokedAt: null } } }
    });

    if (!user) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    // Check if user has any admin role via UserRole model OR legacy role field
    const isAdmin = user.userRoles?.length > 0 || user.role === 'admin';

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