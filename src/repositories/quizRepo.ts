import { Question } from "../models/quiz.model";
import mongoose from "mongoose";

export class QuizRepository {
  async createQuestion(questionData: any) {
    return Question.create(questionData);
  }

  async bulkCreate(channelId: string, adminId: string, questions: any[]) {
    const formatted = questions.map(q => ({
      ...q,
      channelId,
      createdBy: new mongoose.Types.ObjectId(adminId)
    }));
    return Question.insertMany(formatted);
  }

  async getQuestionsForChannel(channelId: string) {
    return Question.find({ channelId });
  }

  async getQuestionsForTest(channelId: string) {
    // Hide answers (isCorrect flag) from users
    return Question.find({ channelId }).select("-options.isCorrect -createdBy");
  }

  async getQuestionsByIds(ids: string[]) {
    const result = Question.find({ _id: { $in: ids } });
    return result
  }
}
