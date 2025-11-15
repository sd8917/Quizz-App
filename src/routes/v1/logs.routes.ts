import { Router } from 'express';
import { logsController } from '../../controllers/logs.controller';
import { protect } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/role.middleware';
import { ROLES } from '../../utils/helper';

const router = Router();

/**
 * All logs routes require authentication and admin role
 */

// Get list of log files
router.get('/files', protect, authorizeRoles(ROLES.ADMIN), logsController.getLogFiles);

// Get logs with filtering and pagination
router.get('/', protect, authorizeRoles(ROLES.ADMIN), logsController.getLogs);

// Get recent errors
router.get('/errors', protect, authorizeRoles(ROLES.ADMIN), logsController.getRecentErrors);

// Get log statistics
router.get('/stats', protect, authorizeRoles(ROLES.ADMIN), logsController.getLogStats);

// Clear logs
router.delete('/:fileName', protect, authorizeRoles(ROLES.ADMIN), logsController.clearLogs);

export const logsRoutes = router;
