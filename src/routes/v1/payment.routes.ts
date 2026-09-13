import { Router } from 'express';
import { createOrder, verifyPayment, downloadReceipt, getUserPayments } from '../../controllers/payment.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getUserPayments);
router.get('/receipt/:paymentId', protect, downloadReceipt);

export const paymentRoutes = router;
