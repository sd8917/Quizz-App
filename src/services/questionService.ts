import { Types } from 'mongoose';
import { QuestionRepository } from '../repositories/questionRepo';
import { Channel } from '../models/channel.model';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';

export class QuestionService {
  private questionRepo: QuestionRepository;

  constructor() {
    this.questionRepo = new QuestionRepository();
  }

  /**
   * Add a single question to a channel by a channel admin.
   * If authorId is not provided, adminId will be used as the author.
   */
  async addQuestionToChannel(params: {
    channelId: string;
    adminId: string;
    title: string;
    content: string;
    tags?: string[];
    authorId?: string;
  }) {
    const { channelId, adminId, title, content, tags, authorId } = params;

    const channel = await Channel.findById(channelId);
    if (!channel) throw new NotFoundError('Channel not found');

    // allow if owner or member with admin role
    const isOwner = channel.owner.toString() === adminId;
    const member = channel.members.find(m => m.user.toString() === adminId);
    const isAdmin = isOwner || (member && member.role === 'admin');
    if (!isAdmin) throw new ForbiddenError('Only channel admins can add questions');

    if (!title || !content) throw new BadRequestError('title and content are required');

    const questionDoc: Partial<any> = {
      title,
      content,
      channel: new Types.ObjectId(channelId),
      author: new Types.ObjectId(authorId || adminId),
      tags,
    };

    return await this.questionRepo.create(questionDoc);
  }

  /**
   * Bulk add questions to a channel. Only channel admins can perform this.
   * Expects an array of { title, content, tags?, authorId? } objects.
   */
  async addQuestionsBulk(channelId: string, adminId: string, questions: Array<{ title: string; content: string; tags?: string[]; authorId?: string }>) {
    const channel = await Channel.findById(channelId);
    if (!channel) throw new NotFoundError('Channel not found');

    const isOwner = channel.owner.toString() === adminId;
    const member = channel.members.find(m => m.user.toString() === adminId);
    const isAdmin = isOwner || (member && member.role === 'admin');
    if (!isAdmin) throw new ForbiddenError('Only channel admins can add questions');

    if (!Array.isArray(questions) || questions.length === 0) throw new BadRequestError('questions array is required');

    // Map to question docs
    const docs = questions.map(q => ({
      title: q.title,
      content: q.content,
      channel: new Types.ObjectId(channelId),
      author: new Types.ObjectId(q.authorId || adminId),
      tags: q.tags || [],
    }));

    return await this.questionRepo.bulkCreate(docs as any);
  }

  async createQuestion(questionData: {
    title: string;
    content: string;
    channelId: string;
    authorId: string;
    tags?: string[];
  }) {
    // Verify channel exists and user has access
    const channel = await Channel.findById(questionData.channelId);
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    // Check if user is a member of the channel
    const isMember = channel.members.some(
      member => member.user.toString() === questionData.authorId
    );
    if (!isMember) {
      throw new ForbiddenError('You must be a member of the channel to post questions');
    }

    return await this.questionRepo.create({
      title: questionData.title,
      content: questionData.content,
      channel: new Types.ObjectId(questionData.channelId),
      author: new Types.ObjectId(questionData.authorId),
      tags: questionData.tags,
    });
  }

  async getQuestion(id: string) {
    const question = await this.questionRepo.findById(id);
    if (!question) {
      throw new NotFoundError('Question not found');
    }
    return question;
  }

  async getChannelQuestions(channelId: string, page: number = 1, limit: number = 10) {
    // Verify channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    return await this.questionRepo.findByChannel(channelId, page, limit);
  }

  async updateQuestion(id: string, userId: string, updateData: {
    title?: string;
    content?: string;
    tags?: string[];
  }) {
    const question = await this.questionRepo.findById(id);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Only author can update the question
    if (question.author.toString() !== userId) {
      throw new ForbiddenError('Only the author can update this question');
    }

    return await this.questionRepo.update(id, updateData);
  }

  async deleteQuestion(id: string, userId: string) {
    const question = await this.questionRepo.findById(id);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Check if user is author or channel owner
    const channel = await Channel.findById(question.channel);
    const isAuthor = question.author.toString() === userId;
    const isChannelOwner = channel?.owner.toString() === userId;

    if (!isAuthor && !isChannelOwner) {
      throw new ForbiddenError('Only the author or channel owner can delete this question');
    }

    return await this.questionRepo.delete(id);
  }

  async addAnswer(questionId: string, userId: string, content: string) {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Verify user is a member of the channel
    const channel = await Channel.findById(question.channel);
    const isMember = channel?.members.some(
      member => member.user.toString() === userId
    );
    if (!isMember) {
      throw new ForbiddenError('You must be a member of the channel to answer questions');
    }

    return await this.questionRepo.addAnswer(questionId, {
      content,
      author: new Types.ObjectId(userId)
    });
  }

  async acceptAnswer(questionId: string, answerId: string, userId: string) {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Only question author can accept an answer
    if (question.author.toString() !== userId) {
      throw new ForbiddenError('Only the question author can accept an answer');
    }

    const answer = question.answers.find(a => a._id.toString() === answerId);
    if (!answer) {
      throw new NotFoundError('Answer not found');
    }

    return await this.questionRepo.acceptAnswer(questionId, new Types.ObjectId(answerId));
  }

  async voteQuestion(questionId: string, userId: string, value: 1 | -1) {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // User cannot vote on their own question
    if (question.author.toString() === userId) {
      throw new BadRequestError('You cannot vote on your own question');
    }

    return await this.questionRepo.vote(questionId, value);
  }

  async voteAnswer(questionId: string, answerId: string, userId: string, value: 1 | -1) {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const answer = question.answers.find(a => a._id.toString() === answerId);
    if (!answer) {
      throw new NotFoundError('Answer not found');
    }

    // User cannot vote on their own answer
    if (answer.author.toString() === userId) {
      throw new BadRequestError('You cannot vote on your own answer');
    }

    return await this.questionRepo.voteAnswer(
      questionId,
      new Types.ObjectId(answerId),
      value
    );
  }

  async searchQuestions(query: string, page: number = 1, limit: number = 10) {
    return await this.questionRepo.search(query, page, limit);
  }
}