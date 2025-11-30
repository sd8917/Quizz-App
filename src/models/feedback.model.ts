import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  name?: string;
  email?: string;
  rating: number;
  message: string;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    name: { type: String },
    email: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: 'createdAt' } }
);

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);
