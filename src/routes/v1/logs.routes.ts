import { Router } from 'express';
import { logsController } from '../../controllers/logs.controller';
import { protect } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/role.middleware';
import { ROLES } from '../../utils/helper';

const router = Router();

/**
 * All logs routes require authentication and admin role
 */

/**
 * @openapi
 * /api/logs/files:
 *   get:
 *     tags:
 *       - Logs
 *     summary: Get list of log files
 *     description: Retrieve a list of all available log files with metadata (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         files:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: error.log
 *                               path:
 *                                 type: string
 *                                 example: error
 *                               size:
 *                                 type: number
 *                                 example: 245680
 *                               sizeFormatted:
 *                                 type: string
 *                                 example: 239.92 KB
 *                               modifiedAt:
 *                                 type: string
 *                                 format: date-time
 *                               type:
 *                                 type: string
 *                                 enum: [error, combined, other]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Get list of log files
router.get('/files', protect, authorizeRoles(ROLES.ADMIN), logsController.getLogFiles);

/**
 * @openapi
 * /api/logs:
 *   get:
 *     tags:
 *       - Logs
 *     summary: Get logs with filters
 *     description: Retrieve logs with pagination, filtering, and search (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: file
 *         schema:
 *           type: string
 *           enum: [combined, error]
 *           default: combined
 *         description: Log file to read from
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 50
 *         description: Number of logs per page
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: Filter by log level
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword in log messages
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date (ISO 8601)
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         logs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/LogEntry'
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         file:
 *                           type: string
 *       400:
 *         description: Invalid parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Get logs with filtering and pagination
router.get('/', protect, authorizeRoles(ROLES.ADMIN), logsController.getLogs);

/**
 * @openapi
 * /api/logs/errors:
 *   get:
 *     tags:
 *       - Logs
 *     summary: Get recent error logs
 *     description: Quick access to the most recent error logs (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Number of error logs to retrieve
 *     responses:
 *       200:
 *         description: Recent errors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         errors:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/LogEntry'
 *                         total:
 *                           type: integer
 *       400:
 *         description: Invalid limit parameter
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Get recent errors
router.get('/errors', protect, authorizeRoles(ROLES.ADMIN), logsController.getRecentErrors);

/**
 * @openapi
 * /api/logs/stats:
 *   get:
 *     tags:
 *       - Logs
 *     summary: Get log statistics
 *     description: Get comprehensive statistics about server logs and health (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalFiles:
 *                           type: integer
 *                         files:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               size:
 *                                 type: string
 *                               modifiedAt:
 *                                 type: string
 *                                 format: date-time
 *                         recentErrors:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             byLevel:
 *                               type: object
 *                             oldestTimestamp:
 *                               type: string
 *                               format: date-time
 *                             newestTimestamp:
 *                               type: string
 *                               format: date-time
 *                         serverUptime:
 *                           type: number
 *                         memoryUsage:
 *                           type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Get log statistics
router.get('/stats', protect, authorizeRoles(ROLES.ADMIN), logsController.getLogStats);

/**
 * @openapi
 * /api/logs/{fileName}:
 *   delete:
 *     tags:
 *       - Logs
 *     summary: Clear logs
 *     description: Clear all logs from a specific log file (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [combined, error]
 *         description: Name of the log file to clear
 *     responses:
 *       200:
 *         description: Logs cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid file name
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Clear logs
router.delete('/:fileName', protect, authorizeRoles(ROLES.ADMIN), logsController.clearLogs);

export const logsRoutes = router;
