import { Router } from 'express';
import { channelController } from '../../controllers/channel.controller';
import  { protect }  from '../../middleware/auth.middleware';
// import errorHandler from '../../middleware/errorHandler';

const router = Router();

// All channel routes require authentication
router.use(protect);

// Create channel
router.post('/', channelController.createChannel);

// Get channel by ID
router.get('/:channelId', channelController.getChannel);
// Invite user to channel
router.post('/:channelId/invite', channelController.inviteUser);
// // Archive old channels (admin only)
// router.post('/archive-old', channelController.archiveOldChannels);
// Delete channel (super only)
router.delete('/:channelId', channelController.deleteChannel);
// List all channels for the current user/admin
router.get('/', channelController.listUserChannels);

export default router;
