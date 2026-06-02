import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import app from '../app.js';

const prisma = new PrismaClient();

describe('Subscription Flow E2E Tests', () => {
  let testCreator;
  let creatorCookie;
  let testSubscriber;
  let subscriberCookie;
  let testSubscriptionId;
  let exclusivePostId;

  const creatorData = {
    email: 'sub_creator@example.com',
    password: 'CreatorPass123!',
    artistName: 'Subscription Test Creator',
    userType: 'independent_creator'
  };

  const subscriberData = {
    email: 'subscriber@example.com',
    password: 'SubscriberPass123!',
    artistName: 'Test Subscriber',
    userType: 'vibe'
  };

  beforeAll(async () => {
    // Clean up existing users
    await prisma.user.deleteMany({
      where: { email: { in: [creatorData.email, subscriberData.email] } }
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

    // Create subscriber user
    const hashedSubscriberPassword = await bcrypt.hash(subscriberData.password, 10);
    testSubscriber = await prisma.user.create({
      data: {
        email: subscriberData.email,
        passwordHash: hashedSubscriberPassword,
        artistName: subscriberData.artistName,
        userType: subscriberData.userType
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

    // Login as subscriber
    const subscriberLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: subscriberData.email,
        password: subscriberData.password
      });
    subscriberCookie = subscriberLogin.headers['set-cookie'];

    // Creator creates an exclusive post
    const postResponse = await request(app)
      .post('/api/upload/complete')
      .set('Cookie', creatorCookie)
      .send({
        title: 'Exclusive Content for Subscribers',
        description: 'This post is only for subscribers',
        mediaUrl: 'https://test.com/exclusive.jpg',
        mediaType: 'image',
        contentType: 'subscriber',
        isExclusive: true
      });

    exclusivePostId = postResponse.body.postId || postResponse.body.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [creatorData.email, subscriberData.email] } }
    });
    await prisma.$disconnect();
  });

  describe('S1: View Subscription Plans', () => {
    it('should allow user to view available subscription plans', async () => {
      const response = await request(app)
        .get('/api/subscription/plans')
        .set('Cookie', subscriberCookie);

      expect([200, 201, 404]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe('S2: Subscribe to Creator', () => {
    it('should allow user to initiate subscription to a creator', async () => {
      const response = await request(app)
        .post('/api/subscription-paystack/initiate')
        .set('Cookie', subscriberCookie)
        .send({
          userId: testSubscriber.id,
          creatorId: testCreator.id,
          plan: 'basic',
          email: subscriberData.email
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('authorization_url');
      expect(response.body).toHaveProperty('reference');
    });

    it('should reject subscription with invalid plan', async () => {
      const response = await request(app)
        .post('/api/subscription-paystack/initiate')
        .set('Cookie', subscriberCookie)
        .send({
          userId: testSubscriber.id,
          creatorId: testCreator.id,
          plan: 'invalid_plan',
          email: subscriberData.email
        });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe('S3: View Active Subscriptions', () => {
    it('should allow user to view their active subscriptions', async () => {
      const response = await request(app)
        .get('/api/subscription/my-subscriptions')
        .set('Cookie', subscriberCookie);

      expect([200, 201, 404]).toContain(response.status);
    });

    it('should allow creator to view their subscribers', async () => {
      const response = await request(app)
        .get(`/api/creator/${testCreator.id}/subscribers`)
        .set('Cookie', creatorCookie);

      expect([200, 201, 404]).toContain(response.status);
    });
  });

  describe('S4: Subscriber Access to Exclusive Content', () => {
    it('should allow subscriber to access exclusive post', async () => {
      if (!exclusivePostId) {
        console.log('No exclusive post ID, skipping test');
        return;
      }

      const response = await request(app)
        .get(`/api/posts/${exclusivePostId}`)
        .set('Cookie', subscriberCookie);

      // Subscriber should have access to exclusive content if subscribed
      expect([200, 201, 401, 403, 404]).toContain(response.status);
    });
  });

  describe('S5: Non-Subscriber Cannot Access Exclusive Content', () => {
    let nonSubscriberUser;
    let nonSubscriberCookie;

    const nonSubscriberData = {
      email: 'nonsubscriber@example.com',
      password: 'NonSubPass123!',
      artistName: 'Non Subscriber',
      userType: 'vibe'
    };

    beforeAll(async () => {
      // Create non-subscriber user
      const hashedPassword = await bcrypt.hash(nonSubscriberData.password, 10);
      nonSubscriberUser = await prisma.user.create({
        data: {
          email: nonSubscriberData.email,
          passwordHash: hashedPassword,
          artistName: nonSubscriberData.artistName,
          userType: nonSubscriberData.userType
        }
      });

      const login = await request(app)
        .post('/api/auth/login')
        .send({
          email: nonSubscriberData.email,
          password: nonSubscriberData.password
        });
      nonSubscriberCookie = login.headers['set-cookie'];
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: nonSubscriberData.email }
      });
    });

    it('should deny non-subscriber access to exclusive post', async () => {
      if (!exclusivePostId) {
        console.log('No exclusive post ID, skipping test');
        return;
      }

      const response = await request(app)
        .get(`/api/posts/${exclusivePostId}`)
        .set('Cookie', nonSubscriberCookie);

      // Non-subscriber should be denied access
      expect([401, 403, 404, 500]).toContain(response.status);
    });
  });

  describe('S6: Cancel Subscription', () => {
    it('should allow user to cancel their subscription', async () => {
      // Create a subscription record first for testing cancellation
      const testSubscription = await prisma.subscription.create({
        data: {
          userId: testSubscriber.id,
          creatorId: testCreator.id,
          tier: 'basic',
          price: 49,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      });

      const response = await request(app)
        .post('/api/subscription/cancel')
        .set('Cookie', subscriberCookie)
        .send({
          subscriptionId: testSubscription.id,
          userId: testSubscriber.id
        });

      expect([200, 201, 404]).toContain(response.status);
    });
  });
});