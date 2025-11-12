import mongoose, { Schema, Document } from "mongoose";

export interface IUserAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOption: string;
  isCorrect: boolean;
}

export interface IAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  score: number;
  total: number;
  percentage: number;
  answers: IUserAnswer[];
  startedAt: Date;
  submittedAt: Date;
}

const userAnswerSchema = new Schema<IUserAnswer>({
  questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  selectedOption: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
});

const attemptSchema = new Schema<IAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    answers: [userAnswerSchema],
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

export const Attempt = mongoose.model<IAttempt>("Attempt", attemptSchema);
