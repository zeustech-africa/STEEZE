import express from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const router = express.Router();
const prisma = new PrismaClient();

// Calculate age from birth date
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Helper to get user's age from DB
async function getUserAge(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { birthDate: true }
  });
  if (!user || !user.birthDate) return null;
  return calculateAge(user.birthDate);
}

// POST /api/age-verification/verify-age - Save birth date during signup
router.post('/verify-age', async (req, res) => {
  try {
    const { birthDate, userId } = req.body;

    if (!birthDate || !userId) {
      return res.status(400).json({ success: false, message: 'Birth date and user ID are required.' });
    }

    const age = calculateAge(birthDate);

    if (age < 13) {
      // Mark user as under 13 - account should be blocked
      await prisma.user.update({
        where: { id: userId },
        data: {
          birthDate: new Date(birthDate),
          isUnder13: true,
          ageVerifiedAt: new Date()
        }
      });
      return res.status(400).json({
        success: false,
        message: 'Users must be at least 13 years old to use STEEZE.'
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        birthDate: new Date(birthDate),
        isUnder13: false,
        ageVerifiedAt: new Date()
      }
    });

    // If under 18, require parental consent
    if (age < 18) {
      return res.json({ success: true, requiresParentalConsent: true, age });
    }

    res.json({ success: true, requiresParentalConsent: false, age });
  } catch (error) {
    console.error('Age verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during age verification.' });
  }
});

