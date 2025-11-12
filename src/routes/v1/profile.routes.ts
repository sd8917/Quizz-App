import { Router } from 'express';
import { profileController } from '../../controllers/profile.controller';
import { protect } from '../../middleware/auth.middleware';
import authorizeRoles from '../../middleware/role.middleware';

const router = Router();

router.use(protect);

// User profile
router.get('/', profileController.getMe);
router.put('/', profileController.updateMe);

// Super admin only,  authorizeRoles('super') addd below
router.get('/users', profileController.listUsers);
router.put('/user/:userId/roles', authorizeRoles('super'), profileController.updateUserRoles);

export { router as profileRoutes };
    