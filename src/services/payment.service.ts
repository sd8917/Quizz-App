import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment';
import User from '../models/user.model';
import PricingPlan from '../models/PricingPlan';

class PaymentService {
  private razorpay: any;

  constructor() {}

  private getRazorpayInstance() {
    if (!this.razorpay) {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys are not configured in environment variables.');
      }
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
    return this.razorpay;
  }

  async processOrderCreation(userId: string, amount: number, currency: string = 'INR', receipt: string, planId: string): Promise<any> {
    const instance = this.getRazorpayInstance();
    const options = {
      amount: amount * 100, // Razorpay takes amount in paise (smallest currency unit)
      currency,
      receipt,
    };

    const order: any = await new Promise((resolve, reject) => {
      instance.orders.create(options, (err: any, order: any) => {
        if (err) return reject(err);
        resolve(order);
      });
    });

    const payment = new Payment({
      userId,
      planId,
      razorpayOrderId: order.id,
      amount,
      currency,
      receipt,
      status: 'created',
    });

    await payment.save();

    return order;
  }

  async processPaymentVerification(orderId: string, paymentId: string, signature: string): Promise<{ success: boolean; message: string; payment?: any; code?: number }> {
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) {
      return { success: false, message: 'Order not found', code: 404 };
    }

    if (payment.status === 'paid') {
      return { success: true, message: 'Payment already verified', payment, code: 200 };
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay secret is not configured.');
    }

    const text = orderId + '|' + paymentId;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    const isValid = generated_signature === signature;

    if (isValid) {
      payment.status = 'paid';
      payment.razorpayPaymentId = paymentId;
      payment.razorpaySignature = signature;
      await payment.save();

      // Update User to reflect active subscription
      const user = await User.findById(payment.userId);
      const plan = await PricingPlan.findById(payment.planId);
      
      if (user && plan) {
        user.isPremium = true;
        user.activePlan = plan._id;
        // set expiry
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + plan.durationDays);
        user.premiumExpiresAt = expiry;
        await user.save();
      }

      return { success: true, message: 'Payment verified successfully', payment, code: 200 };
    } else {
      payment.status = 'failed';
      await payment.save();
      return { success: false, message: 'Invalid signature', code: 400 };
    }
  }
}

export const paymentService = new PaymentService();
