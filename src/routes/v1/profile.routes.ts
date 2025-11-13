import { Router } from 'express';
import { profileController } from '../../controllers/profile.controller';
import { protect } from '../../middleware/auth.middleware';
import authorizeRoles from '../../middleware/role.middleware';

const router = Router();

router.use(protect);

// User profile
router.get('/', profileController.getMe);
router.put('/', profileController.updateMe);

// Admin only routes
router.get('/users', authorizeRoles('admin'), profileController.listUsers);
router.put('/user/:userId/roles', authorizeRoles('admin'), profileController.updateUserRoles);

export { router as profileRoutes };
    