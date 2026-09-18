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
router.post('/auto-apply', async (_req, res) => {
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
router.get('/pending', async (_req, res) => {
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
  
  if (req.accepts('html')) {
    const color = result.success ? '#4CAF50' : '#F44336';
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #f9f9f9;">
          <div style="background: white; max-width: 500px; margin: auto; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h1 style="color: ${color}; margin-top: 0;">${result.success ? '✅ Fix Approved' : '❌ Failed'}</h1>
            <p style="font-size: 18px; color: #333;">${result.message}</p>
            <p style="color: #666; margin-top: 30px;">You can now close this tab.</p>
          </div>
        </body>
      </html>
    `;
    return res.send(html);
  }

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
  
  if (req.accepts('html')) {
    const color = result.success ? '#ff9800' : '#F44336';
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #f9f9f9;">
          <div style="background: white; max-width: 500px; margin: auto; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h1 style="color: ${color}; margin-top: 0;">${result.success ? '🚫 Fix Rejected' : '❌ Failed'}</h1>
            <p style="font-size: 18px; color: #333;">${result.message}</p>
            <p style="color: #666; margin-top: 30px;">You can now close this tab.</p>
          </div>
        </body>
      </html>
    `;
    return res.send(html);
  }

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
router.get('/analyze', async (_req, res) => {
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
router.get('/daily-summary', async (_req, res) => {
  try {
    await sendDailyErrorSummary();
    res.json({ success: true, message: 'Daily error summary sent' });
  } catch (error: any) {
    logger.error('[AutoRecovery Route] Error sending daily summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
