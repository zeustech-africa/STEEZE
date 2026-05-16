import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const CONTRACT_TEXT = `
ZEUSLIVESTUDIO ARTIST MANAGEMENT AGREEMENT

This agreement is between ZeusLiveStudio (the "Management Company") and the Artist (the "Creator").

1. NATURE OF AGREEMENT
   - This is a non-exclusive, non-binding management agreement
   - Artist can terminate anytime without penalty
   - No time commitment or exclusivity required

2. WHAT WE DO
   - We promote content you provide to us
   - We distribute your music to streaming platforms
   - We monetize your content on STEEZE platform
   - We do NOT control your creative process
   - We do NOT pay for your content creation

3. REVENUE SHARING
   - Platform Revenue (STEEZE): 50% Artist / 50% ZeusLiveStudio
   - Distribution Revenue (Streaming): 50% Artist / 50% ZeusLiveStudio
   - All other revenue (gigs, endorsements, album sales, merchandise):
     * 100% Artist if we were not involved
     * 50% Artist / 50% ZeusLiveStudio if we facilitated the deal

4. YOUR BENEFITS
   - Free access to STEEZE platform (no subscription fees)
   - "ZeusLiveStudio Artist" badge on all content
   - Special profile branding and verification
   - Priority distribution to all channels
   - Dedicated admin support

5. TERMINATION
   - You can switch to Independent Creator anytime
   - No penalties, no fees, no questions asked
   - After switching: 70/30 revenue split applies
   - You keep all your content and followers

6. AGREEMENT
   By typing "I AGREE" and providing your e-signature below,
   you acknowledge that you have read and understood this agreement.

   Artist E-Signature: ______________
   Date: ______________
`;

// Submit contract for ZLS artist
router.post('/', async (req, res) => {
  try {
    const { agreedText, signature } = req.body;
    const userId = req.user.id;

    // Check if contract already exists
    const existing = await prisma.contract.findUnique({ where: { creatorId: userId } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Contract already exists for this user' });
    }

    const contract = await prisma.contract.create({
      data: {
        creatorId: userId,
        agreementText: CONTRACT_TEXT,
        agreedText,
        eSignature: signature,
        signedAt: new Date(),
        ipAddress: req.ip,
        status: 'pending',
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        userType: 'zls_artist',
        contractStatus: 'pending',
      },
    });

    res.json({ success: true, contractId: contract.id });
  } catch (error) {
    console.error('Contract creation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get pending contracts
router.get('/admin/pending', async (req, res) => {
  try {
    const contracts = await prisma.contract.findMany({
      where: { status: 'pending' },
      include: { creator: { select: { id: true, artistName: true, email: true, profilePicUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, contracts });
  } catch (error) {
    console.error('Get pending contracts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get contracts by status
router.get('/admin/status/:status', async (req, res) => {
  try {
    const { status } = req.params; // pending, approved, rejected, terminated
    const contracts = await prisma.contract.findMany({
      where: { status },
      include: { creator: { select: { id: true, artistName: true, email: true, profilePicUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, contracts });
  } catch (error) {
    console.error('Get contracts by status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Approve contract
router.post('/admin/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.contract.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date(),
      },
    });

    const contract = await prisma.contract.findUnique({ where: { id } });

    await prisma.user.update({
      where: { id: contract.creatorId },
      data: {
        userType: 'zls_artist',
        contractStatus: 'active',
        zlsBadgeEnabled: true,
        zlsWatermarkEnabled: true,
        autoDistribution: true, // Auto-enable distribution for ZLS artists
        revenueSplit: 50,
        platformSplit: 50,
        isVerified: true,
        verificationStatus: 'approved',
        zlsVerifiedAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Approve contract error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Reject contract
router.post('/admin/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await prisma.contract.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedReason: reason,
      },
    });

    const contract = await prisma.contract.findUnique({ where: { id } });

    await prisma.user.update({
      where: { id: contract.creatorId },
      data: {
        userType: 'vibe',
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Reject contract error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get users by type (SECTION FILTERS)
router.get('/admin/users/:type', async (req, res) => {
  try {
    const { type } = req.params; // zls_artist, independent_creator, vibe
    const users = await prisma.user.findMany({
      where: { userType: type },
      include: {
        contract: type === 'zls_artist',
        creatorSubscription: type === 'independent_creator',
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, users, count: users.length });
  } catch (error) {
    console.error('Get users by type error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get all user type counts for dashboard
router.get('/admin/user-counts', async (req, res) => {
  try {
    const [zlsCount, independentCount, vibeCount] = await Promise.all([
      prisma.user.count({ where: { userType: 'zls_artist' } }),
      prisma.user.count({ where: { userType: 'independent_creator' } }),
      prisma.user.count({ where: { userType: 'vibe' } }),
    ]);

    res.json({
      success: true,
      counts: {
        zls_artist: zlsCount,
        independent_creator: independentCount,
        vibe: vibeCount,
      },
    });
  } catch (error) {
    console.error('Get user counts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Creator: Request upgrade to ZLS (from Independent)
router.post('/upgrade-to-zls', async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is currently an independent creator
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.userType !== 'independent_creator') {
      return res.status(400).json({ success: false, message: 'Only independent creators can request upgrade to ZLS' });
    }

    // Check if a contract already exists
    const existing = await prisma.contract.findUnique({ where: { creatorId: userId } });
    if (existing && existing.status === 'pending') {
      return res.status(400).json({ success: false, message: 'You already have a pending upgrade request' });
    }
    if (existing && existing.status === 'approved') {
      return res.status(400).json({ success: false, message: 'You are already a ZLS artist' });
    }

    // If previously terminated, update existing contract; otherwise create new
    if (existing) {
      await prisma.contract.update({
        where: { creatorId: userId },
        data: {
          status: 'pending',
          agreementText: CONTRACT_TEXT,
          agreedText: 'I AGREE',
          eSignature: user.artistName || user.username,
          signedAt: new Date(),
          ipAddress: req.ip,
          rejectedReason: null,
          terminatedAt: null,
          terminatedReason: null,
        },
      });
    } else {
      await prisma.contract.create({
        data: {
          creatorId: userId,
          agreementText: CONTRACT_TEXT,
          agreedText: 'I AGREE',
          eSignature: user.artistName || user.username,
          signedAt: new Date(),
          ipAddress: req.ip,
          status: 'pending',
        },
      });
    }

    // Update user's contract status
    await prisma.user.update({
      where: { id: userId },
      data: { contractStatus: 'pending' },
    });

    res.json({ success: true, message: 'Upgrade request submitted. Admin will review your application.' });
  } catch (error) {
    console.error('Upgrade to ZLS error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Creator: Exit to Independent
router.post('/exit-to-independent', async (req, res) => {
  try {
    const userId = req.user.id;

    const existingContract = await prisma.contract.findUnique({ where: { creatorId: userId } });
    if (existingContract) {
      await prisma.contract.update({
        where: { creatorId: userId },
        data: {
          status: 'terminated',
          terminatedAt: new Date(),
          terminatedReason: 'User switched to independent',
        },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        userType: 'independent_creator',
        contractStatus: 'terminated',
        zlsBadgeEnabled: false,
        zlsWatermarkEnabled: false,
        autoDistribution: false,
        revenueSplit: 70,
        platformSplit: 30,
      },
    });

    res.json({ success: true, message: 'You are now an independent creator. 70/30 revenue split applies.' });
  } catch (error) {
    console.error('Exit to independent error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;