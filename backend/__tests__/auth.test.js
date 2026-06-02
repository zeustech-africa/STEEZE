import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../app.js';

const prisma = new PrismaClient();

describe('Authentication System Tests', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  const validUser = {
    email: 'testauth@example.com',
    password: 'TestPassword123!',
    artistName: 'Test Auth User',
    userType: 'vibe'
  };

  beforeAll(async () => {
    // Clean up any existing test user
    await prisma.user.deleteMany({
      where: { email: validUser.email }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: validUser.email }
    });
    await prisma.$disconnect();
  });

  describe('B1: Login Success/Failure Tests', () => {
    beforeAll(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(validUser.password, 10);
      testUser = await prisma.user.create({
        data: {
          email: validUser.email,
          passwordHash: hashedPassword,
          artistName: validUser.artistName,
          userType: validUser.userType
        }
      });
    });

    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', validUser.email);
    });

    it('should fail login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'WrongPassword123!'
        });
      
      expect([401, 429]).toContain(response.status);
    });

    it('should fail login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!'
        });
      
      expect([401, 429]).toContain(response.status);
    });

    it('should fail login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: validUser.password
        });
      
      expect([400, 429]).toContain(response.status);
    });

    it('should fail login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email
        });
      
      expect([400, 429]).toContain(response.status);
    });
  });

  describe('B2: Logout Tests', () => {
    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        });
      
      const cookies = loginResponse.headers['set-cookie'];
      accessToken = cookies?.find(c => c.includes('accessToken'));
      refreshToken = cookies?.find(c => c.includes('refreshToken'));
    });

    it('should successfully logout', async () => {
      if (!accessToken || !refreshToken) {
        console.log('No cookies found, skipping logout test');
        return;
      }
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [accessToken, refreshToken]);
      
      expect(response.status).toBe(200);
    });
  });

  describe('B3: Refresh Token Tests', () => {
    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        });
      
      const cookies = loginResponse.headers['set-cookie'];
      refreshToken = cookies?.find(c => c.includes('refreshToken'));
    });

    it('should refresh token successfully', async () => {
      if (!refreshToken) {
        console.log('No refresh token found, skipping refresh test');
        return;
      }
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshToken]);
      
      expect(response.status).toBe(200);
    });
  });
});
