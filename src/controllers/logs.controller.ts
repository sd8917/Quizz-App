import { Request, Response, NextFunction } from 'express';
import logsService from '../services/logs.service';
import { sendSuccess, sendBadRequest, sendNotFound, HTTP_STATUS } from '../utils/helper';

export class LogsController {
  /**
   * Get list of available log files
   * GET /api/logs/files
   */
  getLogFiles = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await logsService.getLogFiles();
      sendSuccess(res, data, 'Log files retrieved successfully');
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get logs with pagination and filtering
   * GET /api/logs?file=combined&page=1&pageSize=50&level=error&search=query&startDate=2025-11-01&endDate=2025-11-16
   */
  getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        file = 'combined',
        page = '1',
        pageSize = '50',
        level,
        search,
        startDate,
        endDate,
      } = req.query;

      // Validate pagination
      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        return sendBadRequest(res, 'Invalid page number', { page });
      }

      if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 500) {
        return sendBadRequest(res, 'Page size must be between 1 and 500', { pageSize });
      }

      const data = await logsService.getLogs(
        file as string,
        pageNum,
        pageSizeNum,
        level as string,
        search as string,
        startDate as string,
        endDate as string
      );

      sendSuccess(res, data, 'Logs retrieved successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return sendNotFound(res, error.message);
      }
      next(error);
    }
  };

  /**
   * Get recent error logs
   * GET /api/logs/errors?limit=100
   */
  getRecentErrors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = '100' } = req.query;
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        return sendBadRequest(res, 'Limit must be between 1 and 1000', { limit });
      }

      const data = await logsService.getRecentErrors(limitNum);
      sendSuccess(res, { errors: data, total: data.length }, 'Recent errors retrieved successfully');
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get log statistics
   * GET /api/logs/stats
   */
  getLogStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await logsService.getLogStats();
      sendSuccess(res, data, 'Log statistics retrieved successfully');
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Clear logs from a specific file
   * DELETE /api/logs/:fileName
   */
  clearLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fileName } = req.params;

      if (!fileName) {
        return sendBadRequest(res, 'File name is required');
      }

      // Only allow clearing specific log files
      const allowedFiles = ['combined', 'error'];
      if (!allowedFiles.includes(fileName)) {
        return sendBadRequest(res, 'Invalid file name', {
          provided: fileName,
          allowed: allowedFiles,
        });
      }

      await logsService.clearLogs(fileName);
      sendSuccess(res, null, `Logs cleared from ${fileName}.log`, HTTP_STATUS.OK);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return sendNotFound(res, error.message);
      }
      next(error);
    }
  };
}

export const logsController = new LogsController();
