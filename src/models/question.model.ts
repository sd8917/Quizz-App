import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  title: string;              // Question title
  questionGroupTitle?: string; // Title for grouping questions (e.g., "Quiz 1" or "JavaScript Basics")
  content: string;            // Question content/prompt
  channel: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  tags?: string[];
  options: {                  // Multiple choice options
    text: string;            // Option text
    isCorrect: boolean;      // Whether this is the correct answer
    explanation?: string;    // Optional explanation for this option
  }[];
  answers: {                  // User submitted answers
    _id: any;
    content: string;
    author: mongoose.Types.ObjectId;
    votes: number;
    isAccepted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
  type: 'multiple_choice' | 'open_ended'; // Question type
  difficulty: 'easy' | 'medium' | 'hard';  // Question difficulty
  points: number;             // Points awarded for correct answer
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

    questionGroupTitle: {
      type: String,
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

    options: [{
      text: {
        type: String,
        required: [true, 'Option text is required'],
        trim: true,
      },
      isCorrect: {
        type: Boolean,
        required: [true, 'Must specify if option is correct'],
      },
      explanation: {
        type: String,
        trim: true,
      },
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

    type: {
      type: String,
      enum: ['multiple_choice', 'open_ended'],
      required: [true, 'Question type is required'],
      default: 'multiple_choice',
    },

    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: [true, 'Question difficulty is required'],
      default: 'medium',
    },

    points: {
      type: Number,
      required: [true, 'Points value is required'],
      default: 10,
      min: [0, 'Points cannot be negative'],
    },

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
questionSchema.index({ questionGroupTitle: 1 });
questionSchema.index({ type: 1, difficulty: 1 });
questionSchema.index({ points: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);