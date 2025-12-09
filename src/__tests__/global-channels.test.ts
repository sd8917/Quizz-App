import { channelService } from '../services/channelService';
import { channelRepo } from '../repositories/channelRepo';
import { Channel } from '../models/channel.model';

// Mock the dependencies
jest.mock('../repositories/channelRepo');
jest.mock('../models/user.model');
jest.mock('../models/quiz.model', () => ({
  Question: {
    countDocuments: jest.fn().mockResolvedValue(5),
  },
}));

describe('Global Channels Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChannel', () => {
    it('should create a global channel when isGlobal is true', async () => {
      const mockUser = { _id: 'user123', username: 'admin' };
      const mockChannel = {
        _id: 'channel123',
        name: 'Global Quiz',
        description: 'Public quiz',
        owner: 'user123',
        members: [{ user: 'user123', role: 'creator' }],
        isGlobal: true,
        isArchived: false,
      };

      // Mock User.findById
      const User = require('../models/user.model').default;
      User.findById = jest.fn().mockResolvedValue(mockUser);

      // Mock channelRepo.createChannel
      (channelRepo.createChannel as jest.Mock).mockResolvedValue(mockChannel);

      const result = await channelService.createChannel(
        'user123',
        'Global Quiz',
        'Public quiz',
        true
      );

      expect(result).toBeDefined();
      expect(channelRepo.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          isGlobal: true,
        })
      );
    });

    it('should create a non-global channel by default', async () => {
      const mockUser = { _id: 'user123', username: 'admin' };
      const mockChannel = {
        _id: 'channel123',
        name: 'Private Quiz',
        owner: 'user123',
        members: [{ user: 'user123', role: 'creator' }],
        isGlobal: false,
        isArchived: false,
      };

      const User = require('../models/user.model').default;
      User.findById = jest.fn().mockResolvedValue(mockUser);
      (channelRepo.createChannel as jest.Mock).mockResolvedValue(mockChannel);

      const result = await channelService.createChannel('user123', 'Private Quiz');

      expect(result).toBeDefined();
      expect(channelRepo.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          isGlobal: false,
        })
      );
    });
  });

  describe('listGlobalChannels', () => {
    it('should return all global channels', async () => {
      const mockGlobalChannels = [
        {
          _id: 'channel1',
          name: 'Global Quiz 1',
          isGlobal: true,
          isArchived: false,
          toObject: jest.fn().mockReturnThis(),
        },
        {
          _id: 'channel2',
          name: 'Global Quiz 2',
          isGlobal: true,
          isArchived: false,
          toObject: jest.fn().mockReturnThis(),
        },
      ];

      (channelRepo.getGlobalChannels as jest.Mock).mockResolvedValue(mockGlobalChannels);

      const result = await channelService.listGlobalChannels();

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(channelRepo.getGlobalChannels).toHaveBeenCalled();
    });
  });

  describe('getChannel - global access', () => {
    it('should allow access to global channels without membership', async () => {
      const mockGlobalChannel = {
        _id: 'channel123',
        name: 'Global Quiz',
        owner: { _id: 'owner123' },
        members: [],
        isGlobal: true,
        isArchived: false,
      };

      (channelRepo.getChannelById as jest.Mock).mockResolvedValue(mockGlobalChannel);

      // User is not owner and not a member, but channel is global
      const result = await channelService.getChannel('channel123', 'user456', false);

      expect(result).toBeDefined();
      expect(result.isGlobal).toBe(true);
      expect(channelRepo.getChannelById).toHaveBeenCalledWith('channel123');
    });

    it('should throw error for non-global channels without membership', async () => {
      const mockPrivateChannel = {
        _id: 'channel123',
        name: 'Private Quiz',
        owner: { _id: 'owner123', toString: () => 'owner123' },
        members: [],
        isGlobal: false,
        isArchived: false,
      };

      (channelRepo.getChannelById as jest.Mock).mockResolvedValue(mockPrivateChannel);

      // User is not owner, not a member, and channel is not global
      await expect(
        channelService.getChannel('channel123', 'user456', true)
      ).rejects.toThrow();
    });
  });
});
