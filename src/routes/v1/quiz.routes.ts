import { Router } from "express";
import { QuizController } from "../../controllers/quizz.controller";
import { protect } from "../../middleware/auth.middleware";
import authorizeRoles from '../../middleware/role.middleware';

const router = Router();
const quizController = new QuizController();

router.use(protect);

// ADMIN ROUTES
/**
 * @openapi
 * /api/quiz/channel/{channelId}:
 *   post:
 *     tags:
 *       - Quizzes
 *     summary: Create a new question for a channel
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
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correctAnswer:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Question created successfully
 */
router.post("/channel/:channelId",authorizeRoles('creator', 'admin'),  quizController.adminCreateQuestion);
/**
 * @openapi
 * /api/quiz/channel/{channelId}/bulk:
 *   post:
 *     tags:
 *       - Quizzes
 *     summary: Bulk create questions for a channel
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
 *               questions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Quiz'
 *     responses:
 *       201:
 *         description: Questions bulk created successfully
 */
router.post("/channel/:channelId/bulk", authorizeRoles('creator', 'admin'), quizController.adminBulkCreateQuestions);

/**
 * @openapi
 * /api/quiz/channel/{channelId}/questions:
 *   get:
 *     tags:
 *       - Quizzes
 *     summary: Get all questions for a channel
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
 *         description: Questions retrieved successfully
 */
router.get("/channel/:channelId/questions", quizController.getChannelQuestionsForUser);

// USER ROUTES
/**
 * @openapi
 * /api/quiz/channel/{channelId}/submit:
 *   post:
 *     tags:
 *       - Quizzes
 *     summary: Submit a quiz
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
 *     responses:
 *       200:
 *         description: Quiz submitted successfully
 */
router.post("/channel/:channelId/submit",authorizeRoles('user'), quizController.submitQuiz);

export { router as quizRoutes };
