import { Request, Response } from 'express';
import { 
  performAutoRecovery, 
  approveRecovery, 
  rejectRecovery, 
  getApprovalStatus, 
  getAllPendingRequests, 
  analyzeErrorsAndGetSuggestions, 
  sendDailyErrorSummary 
} from '../services/autoRecovery.service';
import logger from '../utils/logger';

export const triggerAutoRecovery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { autoApply = false } = req.body;
    const result = await performAutoRecovery(autoApply);
    res.json(result);
  } catch (error: any) {
    logger.error('[AutoRecovery Controller] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const autoApplyRecovery = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await performAutoRecovery(true);
    res.json(result);
  } catch (error: any) {
    logger.error('[AutoRecovery Controller] Auto-apply Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingRequests = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pendingRequests = getAllPendingRequests();
    res.json({ success: true, data: pendingRequests });
  } catch (error: any) {
    logger.error('[AutoRecovery Controller] Error fetching pending requests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveRecoveryHandler = async (req: Request, res: Response): Promise<void> => {
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
    res.send(html);
    return;
  }

  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
};

export const rejectRecoveryHandler = (req: Request, res: Response): void => {
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
    res.send(html);
    return;
  }

  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
};

export const getRecoveryStatus = (req: Request, res: Response): void => {
  const { id } = req.params;
  const status = getApprovalStatus(id);
  
  if (status) {
    res.json({ success: true, data: status });
  } else {
    res.status(404).json({ success: false, message: 'Approval request not found' });
  }
};

export const analyzeErrors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await analyzeErrorsAndGetSuggestions();
    res.json(result);
  } catch (error: any) {
    logger.error('[AutoRecovery Controller] Error analyzing errors:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const dailySummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    await sendDailyErrorSummary();
    res.json({ success: true, message: 'Daily error summary sent' });
  } catch (error: any) {
    logger.error('[AutoRecovery Controller] Error sending daily summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
