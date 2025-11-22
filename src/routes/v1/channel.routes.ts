import { Router } from 'express';
import { channelController } from '../../controllers/channel.controller';
import  { protect }  from '../../middleware/auth.middleware';
import authorizeRoles from '../../middleware/role.middleware';
// import errorHandler from '../../middleware/errorHandler';

const router = Router();

// All channel routes require authentication
router.use(protect);

// Create channel (creator or admin only)
router.post('/', authorizeRoles('creator', 'admin'), channelController.createChannel);

// Get channel by ID
router.get('/:channelId', channelController.getChannel);
// Update channel (name, description)
router.put('/:channelId', channelController.updateChannel);
// Invite user to channel (creator or admin only)
router.post('/:channelId/invite', authorizeRoles('creator', 'admin'), channelController.inviteUser);
// // Archive old channels (admin only)
// router.post('/archive-old', channelController.archiveOldChannels);
// Delete channel (admin only)
router.delete('/:channelId', authorizeRoles('admin', 'creator'), channelController.deleteChannel);
// List all channels for the current user/admin
router.get('/', channelController.listUserChannels);

export default router;
