import { Document, Types } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostRequest {
  title: string;
  content: string;
  tags?: string[];
}

export interface IPostResponse extends IPostRequest {
  _id: string;
  author: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}