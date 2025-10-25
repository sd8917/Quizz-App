import { Types } from 'mongoose';
import { Question, IQuestion } from '../models/question.model';

export class QuestionRepository {
  async create(questionData: Partial<IQuestion>): Promise<IQuestion> {
    const question = new Question(questionData);
    return await question.save();
  }

  async findById(id: string): Promise<IQuestion | null> {
    return await Question.findById(id)
      .populate('author', 'username email')
      .populate('channel', 'name')
      .populate('answers.author', 'username email');
  }

  async findByChannel(channelId: string, page: number = 1, limit: number = 10): Promise<{ questions: IQuestion[]; total: number }> {
    const skip = (page - 1) * limit;
    const [questions, total] = await Promise.all([
      Question.find({ channel: channelId, isArchived: false })
        .populate('author', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments({ channel: channelId, isArchived: false })
    ]);

    return { questions, total };
  }

  async update(id: string, updateData: Partial<IQuestion>): Promise<IQuestion | null> {
    return await Question.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await Question.findByIdAndUpdate(
      id,
      {
        $set: {
          isArchived: true,
          archivedAt: new Date()
        }
      }
    );
    return !!result;
  }

  async addAnswer(questionId: string, answer: {
    content: string;
    author: Types.ObjectId;
  }): Promise<IQuestion | null> {
    return await Question.findByIdAndUpdate(
      questionId,
      {
        $push: {
          answers: {
            ...answer,
            votes: 0,
            isAccepted: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('answers.author', 'username email');
  }

  async acceptAnswer(questionId: string, answerId: Types.ObjectId): Promise<IQuestion | null> {
    // First reset any previously accepted answer
    await Question.updateOne(
      { _id: questionId },
      { $set: { "answers.$[].isAccepted": false } }
    );

    // Then set the new accepted answer
    return await Question.findOneAndUpdate(
      { _id: questionId, "answers._id": answerId },
      { $set: { "answers.$.isAccepted": true } },
      { new: true }
    );
  }

  async vote(questionId: string, increment: number): Promise<IQuestion | null> {
    return await Question.findByIdAndUpdate(
      questionId,
      { $inc: { votes: increment } },
      { new: true }
    );
  }

  async voteAnswer(questionId: string, answerId: Types.ObjectId, increment: number): Promise<IQuestion | null> {
    return await Question.findOneAndUpdate(
      { _id: questionId, "answers._id": answerId },
      { $inc: { "answers.$.votes": increment } },
      { new: true }
    );
  }

  async search(query: string, page: number = 1, limit: number = 10): Promise<{ questions: IQuestion[]; total: number }> {
    const searchRegex = new RegExp(query, 'i');
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      Question.find({
        isArchived: false,
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex }
        ]
      })
        .populate('author', 'username email')
        .populate('channel', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments({
        isArchived: false,
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex }
        ]
      })
    ]);

    return { questions, total };
  }

  /**
   * Insert many questions in bulk. Expects array of question documents (partial).
   */
  async bulkCreate(questions: Partial<IQuestion>[]): Promise<IQuestion[]> {
    if (!Array.isArray(questions) || questions.length === 0) return [];
    const docs = await Question.insertMany(questions, { ordered: false });
    return docs as IQuestion[];
  }
}