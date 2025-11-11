import { Router } from 'express';
import { QuestionController } from '../../controllers/question.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();
const questionController = new QuestionController();

router.use(protect);

// Search questions
router.get('/search', (questionController.searchQuestions));

// Channel questions
router.get('/channel/:channelId', questionController.getChannelQuestionsById);
router.post('/channel/:channelId', questionController.adminCreateQuestion);
router.post('/channel/:channelId/bulk', questionController.adminBulkCreateQuestions);

// Question CRUD
router.post('/', (questionController.createQuestion));
router.get('/:id', (questionController.getQuestion));
router.put('/:id', (questionController.updateQuestion));
router.delete('/:id', (questionController.deleteQuestion));

// Answers
router.post('/:id/answers', (questionController.addAnswer));
router.put('/:id/answers/:answerId/accept', (questionController.acceptAnswer));

// Voting
router.post('/:id/vote', (questionController.voteQuestion));
router.post('/:id/answers/:answerId/vote', (questionController.voteAnswer));

export { router as questionRoutes };