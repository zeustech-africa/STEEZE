import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Check if user has access to a feature based on their userType
export function requireFeatureAccess(feature) {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { creatorSubscription: true }
      });
      
      // ZeusLiveStudio artists have FULL access to everything
      if (user.userType === 'zls_artist') {
        return next();
      }
      
      // Independent creators need active subscription
      if (user.userType === 'independent_creator') {
        const hasActiveSubscription = user.creatorSubscription?.status === 'active';
        if (hasActiveSubscription) {
          return next();
        }
        return res.status(403).json({
          success: false,
          message: 'Active subscription required for this feature. Please subscribe to continue.',
          requiresSubscription: true
        });
      }
      
      // VIBES cannot access creator features
      if (user.userType === 'vibe') {
        return res.status(403).json({
          success: false,
          message: 'This feature is only available for creators. Switch to creator account to access.'
        });
      }
      
      return res.status(403).json({ success: false, message: 'Access denied' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
}

// Check if user is a ZLS artist (for special features)
export function requireZLSArtist() {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      
      if (user.userType === 'zls_artist') {
        return next();
      }
      
      res.status(403).json({
        success: false,
        message: 'This feature is only available for ZeusLiveStudio artists.'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
}