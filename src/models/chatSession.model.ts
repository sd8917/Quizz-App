import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ['user', 'model'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSessionSchema = new Schema<IChatSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true },
  messages: [ChatMessageSchema],
}, { timestamps: true });

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
