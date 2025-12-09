import request from 'supertest';
import app from '../app';
import { RoleRequest } from '../models/roleRequest.model';
import User from '../models/user.model';
import mongoose from 'mongoose';

// Mock the mailer to avoid actual email sends during tests
jest.mock('../utils/mailer', () => ({
  sendRoleRequestEmail: jest.fn().mockResolvedValue(undefined),
  sendChannelInviteEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Role Request Feature', () => {
  let authToken: string;
  let userId: string;
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-app-test');
    }
  });

  afterAll(async () => {
    // Clean up
    await RoleRequest.deleteMany({});
    await User.deleteMany({ email: { $in: ['testuser@example.com', 'admin@example.com'] } });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await RoleRequest.deleteMany({});
    await User.deleteMany({ email: { $in: ['testuser@example.com', 'admin@example.com'] } });
  });

  describe('POST /api/profile/request-creator-role', () => {
    it('should allow a user to request creator role', async () => {
      // Register a user
      const registerRes = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'password123'
        });

      authToken = registerRes.body.data.accessToken;
      userId = registerRes.body.data._id;

      // Request creator role
      const res = await request(app)
        .post('/api/profile/request-creator-role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'I want to create educational quizzes'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.requestedRole).toBe('creator');
    });

    it('should not allow duplicate pending requests', async () => {
      // Register and login
      const registerRes = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'password123'
        });

      authToken = registerRes.body.data.accessToken;

      // First request
      await request(app)
        .post('/api/profile/request-creator-role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'First request' });

      // Second request should fail
      const res = await request(app)
        .post('/api/profile/request-creator-role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Second request' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('pending');
    });

    it('should not allow users who already have creator role', async () => {
      // Create a user with creator role
      const user = await User.create({
        username: 'creator',
        email: 'testuser@example.com',
        password: 'password123',
        roles: ['user', 'creator']
      });

      // Login
      const loginRes = await request(app)
        .post('/api/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        });

      authToken = loginRes.body.data.accessToken;

      // Try to request creator role
      const res = await request(app)
        .post('/api/profile/request-creator-role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'I want to create quizzes' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already has');
    });
  });

  describe('GET /api/profile/admin/role-requests', () => {
    beforeEach(async () => {
      // Create admin user
      const admin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        roles: ['admin']
      });
      adminId = admin._id.toString();

      // Login as admin
      const loginRes = await request(app)
        .post('/api/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123'
        });

      adminToken = loginRes.body.data.accessToken;
    });

    it('should allow admin to view all role requests', async () => {
      // Create a test user with a role request
      const user = await User.create({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
        roles: ['user']
      });

      await RoleRequest.create({
        userId: user._id,
        requestedRole: 'creator',
        reason: 'Test reason',
        status: 'pending'
      });

      // Get role requests as admin
      const res = await request(app)
        .get('/api/profile/admin/role-requests')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter role requests by status', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
        roles: ['user']
      });

      await RoleRequest.create({
        userId: user._id,
        requestedRole: 'creator',
        reason: 'Test reason',
        status: 'pending'
      });

      await RoleRequest.create({
        userId: user._id,
        requestedRole: 'creator',
        reason: 'Test reason 2',
        status: 'approved'
      });

      // Get only pending requests
      const res = await request(app)
        .get('/api/profile/admin/role-requests?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((req: any) => req.status === 'pending')).toBe(true);
    });

    it('should not allow non-admin users to view role requests', async () => {
      // Register a regular user
      const registerRes = await request(app)
        .post('/api/register')
        .send({
          username: 'regularuser',
          email: 'testuser@example.com',
          password: 'password123'
        });

      const userToken = registerRes.body.data.accessToken;

      // Try to access admin endpoint
      const res = await request(app)
        .get('/api/profile/admin/role-requests')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/profile/admin/role-requests/:requestId/approve', () => {
    let requestId: string;

    beforeEach(async () => {
      // Create admin
      const admin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        roles: ['admin']
      });
      adminId = admin._id.toString();

      const loginRes = await request(app)
        .post('/api/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123'
        });
      adminToken = loginRes.body.data.accessToken;

      // Create test user and request
      const user = await User.create({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
        roles: ['user']
      });
      userId = user._id.toString();

      const roleRequest = await RoleRequest.create({
        userId: user._id,
        requestedRole: 'creator',
        reason: 'Test reason',
        status: 'pending'
      });
      requestId = roleRequest._id.toString();
    });

    it('should allow admin to approve a role request', async () => {
      const res = await request(app)
        .post(`/api/profile/admin/role-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewNotes: 'Approved for testing' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');

      // Verify user now has creator role
      const user = await User.findById(userId);
      expect(user?.roles).toContain('creator');
    });

    it('should not allow approving an already processed request', async () => {
      // Approve once
      await request(app)
        .post(`/api/profile/admin/role-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewNotes: 'First approval' });

      // Try to approve again
      const res = await request(app)
        .post(`/api/profile/admin/role-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewNotes: 'Second approval' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/profile/admin/role-requests/:requestId/reject', () => {
    let requestId: string;

    beforeEach(async () => {
      // Create admin
      const admin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        roles: ['admin']
      });

      const loginRes = await request(app)
        .post('/api/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123'
        });
      adminToken = loginRes.body.data.accessToken;

      // Create test user and request
      const user = await User.create({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
        roles: ['user']
      });

      const roleRequest = await RoleRequest.create({
        userId: user._id,
        requestedRole: 'creator',
        reason: 'Test reason',
        status: 'pending'
      });
      requestId = roleRequest._id.toString();
    });

    it('should allow admin to reject a role request', async () => {
      const res = await request(app)
        .post(`/api/profile/admin/role-requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewNotes: 'Not qualified yet' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('rejected');
    });
  });
});
