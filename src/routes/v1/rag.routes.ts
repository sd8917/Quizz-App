import { Router } from 'express';
import RAGController from '../../controllers/rag.controller';
import { protect } from '../../middleware/auth.middleware';
import { ROLES } from '../../utils/helper';
import authorizeRoles from '../../middleware/role.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/rag/search:
 *   post:
 *     summary: Query the RAG chatbot
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Natural language query about the database
 *               sessionId:
 *                 type: string
 *                 description: Optional session ID to maintain chat context/history
 *               filters:
 *                 type: object
 *                 properties:
 *                   topic:
 *                     type: string
 *                   username:
 *                     type: string
 *                   dateRange:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         format: date
 *                       end:
 *                         type: string
 *                         format: date
 *     responses:
 *       200:
 *         description: Query processed successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/search', authorizeRoles(ROLES.ADMIN), RAGController.query);

/**
 * @swagger
 * /api/rag/sessions:
 *   get:
 *     summary: Get all chat sessions for the current user
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/sessions', authorizeRoles(ROLES.ADMIN), RAGController.getSessions);

/**
 * @swagger
 * /api/rag/sessions/{sessionId}:
 *   get:
 *     summary: Get message history for a specific chat session
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique session identifier
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.get('/sessions/:sessionId', authorizeRoles(ROLES.ADMIN), RAGController.getSessionById);

/**
 * @swagger
 * /api/rag/sessions/{sessionId}:
 *   delete:
 *     summary: Clear/delete a specific chat session
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique session identifier
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.delete('/sessions/:sessionId', authorizeRoles(ROLES.ADMIN), RAGController.clearSession);

/**
 * @swagger
 * /api/rag/diagram:
 *   post:
 *     summary: Generate diagram based on query
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Query to generate diagram for
 *     responses:
 *       200:
 *         description: Diagram generated successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/diagram', authorizeRoles(ROLES.ADMIN), RAGController.generateDiagram);

/**
 * @swagger
 * /api/rag/index:
 *   post:
 *     summary: Index database content for RAG (Admin only)
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Content indexed successfully
 *       500:
 *         description: Server error
 */
router.post('/index', authorizeRoles(ROLES.ADMIN), RAGController.indexContent);

/**
 * @swagger
 * /api/rag/initialize:
 *   post:
 *     summary: Initialize vector store (Admin only)
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vector store initialized successfully
 *       500:
 *         description: Server error
 */
router.post('/initialize', authorizeRoles(ROLES.ADMIN), RAGController.initializeVectorStore);

export { router as ragRoutes };
