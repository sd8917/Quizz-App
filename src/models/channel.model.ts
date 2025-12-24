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
  // Quiz metadata
  totalQuestions?: number;
  duration?: number; // minutes
  passingScore?: number; // percent
  pointsPerQuestion?: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: 'public' | 'private';
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
    isPublic: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
      index: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    archivedAt: {
      type: Date,
    },

    // Quiz metadata (defaults mirror UI expectations)
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    duration: {
      type: Number,
      default: 30,
      min: 1,
    },

    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },

    pointsPerQuestion: {
      type: Number,
      default: 1,
      min: 0.1,
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

// Cascade delete: Remove all questions associated with this channel when channel is deleted
channelSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const channelId = this._id;
  // Delete all questions belonging to this channel
  await mongoose.model('Question').deleteMany({ channelId });
});

channelSchema.pre('findOneAndDelete', async function() {
  const channelId = this.getQuery()._id;
  if (channelId) {
    // Delete all questions belonging to this channel
    await mongoose.model('Question').deleteMany({ channelId });
  }
});

export const Channel = mongoose.model<IChannel>('Channel', channelSchema);
