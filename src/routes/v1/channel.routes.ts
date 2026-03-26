import { Router } from 'express';
import { channelController } from '../../controllers/channel.controller';
import  { protect }  from '../../middleware/auth.middleware';
import authorizeRoles from '../../middleware/role.middleware';
// import errorHandler from '../../middleware/errorHandler';

const router = Router();

// All channel routes require authentication
router.use(protect);

// Create channel (creator or admin only)
/**
 * @openapi
 * /api/channel:
 *   post:
 *     tags:
 *       - Channels
 *     summary: Create a new channel
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Channel created successfully
 */
router.post('/', authorizeRoles('creator', 'admin'), channelController.createChannel);

// Get channel by ID
/**
 * @openapi
 * /api/channel/{channelId}:
 *   get:
 *     tags:
 *       - Channels
 *     summary: Get channel by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Channel retrieved successfully
 */
router.get('/:channelId', channelController.getChannel);
// Update channel (name, description)
/**
 * @openapi
 * /api/channel/{channelId}:
 *   put:
 *     tags:
 *       - Channels
 *     summary: Update channel details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Channel updated successfully
 */
router.put('/:channelId', channelController.updateChannel);
// Invite user to channel (creator or admin only)
/**
 * @openapi
 * /api/channel/{channelId}/invite:
 *   post:
 *     tags:
 *       - Channels
 *     summary: Invite user to channel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User invited successfully
 */
router.post('/:channelId/invite', authorizeRoles('creator', 'admin'), channelController.inviteUser);
// // Archive old channels (admin only)
// router.post('/archive-old', channelController.archiveOldChannels);
// Delete channel (admin only)
/**
 * @openapi
 * /api/channel/{channelId}:
 *   delete:
 *     tags:
 *       - Channels
 *     summary: Delete a channel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Channel deleted successfully
 */
router.delete('/:channelId', authorizeRoles('admin', 'creator'), channelController.deleteChannel);
// List all channels for the current user/admin
/**
 * @openapi
 * /api/channel:
 *   get:
 *     tags:
 *       - Channels
 *     summary: List all accessible channels
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Channels retrieved successfully
 */
router.get('/',  authorizeRoles('user','admin','creator'), channelController.listUserChannels);

export default router;
