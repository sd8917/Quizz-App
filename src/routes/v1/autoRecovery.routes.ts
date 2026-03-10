import { Router } from 'express';
import { performAutoRecovery, approveRecovery, rejectRecovery, getApprovalStatus, getAllPendingRequests, analyzeErrorsAndGetSuggestions, sendDailyErrorSummary } from '../../services/autoRecovery.service';
import logger from '../../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/auto-recovery/trigger:
 *   post:
 *     tags: [Auto Recovery]
 *     summary: Trigger auto-recovery check
 *     description: Reads error logs and creates an approval request if AI error is detected
 *     parameters:
 *       - in: body
 *         name: body
 *         schema:
 *           type: object
 *           properties:
 *             autoApply:
 *               type: boolean
 *               description: If true, automatically apply high-confidence fixes without approval
 *               default: false
 *     responses:
 *       200:
 *         description: Auto-recovery check completed
 *       500:
 *         description: Error in auto-recovery process
 */
router.post('/trigger', async (req, res) => {
  try {
    const { autoApply = false } = req.body;
    const result = await performAutoRecovery(autoApply);
    res.json(result);
  } catch (error: any) {
    logger.error('[AutoRecovery Route] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
router.post('/auto-apply', async (req, res) => {
  try {
    const result = await performAutoRecovery(true);
    res.json(result);
  } catch (error: any) {
    logger.error('[AutoRecovery Route] Auto-apply Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
router.get('/pending', async (req, res) => {
  try {
    const pendingRequests = getAllPendingRequests();
    res.json({ success: true, data: pendingRequests });
  } catch (error: any) {
    logger.error('[AutoRecovery Route] Error fetching pending requests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
router.get('/approve/:id', async (req, res) => {
  const { id } = req.params;
  const result = await approveRecovery(id);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

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
router.get('/reject/:id', (req, res) => {
  const { id } = req.params;
  const result = rejectRecovery(id);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

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
router.get('/status/:id', (req, res) => {
  const { id } = req.params;
  const status = getApprovalStatus(id);
  
  if (status) {
    res.json({ success: true, data: status });
  } else {
    res.status(404).json({ success: false, message: 'Approval request not found' });
  }
});

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
router.get('/analyze', async (req, res) => {
  try {
    const result = await analyzeErrorsAndGetSuggestions();
    res.json(result);
  } catch (error: any) {
    logger.error('[AutoRecovery Route] Error analyzing errors:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
router.get('/daily-summary', async (req, res) => {
  try {
    await sendDailyErrorSummary();
    res.json({ success: true, message: 'Daily error summary sent' });
  } catch (error: any) {
    logger.error('[AutoRecovery Route] Error sending daily summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
