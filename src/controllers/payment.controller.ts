import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import Payment from '../models/Payment';
import User from '../models/user.model';
import redis from '../config/redis';
import logger from '../utils/logger';
import PDFDocument from 'pdfkit';
import {
  sendCreated,
  sendBadRequest,
  sendConflict,
  sendNotFound,
  sendError,
  sendSuccess
} from '../utils/helper';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}`, planId } = req.body;
    // req.user is added by auth middleware
    const userObj = req.user as any;
    const userId = userObj?._id || userObj?.id || req.body.userId;

    if (!userId || !amount || !planId) {
      sendBadRequest(res, 'Invalid request data. Amount and planId are required.');
      return;
    }

    // Check if user already has an active subscription
    const user = await User.findById(userId);
    if (user && user.checkPremiumStatus()) {
      sendConflict(res, 'You already have an active subscription.');
      return;
    }

    // Idempotency: Prevent user from creating another identical order within 10 seconds
    const idempotencyKey = `payment:create:${userId}:${amount}:${currency}`;
    if (redis) {
      const isLocked = await redis.set(idempotencyKey, 'locked', 'EX', 10, 'NX');
      if (!isLocked) {
        sendConflict(res, 'Please wait before creating another order');
        return;
      }
    }

    const order = await paymentService.processOrderCreation(userId, amount, currency, receipt, planId);

    sendCreated(res, order, 'Order created successfully');
    return;
  } catch (error: any) {
    logger.error('Error creating payment order:', error);
    sendError(res, 'Failed to create order', 500, 'CREATE_ORDER_FAILED', error.message);
    return;
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      sendBadRequest(res, 'Missing payment parameters');
      return;
    }

    // Idempotency / Duplicate payment handling using Redis distributed lock
    const lockKey = `payment:verify:${razorpay_order_id}`;
    if (redis) {
      // Set key only if it doesn't exist, expire in 30 seconds
      const isLocked = await redis.set(lockKey, 'locked', 'EX', 30, 'NX');
      if (!isLocked) {
        sendConflict(res, 'Payment verification already in progress or completed');
        return;
      }
    }

    const result = await paymentService.processPaymentVerification(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!result.success) {
      if (redis) await redis.del(lockKey); // release lock on failure
      
      if (result.code === 404) {
        sendNotFound(res, result.message);
      } else {
        sendBadRequest(res, result.message);
      }
      return;
    }

    sendSuccess(res, result.payment, result.message);
    return;
  } catch (error: any) {
    logger.error('Error verifying payment:', error);
    sendError(res, 'Failed to verify payment', 500, 'VERIFY_PAYMENT_FAILED', error.message);
    return;
  }
};

export const downloadReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const userObj = req.user as any;
    const userId = userObj?._id || userObj?.id;

    const payment = await Payment.findById(paymentId).populate('planId');
    if (!payment) {
      sendNotFound(res, 'Payment not found');
      return;
    }

    // Ensure the user downloading the receipt is the owner
    if (payment.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (payment.status !== 'paid') {
      sendBadRequest(res, 'Cannot download receipt for unpaid or failed transactions');
      return;
    }

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment.razorpayPaymentId}.pdf`);

    doc.pipe(res);

    // Build PDF content
    doc.fontSize(25).text('Payment Receipt', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Receipt No: ${payment.receipt}`);
    doc.text(`Date: ${payment.updatedAt.toDateString()}`);
    doc.moveDown();

    doc.text(`Transaction ID: ${payment.razorpayPaymentId}`);
    doc.text(`Order ID: ${payment.razorpayOrderId}`);
    doc.text(`Status: ${payment.status.toUpperCase()}`);
    doc.moveDown();

    const plan: any = payment.planId;
    if (plan && plan.name) {
      doc.text(`Plan Subscribed: ${plan.name}`);
    }
    
    doc.text(`Amount Paid: ${(payment.amount).toFixed(2)} ${payment.currency}`);
    
    doc.moveDown(2);
    doc.text('Thank you for your purchase!', { align: 'center' });

    doc.end();

  } catch (error: any) {
    logger.error('Error generating receipt:', error);
    if (!res.headersSent) {
      sendError(res, 'Failed to generate receipt', 500, 'RECEIPT_GENERATION_FAILED', error.message);
    }
  }
};

export const getUserPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userObj = req.user as any;
    const userId = userObj?._id || userObj?.id;

    if (!userId) {
      sendBadRequest(res, 'User ID not found');
      return;
    }

    const payments = await Payment.find({ userId }).sort({ createdAt: -1 }).populate('planId', 'name description durationDays');
    
    sendSuccess(res, payments, 'User payments fetched successfully');
  } catch (error: any) {
    logger.error('Error fetching user payments:', error);
    sendError(res, 'Failed to fetch user payments', 500, 'FETCH_PAYMENTS_FAILED', error.message);
  }
};
