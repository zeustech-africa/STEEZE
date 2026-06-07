import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all feature flags
export async function getAllFeatureFlags(onlyActive = false) {
  const where = {};
  if (onlyActive) {
    where.isActive = true;
  }
  
  const flags = await prisma.featureFlag.findMany({
    where,
    orderBy: { key: 'asc' }
  });
  
  return flags;
}

// Get single feature flag by key
export async function getFeatureFlag(key) {
  const flag = await prisma.featureFlag.findUnique({
    where: { key }
  });
  return flag;
}

// Check if a feature is enabled
export async function isFeatureEnabled(key) {
  const flag = await prisma.featureFlag.findUnique({
    where: { key }
  });
  return flag?.enabled === true && flag?.isActive === true;
}

// Create a new feature flag
export async function createFeatureFlag(key, name, description, createdBy, enabled = false) {
  // Check if flag already exists
  const existing = await prisma.featureFlag.findUnique({
    where: { key }
  });
  
  if (existing) {
    throw new Error(`Feature flag with key '${key}' already exists`);
  }
  
  const flag = await prisma.featureFlag.create({
    data: {
      key,
      name,
      description,
      createdBy,
      enabled
    }
  });
  
  return flag;
}

// Update feature flag
export async function updateFeatureFlag(key, updates) {
  const flag = await prisma.featureFlag.update({
    where: { key },
    data: {
      ...updates,
      updatedAt: new Date()
    }
  });
  
  return flag;
}

// Enable a feature flag
export async function enableFeature(key) {
  const flag = await prisma.featureFlag.update({
    where: { key },
    data: {
      enabled: true,
      updatedAt: new Date()
    }
  });
  return flag;
}

// Disable a feature flag
export async function disableFeature(key) {
  const flag = await prisma.featureFlag.update({
    where: { key },
    data: {
      enabled: false,
      updatedAt: new Date()
    }
  });
  return flag;
}

// Delete a feature flag
export async function deleteFeatureFlag(key) {
  await prisma.featureFlag.delete({
    where: { key }
  });
  return true;
}

// Get feature flag statistics
export async function getFeatureFlagStats() {
  const [total, enabled, disabled, active] = await Promise.all([
    prisma.featureFlag.count(),
    prisma.featureFlag.count({ where: { enabled: true } }),
    prisma.featureFlag.count({ where: { enabled: false } }),
    prisma.featureFlag.count({ where: { isActive: true } })
  ]);
  
  return { total, enabled, disabled, active };
}

// ============ ADVANCED FEATURE FLAG TARGETING ============

// Check if a user has access to a feature (with targeting)
export async function userHasFeatureAccess(userId, featureKey) {
  // First check if user has explicit access granted
  const userAccess = await prisma.userFeatureAccess.findUnique({
    where: {
      userId_featureKey: {
        userId,
        featureKey
      }
    }
  });
  
  if (userAccess?.accessGranted && !userAccess.revokedAt) {
    // Check if expired
    if (userAccess.expiresAt && new Date(userAccess.expiresAt) < new Date()) {
      return false;
    }
    return true;
  }
  
  // Get the feature flag
  const flag = await prisma.featureFlag.findUnique({
    where: { key: featureKey }
  });
  
  if (!flag || !flag.enabled || !flag.isActive) {
    return false;
  }
  
  // Check role targeting
  if (flag.targetRoles && Array.isArray(flag.targetRoles) && flag.targetRoles.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, userType: true }
    });
    
    if (user && !flag.targetRoles.includes(user.role) && !flag.targetRoles.includes(user.userType)) {
      return false;
    }
  }
  
  // Check specific user targeting
  if (flag.targetUsers && Array.isArray(flag.targetUsers) && flag.targetUsers.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, id: true }
    });
    
    const isTargeted = flag.targetUsers.includes(user?.id) || flag.targetUsers.includes(user?.email);
    if (!isTargeted) {
      return false;
    }
  }
  
  // Check percentage rollout
  if (flag.targetPercentage && flag.targetPercentage > 0 && flag.targetPercentage < 100) {
    // Use deterministic hash based on userId to ensure consistent experience
    const hash = hashString(`${userId}-${featureKey}`);
    const percentile = hash % 100;
    if (percentile >= flag.targetPercentage) {
      return false;
    }
  }
  
  // Check beta access code (if enabled)
  if (flag.betaAccessEnabled && flag.betaAccessCode) {
    // User must have used the access code
    const accessRecord = await prisma.userFeatureAccess.findFirst({
      where: {
        userId,
        featureKey,
        accessCode: flag.betaAccessCode
      }
    });
    
    if (!accessRecord) {
      return false;
    }
  }
  
  return true;
}

// Simple hash function for consistent user assignment
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Grant explicit feature access to a user
export async function grantUserFeatureAccess(userId, featureKey, grantedBy, expiresAt = null, accessCode = null) {
  const userAccess = await prisma.userFeatureAccess.upsert({
    where: {
      userId_featureKey: {
        userId,
        featureKey
      }
    },
    update: {
      accessGranted: true,
      grantedBy,
      grantedAt: new Date(),
      expiresAt,
      revokedAt: null,
      revokedBy: null,
      accessCode
    },
    create: {
      userId,
      featureKey,
      accessGranted: true,
      grantedBy,
      grantedAt: new Date(),
      expiresAt,
      accessCode
    }
  });
  
  return userAccess;
}

// Revoke feature access from a user
export async function revokeUserFeatureAccess(userId, featureKey, revokedBy) {
  const userAccess = await prisma.userFeatureAccess.update({
    where: {
      userId_featureKey: {
        userId,
        featureKey
      }
    },
    data: {
      accessGranted: false,
      revokedAt: new Date(),
      revokedBy
    }
  });
  
  return userAccess;
}

// Update feature flag with targeting settings
export async function updateFeatureTargeting(key, updates) {
  const flag = await prisma.featureFlag.update({
    where: { key },
    data: {
      ...updates,
      updatedAt: new Date()
    }
  });
  
  return flag;
}

// Get users with access to a specific feature
export async function getFeatureUsers(featureKey, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    prisma.userFeatureAccess.findMany({
      where: {
        featureKey,
        accessGranted: true,
        revokedAt: null
      },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, username: true, role: true }
        }
      },
      orderBy: { grantedAt: 'desc' }
    }),
    prisma.userFeatureAccess.count({
      where: {
        featureKey,
        accessGranted: true,
        revokedAt: null
      }
    })
  ]);
  
  return { users, total, page, limit };
}

// Validate and use beta access code
export async function useBetaAccessCode(userId, featureKey, accessCode) {
  const flag = await prisma.featureFlag.findUnique({
    where: { key: featureKey }
  });
  
  if (!flag || !flag.betaAccessEnabled || flag.betaAccessCode !== accessCode) {
    return { success: false, message: 'Invalid access code' };
  }
  
  const access = await grantUserFeatureAccess(userId, featureKey, 'system', null, accessCode);
  return { success: true, access };
}
