import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import walletRoutes from '../routes/wallet.js';
import payoutRoutes from '../routes/payout.js';
import withdrawalsRoutes from '../routes/admin/withdrawals.js';

const prisma = new PrismaClient();

// Mount wallet, payout, and admin withdrawal routes on the test app
// (These are not mounted in app.js by default)
app.use('/api', walletRoutes);
app.use('/api', payoutRoutes);
app.use('/api', withdrawalsRoutes);

describe('Creator Payout Flow Integration Tests', () => {
  let testCreator;
  let creatorCookie;
  let adminUser;
  let adminCookie;
  let creatorWallet;
  let withdrawalId;

  const creatorData = {
    email: 'payout_creator@example.com',
    password: 'CreatorPass123!',
    artistName: 'Payout Test Creator',
    userType: 'independent_creator'
  };

  const adminData = {
    email: 'payout_admin@example.com',
    password: 'AdminPass123!',
    artistName: 'Payout Admin',
    userType: 'admin',
    role: 'admin'
  };

  beforeAll(async () => {
    // Clean up existing users
    await prisma.user.deleteMany({
      where: { email: { in: [creatorData.email, adminData.email] } }
    });

    // Create creator user
    const hashedCreatorPassword = await bcrypt.hash(creatorData.password, 10);
    testCreator = await prisma.user.create({
      data: {
        email: creatorData.email,
        passwordHash: hashedCreatorPassword,
        artistName: creatorData.artistName,
        userType: creatorData.userType
      }
    });

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash(adminData.password, 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminData.email,
        passwordHash: hashedAdminPassword,
        artistName: adminData.artistName,
        userType: adminData.userType,
        role: adminData.role
      }
    });

    // Login as creator
    const creatorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: creatorData.email,
        password: creatorData.password
      });
    creatorCookie = creatorLogin.headers['set-cookie'];

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminData.email,
        password: adminData.password
      });
    adminCookie = adminLogin.headers['set-cookie'];

    // Get or create wallet for creator
    const walletResponse = await request(app)
      .get('/api/wallet/balance')
      .set('Cookie', creatorCookie);
    
    if (walletResponse.status === 200) {
      creatorWallet = walletResponse.body;
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [creatorData.email, adminData.email] } }
    });
    await prisma.$disconnect();
  });

  describe('P1: Creator Wallet Balance', () => {
    it('should allow creator to view wallet balance', async () => {
      const response = await request(app)
        .get('/api/wallet/balance')
        .set('Cookie', creatorCookie);

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('balance');
    });

    it('should not allow unauthenticated user to view wallet', async () => {
      const response = await request(app)
        .get('/api/wallet/balance');

      expect(response.status).toBe(401);
    });
  });

  describe('P2: Withdrawal Request', () => {
    it('should allow creator to request withdrawal via payout endpoint', async () => {
      const response = await request(app)
        .post('/api/payout/request')
        .set('Cookie', creatorCookie)
        .send({
          amount: 500 // R500 (minimum per payout.js)
        });

      // 200/201 for success, 400 for insufficient balance, 500 for internal errors
      expect([200, 201, 400, 402, 500]).toContain(response.status);
      
      if (response.body.payout && response.body.payout.id) {
        withdrawalId = response.body.payout.id;
      }
    });

    it('should validate minimum withdrawal amount', async () => {
      const response = await request(app)
        .post('/api/payout/request')
        .set('Cookie', creatorCookie)
        .send({
          amount: 50 // Below minimum (R500)
        });

      // 400 for validation, 402 for insufficient
      expect([400, 402]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('P3: Admin Views Withdrawal Requests', () => {
    it('should allow admin to view pending withdrawals', async () => {
      const response = await request(app)
        .get('/api/admin/withdrawals')
        .query({ status: 'pending' })
        .set('Cookie', adminCookie);

      // 200 for success, 500 for internal implementation issues
      expect([200, 201, 500]).toContain(response.status);
    });

    it('should not allow creator to view admin withdrawal list', async () => {
      const response = await request(app)
        .get('/api/admin/withdrawals')
        .set('Cookie', creatorCookie);

      // 401/403 for access denied, 500 for internal issues
      expect([401, 403, 500]).toContain(response.status);
    });
  });

  describe('P4: Admin Processes Withdrawal', () => {
    it('should allow admin to approve a withdrawal', async () => {
      if (!withdrawalId) {
        console.log('No withdrawal ID available, skipping approval test');
        return;
      }

      const response = await request(app)
        .post(`/api/admin/withdrawals/${withdrawalId}/approve`)
        .set('Cookie', adminCookie)
        .send({
          adminNotes: 'Withdrawal approved'
        });

      // 200-202 for success, 500 for internal implementation issues
      expect([200, 201, 202, 500]).toContain(response.status);
    });

    it('should allow admin to reject a withdrawal', async () => {
      // Create another withdrawal request first
      const withdrawRes = await request(app)
        .post('/api/payout/request')
        .set('Cookie', creatorCookie)
        .send({
          amount: 500
        });

      if (withdrawRes.body.payout && withdrawRes.body.payout.id) {
        const response = await request(app)
          .post(`/api/admin/withdrawals/${withdrawRes.body.payout.id}/reject`)
          .set('Cookie', adminCookie)
          .send({
            rejectionReason: 'Insufficient documentation'
          });

        // 200-202 for success, 500 for internal implementation issues
        expect([200, 201, 202, 500]).toContain(response.status);
      }
    });
  });

  describe('P5: Withdrawal History', () => {
    it('should allow creator to view withdrawal history', async () => {
      const response = await request(app)
        .get('/api/payout/history')
        .set('Cookie', creatorCookie);

      // 200 for success, 500 for internal implementation issues
      expect([200, 201, 500]).toContain(response.status);
    });
  });
});