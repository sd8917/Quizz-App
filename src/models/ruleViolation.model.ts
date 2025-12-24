import mongoose, { Schema, Document } from "mongoose";

// Test rule voilation
export interface IRuleViolation extends Document {
  userId: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  reason: string;
  exitCount: number;
  createdAt: Date;
}

const ruleViolationSchema = new Schema<IRuleViolation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    reason: { type: String, required: true },
    exitCount: { type: Number, required: true },
  },
  { timestamps: true }
);

export const RuleViolation = mongoose.model<IRuleViolation>("RuleViolation", ruleViolationSchema);
