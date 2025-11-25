import { Router } from 'express';
import { aiController } from '../../controllers/ai.controller';
import { protect } from '../../middleware/auth.middleware';
import authorizeRoles from '../../middleware/role.middleware';

const router = Router();

// All AI routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/ai/generate-questions:
 *   post:
 *     tags: [AI Questions]
 *     summary: Generate questions using AI (Premium creators only)
 *     description: Generate multiple-choice questions using Google's Gemini AI. Only available to users with creator role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - difficulty
 *               - numberOfQuestions
 *             properties:
 *               topic:
 *                 type: string
 *                 description: The topic for question generation
 *                 example: "JavaScript Event Loop"
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Difficulty level of questions
 *                 example: "medium"
 *               numberOfQuestions:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 description: Number of questions to generate
 *                 example: 5
 *               marks:
 *                 type: integer
 *                 minimum: 1
 *                 description: Marks per question (optional, default is 1)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Questions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Questions generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionText:
 *                             type: string
 *                           marks:
 *                             type: integer
 *                           options:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 text:
 *                                   type: string
 *                                 isCorrect:
 *                                   type: boolean
 *                           explanation:
 *                             type: string
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         topic:
 *                           type: string
 *                         difficulty:
 *                           type: string
 *                         totalQuestions:
 *                           type: integer
 *                         totalMarks:
 *                           type: integer
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *                         generatedBy:
 *                           type: string
 *       400:
 *         description: Bad request - Invalid input or not a premium creator
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only creators can access this feature
 *       500:
 *         description: Server error - AI generation failed
 */
router.post('/generate-questions', authorizeRoles('creator', 'admin'), aiController.generateQuestions);

/**
 * @swagger
 * /api/ai/validate-topic:
 *   post:
 *     tags: [AI Questions]
 *     summary: Validate if a topic is appropriate for quiz generation
 *     description: Check if a given topic is suitable for educational quiz question generation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Topic to validate
 *                 example: "Python Programming"
 *     responses:
 *       200:
 *         description: Topic validation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       type: string
 *                     isValid:
 *                       type: boolean
 *                     message:
 *                       type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/validate-topic', authorizeRoles('creator', 'admin'), aiController.validateTopic);

export default router;
