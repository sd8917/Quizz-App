import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  title: string;
  content: string;
  channel: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  tags?: string[];
  answers: {
    _id: any;
    content: string;
    author: mongoose.Types.ObjectId;
    votes: number;
    isAccepted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
  votes: number;
  isArchived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
    },

    content: {
      type: String,
      required: [true, 'Question content is required'],
      trim: true,
    },

    channel: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    tags: [{
      type: String,
      trim: true,
    }],

    answers: [{
      content: {
        type: String,
        required: true,
        trim: true,
      },
      author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      votes: {
        type: Number,
        default: 0,
      },
      isAccepted: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    }],

    votes: {
      type: Number,
      default: 0,
    },

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

// Index for improved query performance
questionSchema.index({ channel: 1, createdAt: -1 });
questionSchema.index({ author: 1, createdAt: -1 });
questionSchema.index({ tags: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);