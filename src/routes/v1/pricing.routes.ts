import { Router } from 'express';
import {
  getActivePlans,
  getAllPlansAdmin,
  createPlan,
  updatePlan,
  deletePlan,
} from '../../controllers/pricing.controller';
import { protect } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';

const router = Router();

// Public / Authenticated route to get active plans
router.get('/', getActivePlans);

// Admin only routes
router.get('/admin', protect, requireAdmin, getAllPlansAdmin);
router.post('/', protect, requireAdmin, createPlan);
router.put('/:id', protect, requireAdmin, updatePlan);
router.delete('/:id', protect, requireAdmin, deletePlan);

export const pricingRoutes = router;
