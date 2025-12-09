import { Schema, model, Document } from 'mongoose';

export interface IRoleRequest extends Document {
  userId: Schema.Types.ObjectId;
  requestedRole: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  reviewedBy?: Schema.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
}

const RoleRequestSchema = new Schema<IRoleRequest>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedRole: {
    type: String,
    required: true,
    enum: ['creator'],
    default: 'creator',
  },
  reason: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  reviewNotes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index to ensure a user can only have one pending request at a time
RoleRequestSchema.index({ userId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

export const RoleRequest = model<IRoleRequest>('RoleRequest', RoleRequestSchema);
