import request from 'supertest';
import app from '../app.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Payment Integration Tests', () => {
  let testUser;
  let testCreator;

  const testUserData = {
    email: 'payment_test@example.com',
    passwordHash: '',
    artistName: 'Payment Test User',
    userType: 'vibe'
  };

  const testCreatorData = {
    email: 'creator_test@example.com',
    passwordHash: '',
    artistName: 'Test Creator',
    userType: 'independent_creator'
  };

  beforeAll(async () => {
    // Clean up
    await prisma.user.deleteMany({ where: { email: { in: [testUserData.email, testCreatorData.email] } } });
    
    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    testUserData.passwordHash = hashedPassword;
    testUser = await prisma.user.create({
      data: { 
        email: testUserData.email,
        passwordHash: testUserData.passwordHash,
        artistName: testUserData.artistName,
        userType: testUserData.userType
      }
    });
    
    // Create test creator
    const creatorHashedPassword = await bcrypt.hash('TestPassword123!', 10);
    testCreatorData.passwordHash = creatorHashedPassword;
    testCreator = await prisma.user.create({
      data: { 
        email: testCreatorData.email,
        passwordHash: testCreatorData.passwordHash,
        artistName: testCreatorData.artistName,
        userType: testCreatorData.userType
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [testUserData.email, testCreatorData.email] } } });
    await prisma.$disconnect();
  });

  describe('Payment Initialization', () => {
    it('should initialize a payment successfully', async () => {
      const response = await request(app)
        .post('/api/payment/initialize')
        .send({
          userId: testUser.id,
          amount: 100,
          email: testUserData.email,
          metadata: { product: 'test' }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authorization_url');
      expect(response.body).toHaveProperty('reference');
    });

    it('should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/payment/initialize')
        .send({ amount: 100 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Subscription Initialization', () => {
    it('should initialize a subscription successfully', async () => {
      const response = await request(app)
        .post('/api/subscription-paystack/initiate')
        .send({
          userId: testUser.id,
          creatorId: testCreator.id,
          plan: 'basic',
          email: testUserData.email
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authorization_url');
      expect(response.body).toHaveProperty('reference');
    });

    it('should fail with invalid plan', async () => {
      const response = await request(app)
        .post('/api/subscription-paystack/initiate')
        .send({
          userId: testUser.id,
          creatorId: testCreator.id,
          plan: 'invalid',
          email: testUserData.email
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Wallet and Transaction', () => {
    it('should have wallet for creator', async () => {
      const { getOrCreateWallet } = await import('../services/wallet.js');
      const wallet = await getOrCreateWallet(testCreator.id);
      expect(wallet).toBeDefined();
      expect(wallet).toHaveProperty('balance');
    });
  });
});
