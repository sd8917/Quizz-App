import Feedback from '../models/feedback.model';

class FeedbackService {
  // Save feedback (name/email optional)
  async submitFeedback(data: { name?: string; email?: string; rating: number; message: string }) {
    const feedback = new Feedback(data);
    await feedback.save();
    return feedback;
  }

  // List feedbacks with pagination
  async listFeedbacks(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const items = await Feedback.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    const total = await Feedback.countDocuments().exec();
    return { items, total, page, limit };
  }
}

export default new FeedbackService();
