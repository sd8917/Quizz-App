import mongoose, { Document, Schema } from 'mongoose';

export interface IPricingPlan extends Document {
  name: string;
  description: string;
  priceInr: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
  stripePriceId?: string; // in case they migrate to stripe, leave optional placeholder
  createdAt: Date;
  updatedAt: Date;
}

const PricingPlanSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    priceInr: {
      type: Number,
      required: true,
    },
    durationDays: {
      type: Number,
      required: true,
      default: 30, // Default to monthly
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stripePriceId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPricingPlan>('PricingPlan', PricingPlanSchema);
