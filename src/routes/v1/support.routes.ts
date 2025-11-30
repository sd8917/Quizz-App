import { Router } from 'express';
import supportController from '../../controllers/support.controller';

const router = Router();

/**
 * @openapi
 * /api/v1/support/contact:
 *   post:
 *     tags:
 *       - Support
 *     summary: Send a support message
 *     description: Public endpoint to send name, email, subject and message to the support team.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       202:
 *         description: Message accepted for delivery
 */
router.post('/', supportController.sendSupportMessage);

export { router as supportRoutes };
