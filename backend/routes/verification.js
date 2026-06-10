import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { uploadIDDocument, uploadSelfie } from '../services/upload.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { uploadFile } from '../services/storage.js';

const router = express.Router();
const prisma = new PrismaClient();

// TEMPORARY DEBUG - Check Prisma status
router.get('/debug-prisma', async (req, res) => {
  try {
    const test = await prisma.$queryRaw`SELECT 1 as test`;
    res.json({ 
      prismaAvailable: true, 
      test: test,
      pendingUserModelExists: !!(await prisma.pendingUser.count().catch(() => false))
    });
  } catch (error) {
    res.json({ 
      prismaAvailable: false, 
      error: error.message,
      errorName: error.name
    });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
const idDocumentsDir = path.join(uploadsDir, 'id-documents');
const selfiesDir = path.join(uploadsDir, 'selfies');

// Ensure upload directories exist
const uploadDirs = ['./uploads', './uploads/id-documents', './uploads/temp', './uploads/selfies'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const idDocumentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, idDocumentsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `id-doc-${unique}${path.extname(file.originalname)}`);
  }
});

const selfieStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, selfiesDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `selfie-${unique}.png`);
  }
});

const messageFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, messagesDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `message-${unique}${path.extname(file.originalname)}`);
  }
});

const uploadIdMulter = multer({ storage: idDocumentStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadSelfieMulter = multer({ storage: selfieStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadMessageFile = multer({ storage: messageFileStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Profile picture storage
const profilePicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'temp')),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `profile-${unique}${path.extname(file.originalname)}`);
  }
});

// Combined upload for register-step1 (idDocument + profilePic)
const uploadRegisterStep1 = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      if (file.fieldname === 'profilePic') {
        cb(null, './uploads/temp');
      } else {
        cb(null, './uploads/id-documents');
      }
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname);
      if (file.fieldname === 'profilePic') {
        cb(null, `profile-${unique}${ext}`);
      } else {
        cb(null, `id-doc-${unique}${ext}`);
      }
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.'));
    }
  }
});

// ============================================
// REGISTER STEP 1: ID DOCUMENT ONLY
// ============================================

