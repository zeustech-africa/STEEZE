import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Permission matrix
const permissions = {
  super_admin: ['*'], // full access
  
  admin: [
    'users:read', 'users:update', 'users:ban', 'users:suspend',
    'posts:read', 'posts:update', 'posts:approve', 'posts:reject', 'posts:delete',
    'financial:read', 'financial:process_payouts',
    'distribution:read', 'distribution:manage',
    'verification:read', 'verification:approve', 'verification:reject',
    'reports:read', 'reports:resolve',
    'broadcast:send', 'calendar:read', 'calendar:manage',
    'settings:read', 'settings:update',
    'security:read', 'security:update',
  ],
  
  content_moderator: [
    'posts:read', 'posts:approve', 'posts:reject', 'posts:delete',
    'comments:read', 'comments:delete',
    'reports:read', 'reports:resolve',
    'users:view_profile',
  ],
  
  financial_manager: [
    'financial:read', 'financial:process_payouts', 'financial:export',
    'users:view_profile',
  ],
  
  financial_analyst: [
    'financial:read',
    'users:view_profile',
  ],
  
  support_agent: [
    'users:read', 'users:view_profile',
    'verification:read', 'verification:approve', 'verification:reject',
    'posts:read',
    'comments:read',
  ],
  
  viewer: [
    'users:read',
    'posts:read',
    'financial:read',
  ],
  
  api_key_manager: [
    'distribution:read', 'distribution:manage',
    'webhooks:read', 'webhooks:manage',
  ],
};

export function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const admin = await prisma.adminUser.findUnique({
        where: { userId: req.user.id }
      });
      
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      
      const userPermissions = permissions[admin.role] || [];
      
      if (userPermissions.includes('*') || userPermissions.includes(permission)) {
        return next();
      }
      
      res.status(403).json({ success: false, message: `Permission denied: ${permission} required` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
}

export function requireRole(role) {
  return async (req, res, next) => {
    try {
      const admin = await prisma.adminUser.findUnique({
        where: { userId: req.user.id }
      });
      
      if (!admin || admin.role !== role) {
        return res.status(403).json({ success: false, message: `Role ${role} required` });
      }
      
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
}