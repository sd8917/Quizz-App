import mongoose, { Document, Schema } from 'mongoose';

export interface IChannel extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: {
    user: mongoose.Types.ObjectId;
    role: 'admin' | 'team' | 'creator';
  }[];
  isArchived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'team', 'creator'],
          default: 'team',
        },
      },
    ],

    isArchived: {
      type: Boolean,
      default: false,
    },

    archivedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
// channelSchema.index({ owner: 1 });
// channelSchema.index({ 'members.user': 1 });
// channelSchema.index({ isArchived: 1 });

export const Channel = mongoose.model<IChannel>('Channel', channelSchema);
