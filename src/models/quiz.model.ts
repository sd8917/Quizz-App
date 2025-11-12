import mongoose, { Schema, Document } from "mongoose";

export interface IOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion extends Document {
  channelId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  questionText: string;
  options: IOption[];
  marks: number;
}

const optionSchema = new Schema<IOption>({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
});

const questionSchema = new Schema<IQuestion>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questionText: { type: String, required: true },
    options: [optionSchema],
    marks: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const Question = mongoose.model<IQuestion>("Question", questionSchema);
