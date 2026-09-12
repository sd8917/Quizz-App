import { Router } from "express";
import { AttemptController } from "../../controllers/attempt.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();
const attemptController = new AttemptController();

router.use(protect);

// User submits quiz attempt
/**
 * @openapi
 * /api/attempt/channel/{channelId}/submit:
 *   post:
 *     tags:
 *       - Attempts
 *     summary: Submit a quiz attempt
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
 *               score:
 *                 type: integer
 *               timeTaken:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Attempt submitted successfully
 */
router.post("/channel/:channelId/submit", attemptController.submitQuizAttempt);

// User fetches their attempts
/**
 * @openapi
 * /api/attempt/user:
 *   get:
 *     tags:
 *       - Attempts
 *     summary: Get user attempts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attempts retrieved successfully
 */
router.get("/user", attemptController.getUserAttempts);

// Channel leaderboard
/**
 * @openapi
 * /api/attempt/channel/{channelId}/leaderboard:
 *   get:
 *     tags:
 *       - Attempts
 *     summary: Get channel leaderboard
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
 *         description: Leaderboard retrieved successfully
 */
router.get("/channel/:channelId/leaderboard", attemptController.getLeaderboard);

// Handle fullscreen violation
/**
 * @openapi
 * /api/attempt/channel/{channelId}/fullscreen-violation:
 *   post:
 *     tags:
 *       - Attempts
 *     summary: Report a fullscreen violation
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
 *         description: Violation reported
 */
router.post("/channel/:channelId/fullscreen-violation", attemptController.handleFullscreenViolation);

// Channel submissions
/**
 * @openapi
 * /api/attempt/channel/{channelId}/submissions:
 *   get:
 *     tags:
 *       - Attempts
 *     summary: Get all submissions for a channel
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
 *         description: Submissions retrieved successfully
 */
router.get("/channel/:channelId/submissions", attemptController.getChannelSubmissions);

// Specific attempt details
/**
 * @openapi
 * /api/attempt/{attemptId}:
 *   get:
 *     tags:
 *       - Attempts
 *     summary: Get specific attempt details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attempt retrieved successfully
 */
router.get("/:attemptId", attemptController.getAttemptById);

export { router as attemptRoutes };
