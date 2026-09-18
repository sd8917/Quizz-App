import { Router } from 'express';
import { 
  triggerAutoRecovery, 
  autoApplyRecovery, 
  getPendingRequests, 
  approveRecoveryHandler, 
  rejectRecoveryHandler, 
  getRecoveryStatus, 
  analyzeErrors, 
  dailySummary 
} from '../../controllers/autoRecovery.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/auto-recovery/trigger:
 *   post:
 *     tags: [Auto Recovery]
 *     summary: Trigger auto-recovery check
 *     description: Reads error logs and creates an approval request if AI error is detected
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoApply:
 *                 type: boolean
 *                 description: If true, automatically apply high-confidence fixes without approval
 *                 default: false
 *     responses:
 *       200:
 *         description: Auto-recovery check completed
 *       500:
 *         description: Error in auto-recovery process
 */
router.post('/trigger', triggerAutoRecovery);

/**
 * @swagger
 * /api/v1/auto-recovery/auto-apply:
 *   post:
 *     tags: [Auto Recovery]
 *     summary: Trigger auto-recovery with auto-apply enabled
 *     description: Automatically applies high-confidence fixes without requiring admin approval
 *     responses:
 *       200:
 *         description: Auto-recovery with auto-apply completed
 *       500:
 *         description: Error in auto-recovery process
 */
router.post('/auto-apply', autoApplyRecovery);

/**
 * @swagger
 * /api/v1/auto-recovery/pending:
 *   get:
 *     tags: [Auto Recovery]
 *     summary: Get all pending approval requests
 *     description: Returns all pending auto-recovery approval requests
 *     responses:
 *       200:
 *         description: List of pending requests
 */
router.get('/pending', getPendingRequests);

/**
 * @swagger
 * /api/v1/auto-recovery/approve/{id}:
 *   get:
 *     tags: [Auto Recovery]
 *     summary: Approve and apply the auto-recovery fix
 *     description: Approve an auto-recovery request and apply the fix to the codebase
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "AR-1234567890-abc123"
 *     responses:
 *       200:
 *         description: Fix approved and applied
 *       404:
 *         description: Approval request not found
 */
router.get('/approve/:id', approveRecoveryHandler);

/**
 * @swagger
 * /api/v1/auto-recovery/reject/{id}:
 *   get:
 *     tags: [Auto Recovery]
 *     summary: Reject the auto-recovery fix
 *     description: Reject an auto-recovery request without applying any changes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "AR-1234567890-abc123"
 *     responses:
 *       200:
 *         description: Fix rejected
 *       404:
 *         description: Approval request not found
 */
router.get('/reject/:id', rejectRecoveryHandler);

/**
 * @swagger
 * /api/v1/auto-recovery/status/{id}:
 *   get:
 *     tags: [Auto Recovery]
 *     summary: Get approval request status
 *     description: Check the status of an auto-recovery approval request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "AR-1234567890-abc123"
 *     responses:
 *       200:
 *         description: Status retrieved
 *       404:
 *         description: Request not found
 */
router.get('/status/:id', getRecoveryStatus);

/**
 * @swagger
 * /api/v1/auto-recovery/analyze:
 *   get:
 *     tags: [Auto Recovery]
 *     summary: Analyze errors and get suggestions
 *     description: Reads error logs and returns analysis with fix suggestions
 *     responses:
 *       200:
 *         description: Error analysis with suggestions
 *       500:
 *         description: Error in analysis process
 */
router.get('/analyze', analyzeErrors);

/**
 * @swagger
 * /api/v1/auto-recovery/daily-summary:
 *   get:
 *     tags: [Auto Recovery]
 *     summary: Send daily error summary email
 *     description: Fetches today's errors from database and sends summary email to admin
 *     responses:
 *       200:
 *         description: Daily summary email sent
 *       500:
 *         description: Error in sending daily summary
 */
router.get('/daily-summary', dailySummary);

export default router;