// POST /api/age-verification/parental-consent/request - Send parental consent request
router.post('/parental-consent/request', async (req, res) => {
  try {
    const { childId, parentEmail, method } = req.body;

    if (!childId || !parentEmail || !method) {
      return res.status(400).json({ success: false, message: 'Child ID, parent email, and consent method are required.' });
    }

    const consentCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.parentalConsent.create({
      data: {
        childId,
        parentId: '', // Will be filled when parent approves
        consentMethod: method,
        expiresAt,
        status: 'pending',
      }
    });

    // Send email to parent if SMTP credentials are configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: true,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        await transporter.sendMail({
          from: `"STEEZE Safety" <${process.env.SMTP_USER}>`,
          to: parentEmail,
          subject: 'Parental Consent Request for STEEZE',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #D4AF37;">STEEZE - Parental Consent Required</h2>
              <p>A child has requested to join STEEZE and needs your approval.</p>
              <p>Your consent code is: <strong style="font-size: 24px; color: #D4AF37;">${consentCode}</strong></p>
              <p>This code expires in 7 days.</p>
              <p>Visit <a href="${process.env.APP_URL || 'https://steeze.app'}/parental-consent?code=${consentCode}">${process.env.APP_URL || 'https://steeze.app'}/parental-consent</a> to approve.</p>
              <hr style="border-color: #333; margin: 20px 0;" />
              <p style="color: #666; font-size: 12px;">STEEZE Safety Team - Verified Entertainment Platform</p>
            </div>
          `
        });
      } catch (emailError) {
        console.warn('Failed to send parental consent email:', emailError.message);
      }
    }

    res.json({ success: true, consentCode, message: 'Consent request sent. Parent will receive email with consent code.' });
  } catch (error) {
    console.error('Parental consent request error:', error);
    res.status(500).json({ success: false, message: 'Server error processing consent request.' });
  }
});

// POST /api/age-verification/parental-consent/approve - Approve parental consent
router.post('/parental-consent/approve', async (req, res) => {
  try {
    const { code, parentId } = req.body;

    if (!code || !parentId) {
      return res.status(400).json({ success: false, message: 'Consent code and parent ID are required.' });
    }

    const consent = await prisma.parentalConsent.findFirst({
      where: {
        id: code,
        status: 'pending',
        expiresAt: { gte: new Date() }
      }
    });

    if (!consent) {
      return res.status(404).json({ success: false, message: 'Invalid or expired consent code.' });
    }

    await prisma.parentalConsent.update({
      where: { id: consent.id },
      data: {
        status: 'active',
        parentId,
        consentGivenAt: new Date()
      }
    });

    // Link child to parent
    await prisma.user.update({
      where: { id: consent.childId },
      data: {
        parentId,
        parentalControlEnabled: true
      }
    });

    // Update parent's childIds array
    const parent = await prisma.user.findUnique({ where: { id: parentId } });
    const updatedChildIds = [...new Set([...(parent?.childIds || []), consent.childId])];
    await prisma.user.update({
      where: { id: parentId },
      data: { childIds: updatedChildIds }
    });

    res.json({ success: true, message: 'Consent approved. Child account is now linked.' });
  } catch (error) {
    console.error('Parental consent approval error:', error);
    res.status(500).json({ success: false, message: 'Server error approving consent.' });
  }
});

// GET /api/age-verification/parent/children - Get parent's linked children
router.get('/parent/children', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['user-id'];

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { childIds: true }
    });

    if (!user || !user.childIds.length) {
      return res.json({ success: true, children: [] });
    }

    const children = await prisma.user.findMany({
      where: { id: { in: user.childIds } },
      select: { id: true, artistName: true, displayName: true, email: true, birthDate: true }
    });

    const childrenWithAge = children.map(child => ({
      ...child,
      age: child.birthDate ? calculateAge(child.birthDate) : null,
      name: child.artistName || child.displayName || child.email || 'Unknown'
    }));

    res.json({ success: true, children: childrenWithAge });
  } catch (error) {
    console.error('Fetch children error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching children.' });
  }
});

// DELETE /api/age-verification/parent/children/:childId - Unlink a child
router.delete('/parent/children/:childId', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['user-id'];
    const { childId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Remove child from parent's childIds
    const parent = await prisma.user.findUnique({ where: { id: userId } });
    const updatedChildIds = (parent?.childIds || []).filter(id => id !== childId);
    await prisma.user.update({
      where: { id: userId },
      data: { childIds: updatedChildIds }
    });

    // Remove parent link from child
    await prisma.user.update({
      where: { id: childId },
      data: { parentId: null, parentalControlEnabled: false }
    });

    // Revoke any active parental consents
    await prisma.parentalConsent.updateMany({
      where: { childId, status: 'active' },
      data: { status: 'revoked', revokedAt: new Date(), revokedReason: 'Parent unlinked child' }
    });

    res.json({ success: true, message: 'Child unlinked successfully.' });
  } catch (error) {
    console.error('Unlink child error:', error);
    res.status(500).json({ success: false, message: 'Server error unlinking child.' });
  }
});

// POST /api/age-verification/parent/link-child - Link a child via code
router.post('/parent/link-child', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['user-id'];
    const { childCode } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!childCode) {
      return res.status(400).json({ success: false, message: 'Child linking code is required.' });
    }

    // Find child by linking code (using the consent record or user ID)
    const consent = await prisma.parentalConsent.findFirst({
      where: { id: childCode, status: 'active' }
    });

    if (!consent) {
      return res.status(404).json({ success: false, message: 'Invalid linking code. Make sure you received a valid code from the child account.' });
    }

    // Link child to parent
    await prisma.user.update({
      where: { id: consent.childId },
      data: { parentId: userId, parentalControlEnabled: true }
    });

    // Update consent record
    await prisma.parentalConsent.update({
      where: { id: consent.id },
      data: { parentId: userId }
    });

    // Update parent's childIds
    const parent = await prisma.user.findUnique({ where: { id: userId } });
    const updatedChildIds = [...new Set([...(parent?.childIds || []), consent.childId])];
    await prisma.user.update({
      where: { id: userId },
      data: { childIds: updatedChildIds }
    });

    res.json({ success: true, message: 'Child linked successfully.' });
  } catch (error) {
    console.error('Link child error:', error);
    res.status(500).json({ success: false, message: 'Server error linking child.' });
  }
});

// PUT /api/age-verification/content-filter - Update content filter level
router.put('/content-filter', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['user-id'];
    const { filterLevel } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!['none', 'moderate', 'strict'].includes(filterLevel)) {
      return res.status(400).json({ success: false, message: 'Invalid filter level. Use: none, moderate, or strict.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { contentFilterLevel: filterLevel }
    });

    res.json({ success: true, filterLevel });
  } catch (error) {
    console.error('Content filter update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating content filter.' });
  }
});

// GET /api/age-verification/content-filter - Get content filter level
router.get('/content-filter', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['user-id'];

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { contentFilterLevel: true }
    });

    res.json({ success: true, filterLevel: user?.contentFilterLevel || 'none' });
  } catch (error) {
    console.error('Content filter fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching content filter.' });
  }
});

// PUT /api/age-verification/posts/:id/age-restrict - Mark post as age-restricted
router.put('/posts/:id/age-restrict', async (req, res) => {
  try {
    const { id } = req.params;
    const { isAgeRestricted } = req.body;

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    await prisma.post.update({
      where: { id },
      data: { isAgeRestricted: isAgeRestricted === true }
    });

    res.json({ success: true, isAgeRestricted: isAgeRestricted === true });
  } catch (error) {
    console.error('Age restrict post error:', error);
    res.status(500).json({ success: false, message: 'Server error updating age restriction.' });
  }
});

// GET /api/age-verification/user-age/:userId - Get a user's age
router.get('/user-age/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const age = await getUserAge(userId);

    if (age === null) {
      return res.json({ success: true, age: null, verified: false });
    }

    res.json({ success: true, age, verified: true });
  } catch (error) {
    console.error('User age fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user age.' });
  }
});

export default router;