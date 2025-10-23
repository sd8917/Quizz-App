import mongoose from 'mongoose';

export interface IPost extends mongoose.Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  tags: string[];
}

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

export const Post = mongoose.model<IPost>('Post', postSchema);