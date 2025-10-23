import { Request, Response } from 'express';
import { Post } from '../models/post.model';

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, tags } = req.body;
    const post = await Post.create({
      title,
      content,
      tags,
      author: req.user._id,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPosts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const posts = await Post.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    res.json(post);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (post.author.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const { title, content, tags } = req.body;
    post.title = title || post.title;
    post.content = content || post.content;
    post.tags = tags || post.tags;

    const updatedPost = await post.save();
    res.json(updatedPost);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (post.author.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    await Post.deleteOne({ _id: post._id });
    res.json({ message: 'Post removed' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
    return;
  }
};