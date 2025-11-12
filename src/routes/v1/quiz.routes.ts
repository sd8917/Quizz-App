import { Router } from "express";
import { QuizController } from "../../controllers/quizz.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();
const quizController = new QuizController();

router.use(protect);

// ADMIN ROUTES
router.post("/channel/:channelId", quizController.adminCreateQuestion);
router.post("/channel/:channelId/bulk", quizController.adminBulkCreateQuestions);

// USER ROUTES
router.get("/channel/:channelId/questions", quizController.getChannelQuestionsForUser);
router.post("/channel/:channelId/submit", quizController.submitQuiz);

export { router as quizRoutes };
