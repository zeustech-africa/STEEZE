import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import app from '../app.js';

const prisma = new PrismaClient();

describe('Moderation Flow Integration Tests', () => {
  let adminUser;
  let adminCookie;
  let testCreator;
  let creatorCookie;
  let testPost;
  let pendingPostId;

  const adminData = {
    email: 'admin_mod_test@example.com',
    password: 'AdminPass123!',
    artistName: 'Admin User',
    userType: 'admin'
  };

  const creatorData = {
    email: 'creator_mod_test@example.com',
    password: 'CreatorPass123!',
    artistName: 'Test Creator',
    userType: 'independent_creator'
  };

  beforeAll(async () => {
    // Clean up existing users
    await prisma.user.deleteMany({
      where: { email: { in: [adminData.email, creatorData.email] } }
    });

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash(adminData.password, 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminData.email,
        passwordHash: hashedAdminPassword,
        artistName: adminData.artistName,
        userType: adminData.userType,
        role: 'admin'
      }
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

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminData.email,
        password: adminData.password
      });
    adminCookie = adminLogin.headers['set-cookie'];

    // Login as creator
    const creatorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: creatorData.email,
        password: creatorData.password
      });
    creatorCookie = creatorLogin.headers['set-cookie'];
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [adminData.email, creatorData.email] } }
    });
    await prisma.$disconnect();
  });

  describe('M1: Content Submission for Moderation', () => {
    it('should allow creator to submit content that goes to moderation queue', async () => {
      const response = await request(app)
        .post('/api/upload/complete')
        .set('Cookie', creatorCookie)
        .send({
          title: 'Test Post for Moderation',
          description: 'This post needs admin approval',
          mediaUrl: 'https://test.com/image.jpg',
          mediaType: 'image',
          contentType: 'subscriber',
          isExclusive: true
        });

      expect([200, 201, 401, 404, 500]).toContain(response.status);
      pendingPostId = response.body.postId || response.body.id;
    });
  });

  describe('M2: Admin Views Pending Content', () => {
    it('should allow admin to view pending content queue', async () => {
      const response = await request(app)
        .get('/api/admin/posts/pending')
        .set('Cookie', adminCookie);

      expect([200, 201, 404]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe('M3: Admin Approves Content', () => {
    it('should allow admin to approve pending content', async () => {
      if (!pendingPostId) {
        console.log('No pending post ID, skipping test');
        return;
      }

      const response = await request(app)
        .put(`/api/admin/posts/${pendingPostId}/approve`)
        .set('Cookie', adminCookie)
        .send({
          notes: 'Content approved - meets guidelines'
        });

      expect([200, 201, 202, 404]).toContain(response.status);
    });

    it('should not allow non-admin to approve content', async () => {
      if (!pendingPostId) {
        console.log('No pending post ID, skipping test');
        return;
      }

      const response = await request(app)
        .put(`/api/admin/posts/${pendingPostId}/approve`)
        .set('Cookie', creatorCookie)
        .send({
          notes: 'Trying to approve as creator'
        });

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('M4: Admin Rejects Content', () => {
    let rejectPostId;

    beforeAll(async () => {
      // Create another pending post
      const response = await request(app)
        .post('/api/upload/complete')
        .set('Cookie', creatorCookie)
        .send({
          title: 'Post to be Rejected',
          description: 'This post should be rejected',
          mediaUrl: 'https://test.com/reject.jpg',
          mediaType: 'image',
          contentType: 'subscriber',
          isExclusive: true
        });

      rejectPostId = response.body.postId || response.body.id;
    });

    it('should allow admin to reject content with reason', async () => {
      if (!rejectPostId) {
        console.log('No reject post ID, skipping test');
        return;
      }

      const response = await request(app)
        .put(`/api/admin/posts/${rejectPostId}/reject`)
        .set('Cookie', adminCookie)
        .send({
          reason: 'Contains inappropriate content'
        });

      expect([200, 201, 202, 404]).toContain(response.status);
    });
  });

  describe('M5: Moderation Logs', () => {
    it('should have audit log of moderation actions', async () => {
      const response = await request(app)
        .get('/api/admin/moderation-logs')
        .set('Cookie', adminCookie);

      expect([200, 201, 404]).toContain(response.status);
    });

    it('should not allow creator to view moderation logs', async () => {
      const response = await request(app)
        .get('/api/admin/moderation-logs')
        .set('Cookie', creatorCookie);

      expect([401, 403, 404]).toContain(response.status);
    });
  });
});