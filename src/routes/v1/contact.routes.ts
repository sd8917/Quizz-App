import express from 'express';
import { sendSupportRequest } from '../../controllers/contact.controller';
import { protect } from '../../middleware/auth.middleware';
import { contactLimiter } from '../../middleware/rateLimit.middleware';

const router = express.Router();

/**
 * @openapi
 * /api/contact/support:
 *   post:
 *     tags:
 *       - Contact
 *     summary: Send a support request
 *     description: Send an email to support team for assistance. Requires authentication. Used for role upgrade requests or other support inquiries.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - message
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email for reply
 *                 example: john@example.com
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *                 description: Support request message (10-5000 characters)
 *                 example: I would like to request an upgrade to creator role to create quizzes for my team.
 *     responses:
 *       200:
 *         description: Support request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Your support request has been sent successfully. We will get back to you soon.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         description: Too many requests (rate limit - 5 per hour)
 */
router.post('/support', protect, contactLimiter, sendSupportRequest);

export default router;
