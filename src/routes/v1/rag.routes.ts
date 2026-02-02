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
 * /api/v1/rag/query:
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
 *               userId:
 *                 type: string
 *                 description: Optional user ID filter
 *               channelId:
 *                 type: string
 *                 description: Optional channel ID filter
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

//NOTE: NOT WORKING ROUTE 
/**
 * @swagger
 * /api/v1/rag/diagram:
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

//NOTE: NOT WORKING ROUTE 
/**
 * @swagger
 * /api/v1/rag/index:
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

//NOTE: NOT WORKING ROUTE 
/**
 * @swagger
 * /api/v1/rag/initialize:
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
router.post('/initialize',authorizeRoles(ROLES.ADMIN), RAGController.initializeVectorStore);

export { router as ragRoutes };
