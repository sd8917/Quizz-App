import { Router } from "express";
import { AttemptController } from "../../controllers/attempt.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();
const attemptController = new AttemptController();

router.use(protect);

// User submits quiz attempt
router.post("/channel/:channelId/submit", attemptController.submitQuizAttempt);

// User fetches their attempts
router.get("/user", attemptController.getUserAttempts);

// Channel leaderboard
router.get("/channel/:channelId/leaderboard", attemptController.getLeaderboard);

export { router as attemptRoutes };