router.post('/register-step1', uploadRegisterStep1.fields([{ name: 'idDocument', maxCount: 1 }, { name: 'profilePic', maxCount: 1 }]), async (req, res) => {
  try {
    const { 
      userType, email, password, fullName, username, phoneNumber, 
      artistName, genre, contractSigned, userData 
    } = req.body;
    
    const files = req.files;
    const idDocumentFile = files?.idDocument?.[0];
    const profilePicFile = files?.profilePic?.[0];
    
    // Validate required fields (phoneNumber is optional for VIBERS)
    if (!userType || !email || !password || !fullName) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }
    
    // Validate phone number format if provided
    if (phoneNumber && !phoneNumber.match(/^\+?[0-9\s\-\(\)]{8,20}$/)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    if (!idDocumentFile) {
      return res.status(400).json({ error: 'ID document is required' });
    }
    
    // Check if user already exists in any table
    const existingPending = await prisma.pendingUser.findUnique({ where: { email } });
    const existingApproved = await prisma.approvedUser.findUnique({ where: { email } });
    
    if (existingPending || existingApproved) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Parse userData if provided
    let parsedUserData = {};
    if (userData && typeof userData === 'string') {
      try {
        parsedUserData = JSON.parse(userData);
      } catch (e) {
        parsedUserData = {};
      }
    }
    
    // Process profile picture if provided
    let profilePicUrl = null;
    if (profilePicFile) {
      try {
        if (profilePicFile.size > 2 * 1024 * 1024) {
          // Still continue, just note the file is too large
          console.warn(`Profile picture too large for user ${userId}: ${profilePicFile.size} bytes`);
        } else {
          const imageBuffer = fs.readFileSync(profilePicFile.path);
          const croppedBuffer = await sharp(imageBuffer)
            .resize(400, 400, {
              fit: 'cover',
              position: 'centre'
            })
            .png()
            .toBuffer();
          const filename = `profiles/${userId}/avatar.png`;
          profilePicUrl = await uploadFile(croppedBuffer, filename, 'image/png');
        }
        // Clean up temp file
        fs.unlinkSync(profilePicFile.path);
      } catch (picError) {
        console.error('Profile picture processing error:', picError);
        // Continue without profile picture
      }
    }

    // Create pending user
    const newUser = await prisma.pendingUser.create({
      data: {
        id: userId,
        userType,
        email,
        password: hashedPassword,
        fullName,
        username: username || null,
        phoneNumber,
        artistName: artistName || null,
        genre: genre || null,
        contractSigned: contractSigned === 'true' || contractSigned === true,
        idDocumentUrl: `/uploads/id-documents/${idDocumentFile.filename}`,
        profilePicUrl: profilePicUrl,
        status: 'pending_selfie',
        userData: parsedUserData,
        registeredAt: new Date()
      }
    });
    
    console.log(`📝 Registration Step 1: ${fullName} (${email}) - Pending selfie`);
    
    res.status(201).json({
      success: true,
      message: 'ID uploaded successfully. Please take a selfie.',
      userId: newUser.id,
      nextStep: '/verification/selfie'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// UPLOAD SELFIE - STEP 2
// ============================================

router.post('/upload-selfie', uploadSelfieMulter.single('selfie'), async (req, res) => {
  try {
    const { userId } = req.body;
    const selfieFile = req.file;
    
    if (!selfieFile) {
      return res.status(400).json({ error: 'Selfie image is required' });
    }
    
    const user = await prisma.pendingUser.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await prisma.pendingUser.update({
      where: { id: userId },
      data: {
        selfiePhotoUrl: `/uploads/selfies/${selfieFile.filename}`,
        selfieCapturedAt: new Date(),
        status: 'pending_admin_approval'
      }
    });
    
    // Send auto-message to admin
    await prisma.verificationMessage.create({
      data: {
        userId: user.id,
        userType: user.userType,
        userName: user.fullName,
        userEmail: user.email,
        message: `📸 Selfie uploaded and ready for review. User is now pending admin approval.`,
        isFromUser: false,
        isRead: false
      }
    });
    
    console.log(`📸 Registration Step 2: User ${userId} submitted selfie - Pending admin approval`);
    
    res.json({
      success: true,
      message: 'Selfie uploaded successfully. Awaiting admin verification.',
      userId,
      status: 'pending_admin_approval'
    });
    
  } catch (error) {
    console.error('Selfie upload error:', error);
    res.status(500).json({ error: 'Failed to upload selfie' });
  }
});

// ============================================
// CHECK USER STATUS (Polling)
// ============================================

router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { id: userId }
    });
    
    if (pendingUser) {
      return res.json({
        status: pendingUser.status,
        hasSelfie: !!pendingUser.selfiePhotoUrl,
        hasIdDocument: !!pendingUser.idDocumentUrl,
        userType: pendingUser.userType
      });
    }
    
    const approvedUser = await prisma.approvedUser.findUnique({
      where: { originalId: userId }
    });
    
    if (approvedUser) {
      return res.json({
        status: 'approved',
        message: 'Your account has been approved! You can now login.',
        userType: approvedUser.userType
      });
    }
    
    const rejectedUser = await prisma.rejectedUser.findUnique({
      where: { originalId: userId }
    });
    
    if (rejectedUser) {
      return res.json({
        status: 'rejected',
        message: rejectedUser.rejectionMessageSent,
        rejectionReason: rejectedUser.rejectionReason,
        rejectionCustomNote: rejectedUser.rejectionCustomNote
      });
    }
    
    res.status(404).json({ error: 'User not found' });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// ============================================
// SEND MESSAGE FROM USER
// ============================================

router.post('/send-message', uploadMessageFile.single('attachment'), async (req, res) => {
  try {
    const { userId, message } = req.body;
    const attachmentFile = req.file;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'User ID and message are required' });
    }
    
    let user = await prisma.pendingUser.findUnique({ where: { id: userId } });
    
    if (!user) {
      user = await prisma.approvedUser.findUnique({ where: { originalId: userId } });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await prisma.verificationMessage.create({
      data: {
        userId: userId,
        userType: user.userType,
        userName: user.fullName,
        userEmail: user.email,
        message: message,
        fileUrl: attachmentFile ? `/uploads/messages/${attachmentFile.filename}` : null,
        fileName: attachmentFile ? attachmentFile.originalname : null,
        isFromUser: true,
        isRead: false
      }
    });
    
    res.json({
      success: true,
      message: 'Message sent to admin'
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================
// GET USER MESSAGES
// ============================================

router.get('/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const messages = await prisma.verificationMessage.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'asc' }
    });
    
    await prisma.verificationMessage.updateMany({
      where: {
        userId: userId,
        isFromUser: false,
        isReadByUser: false
      },
      data: { isReadByUser: true }
    });
    
    res.json({ messages });
    
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// ============================================
// ADMIN: GET PENDING VERIFICATIONS
// ============================================

router.get('/admin/pending-verifications', async (req, res) => {
  try {
    const pendingUsers = await prisma.pendingUser.findMany({
      where: { status: 'pending_admin_approval' },
      orderBy: { createdAt: 'desc' }
    });
    
    const sanitizedUsers = pendingUsers.map(user => ({
      id: user.id,
      userType: user.userType,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      username: user.username,
      artistName: user.artistName,
      idDocumentUrl: user.idDocumentUrl,
      selfieUrl: user.selfiePhotoUrl,
      registeredAt: user.registeredAt,
      selfieCapturedAt: user.selfieCapturedAt
    }));
    
    res.json(sanitizedUsers);
    
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to get pending verifications' });
  }
});

// ============================================
// ADMIN: GET SINGLE USER VERIFICATION DATA
// ============================================

router.get('/admin/verification-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.pendingUser.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      userType: user.userType,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      username: user.username,
      artistName: user.artistName,
      genre: user.genre,
      contractSigned: user.contractSigned,
      idDocumentUrl: user.idDocumentUrl,
      selfieUrl: user.selfiePhotoUrl,
      registeredAt: user.registeredAt,
      selfieCapturedAt: user.selfieCapturedAt,
      userData: user.userData
    });
    
  } catch (error) {
    console.error('Get verification data error:', error);
    res.status(500).json({ error: 'Failed to get verification data' });
  }
});

// ============================================
// ADMIN: APPROVE USER
// ============================================

router.post('/admin/approve/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { congratulatoryMessage, adminEmail } = req.body;
    
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { id: userId }
    });
    
    if (!pendingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (pendingUser.status !== 'pending_admin_approval') {
      return res.status(400).json({ error: 'User has not completed verification process' });
    }
    
    await prisma.approvedUser.create({
      data: {
        originalId: pendingUser.id,
        userType: pendingUser.userType,
        email: pendingUser.email,
        password: pendingUser.password,
        fullName: pendingUser.fullName,
        username: pendingUser.username,
        phoneNumber: pendingUser.phoneNumber,
        artistName: pendingUser.artistName,
        genre: pendingUser.genre,
        idDocumentUrl: pendingUser.idDocumentUrl,
        selfiePhotoUrl: pendingUser.selfiePhotoUrl,
        approvedBy: adminEmail || 'admin@steeze.com',
        congratulatoryMessageSent: congratulatoryMessage,
        userData: pendingUser.userData
      }
    });
    
    await prisma.verificationMessage.create({
      data: {
        userId: pendingUser.id,
        userType: pendingUser.userType,
        userName: pendingUser.fullName,
        userEmail: pendingUser.email,
        message: congratulatoryMessage,
        isFromUser: false,
        isReadByUser: false
      }
    });
    
    await prisma.pendingUser.delete({
      where: { id: userId }
    });
    
    console.log(`✅ User approved: ${pendingUser.fullName} (${pendingUser.email})`);
    
    res.json({
      success: true,
      message: 'User approved successfully',
      user: {
        id: pendingUser.id,
        fullName: pendingUser.fullName,
        email: pendingUser.email,
        status: 'approved'
      }
    });
    
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// ============================================
// ADMIN: REJECT USER
// ============================================

router.post('/admin/reject/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { rejectionReason, rejectionCustomNote, rejectionMessage, adminEmail } = req.body;
    
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { id: userId }
    });
    
    if (!pendingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await prisma.rejectedUser.create({
      data: {
        originalId: pendingUser.id,
        userType: pendingUser.userType,
        email: pendingUser.email,
        fullName: pendingUser.fullName,
        username: pendingUser.username,
        phoneNumber: pendingUser.phoneNumber,
        rejectionReason: rejectionReason,
        rejectionCustomNote: rejectionCustomNote || null,
        rejectionMessageSent: rejectionMessage,
        rejectedBy: adminEmail || 'admin@steeze.com'
      }
    });
    
    await prisma.verificationMessage.create({
      data: {
        userId: pendingUser.id,
        userType: pendingUser.userType,
        userName: pendingUser.fullName,
        userEmail: pendingUser.email,
        message: rejectionMessage,
        isFromUser: false,
        isReadByUser: false
      }
    });
    
    await prisma.pendingUser.delete({
      where: { id: userId }
    });
    
    console.log(`❌ User rejected: ${pendingUser.fullName} (${pendingUser.email}) - Reason: ${rejectionReason}`);
    
    res.json({
      success: true,
      message: 'User rejected successfully',
      reason: rejectionReason
    });
    
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// ============================================
// ADMIN: GET ALL MESSAGES
// ============================================

router.get('/admin/messages', async (req, res) => {
  try {
    const messages = await prisma.verificationMessage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const groupedMessages = messages.reduce((acc, msg) => {
      if (!acc[msg.userId]) {
        acc[msg.userId] = {
          userId: msg.userId,
          userName: msg.userName,
          userEmail: msg.userEmail,
          userType: msg.userType,
          messages: [],
          unreadCount: 0
        };
      }
      acc[msg.userId].messages.push(msg);
      if (!msg.isFromUser && !msg.isRead) {
        acc[msg.userId].unreadCount++;
      }
      return acc;
    }, {});
    
    res.json(Object.values(groupedMessages));
    
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// ============================================
// ADMIN: REPLY TO USER
// ============================================

router.post('/admin/reply/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Reply message is required' });
    }
    
    let user = await prisma.pendingUser.findUnique({ where: { id: userId } });
    
    if (!user) {
      user = await prisma.approvedUser.findUnique({ where: { originalId: userId } });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await prisma.verificationMessage.create({
      data: {
        userId: userId,
        userType: user.userType,
        userName: user.fullName,
        userEmail: user.email,
        message: message,
        isFromUser: false,
        isRead: false,
        isReadByUser: false
      }
    });
    
    res.json({
      success: true,
      message: 'Reply sent'
    });
    
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// ============================================
// ADMIN: MARK MESSAGES AS READ
// ============================================

router.post('/admin/mark-read/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await prisma.verificationMessage.updateMany({
      where: {
        userId: userId,
        isFromUser: true,
        isRead: false
      },
      data: { isRead: true }
    });
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// ============================================
// ADMIN: GET APPROVED USERS HISTORY
// ============================================

router.get('/admin/approved-users', async (req, res) => {
  try {
    const approvedUsers = await prisma.approvedUser.findMany({
      orderBy: { approvedAt: 'desc' }
    });
    
    res.json(approvedUsers);
    
  } catch (error) {
    console.error('Get approved users error:', error);
    res.status(500).json({ error: 'Failed to get approved users' });
  }
});

// ============================================
// ADMIN: GET REJECTED USERS HISTORY
// ============================================

router.get('/admin/rejected-users', async (req, res) => {
  try {
    const rejectedUsers = await prisma.rejectedUser.findMany({
      orderBy: { rejectedAt: 'desc' }
    });
    
    res.json(rejectedUsers);
    
  } catch (error) {
    console.error('Get rejected users error:', error);
    res.status(500).json({ error: 'Failed to get rejected users' });
  }
});

export default router;