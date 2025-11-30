
import { Router } from 'express';
import feedbackController from '../../controllers/feedback.controller';
import authorizeRoles from '../../middleware/role.middleware';
import { strictLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

// Public submit feedback
/**
 * @openapi
 * /api/feedback:
 *   post:
 *     tags:
 *       - Feedback
 *     summary: Submit feedback (anonymous allowed)
 *     description: Submit a feedback message with optional name/email, required rating (1-5) and message.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating, message]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted
 */
router.post('/', feedbackController.submitFeedback);

// Admin: list feedbacks
/**
 * @openapi
 * /api/feedback:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: List feedbacks (admin only)
 *     description: Retrieve paginated feedback messages (admin only).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Page size
 *     responses:
 *       200:
 *         description: Feedback list
 */
router.get('/', strictLimiter, authorizeRoles('admin'), feedbackController.listFeedbacks);

export { router as feedbackRoutes };

