import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';
import User from '../models/user.model';
import { Channel } from '../models/channel.model';

describe('Channel API - Public Channels', () => {
  let adminToken: string;
  let userToken: string;
  let publicChannelId: string;
  let privateChannelId: string;
  let adminUser: any;
  let regularUser: any;

  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    }

    // Create test users
    adminUser = await User.create({
      username: 'admin_test',
      email: 'admin_test@example.com',
      password: 'password123',
      roles: ['admin'],
      isActive: true
    });

    regularUser = await User.create({
      username: 'user_test',
      email: 'user_test@example.com',
      password: 'password123',
      roles: ['user'],
      isActive: true
    });

    // Get tokens (assuming you have a way to generate tokens)
    // For now, we'll mock the authentication
    adminToken = 'mock_admin_token';
    userToken = 'mock_user_token';
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $in: ['admin_test@example.com', 'user_test@example.com'] } });
    await Channel.deleteMany({ name: { $in: ['Test Public Channel', 'Test Private Channel'] } });
    await mongoose.connection.close();
  });

  describe('POST /api/v1/channels - Create Channel', () => {
    it('should create a public channel when admin provides isPublic: "public"', async () => {
      const response = await request(app)
        .post('/api/v1/channels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Public Channel',
          description: 'A test public channel',
          isPublic: 'public'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isPublic).toBe('public');

      publicChannelId = response.body.data._id;
    });

    it('should create a private channel by default', async () => {
      const response = await request(app)
        .post('/api/v1/channels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Private Channel',
          description: 'A test private channel'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isPublic).toBe('private');

      privateChannelId = response.body.data._id;
    });
  });

  describe('GET /api/v1/channels - List Channels', () => {
    it('should include public channels in user channel list', async () => {
      const response = await request(app)
        .get('/api/v1/channels')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const channels = response.body.data;
      const hasPublicChannel = channels.some((channel: any) => channel._id === publicChannelId);

      expect(hasPublicChannel).toBe(true);
    });
  });

  describe('GET /api/v1/channels/:channelId - Get Channel', () => {
    it('should allow access to public channel without membership', async () => {
      const response = await request(app)
        .get(`/api/v1/channels/${publicChannelId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.channel._id).toBe(publicChannelId);
    });

    it('should deny access to private channel without membership', async () => {
      const response = await request(app)
        .get(`/api/v1/channels/${privateChannelId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
