import { Router } from "express";
import { QuizController } from "../../controllers/quizz.controller";
import { protect } from "../../middleware/auth.middleware";
import authorizeRoles from '../../middleware/role.middleware';

const router = Router();
const quizController = new QuizController();

router.use(protect);

// ADMIN ROUTES
router.post("/channel/:channelId",authorizeRoles('creator', 'admin'),  quizController.adminCreateQuestion);
router.post("/channel/:channelId/bulk", authorizeRoles('creator', 'admin'), quizController.adminBulkCreateQuestions);

router.get("/channel/:channelId/questions", quizController.getChannelQuestionsForUser);

// USER ROUTES
router.post("/channel/:channelId/submit",authorizeRoles('user'), quizController.submitQuiz);

export { router as quizRoutes };
