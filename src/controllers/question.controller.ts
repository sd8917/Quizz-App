import { Request, Response } from 'express';
import { QuestionService } from '../services/questionService';
import { validate } from '../libs/validator';
import { BadRequestError } from '../utils/errors';

export class QuestionController {
  private questionService: QuestionService;

  constructor() {
    this.questionService = new QuestionService();
  }

  createQuestion = async (req: Request, res: Response) => {
    validate(req.body, {
      title: 'required|string|min:5|max:200',
      content: 'required|string|min:20',
      channelId: 'required|string',
      tags: 'array'
    });

    const question = await this.questionService.createQuestion({
      title: req.body.title,
      content: req.body.content,
      channelId: req.body.channelId,
      authorId: req.user!.id,
      tags: req.body.tags
    });

    res.status(201).json({
      success: true,
      data: question
    });
  };

  getQuestion = async (req: Request, res: Response) => {
    const question = await this.questionService.getQuestion(req.params.id);

    res.json({
      success: true,
      data: question
    });
  };

  getChannelQuestions = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const questions = await this.questionService.getChannelQuestions(
      req.params.channelId,
      page,
      limit
    );

    res.json({
      success: true,
      data: questions,
      pagination: {
        page,
        limit,
        total: questions.total,
        pages: Math.ceil(questions.total / limit)
      }
    });
  };

  updateQuestion = async (req: Request, res: Response) => {
    validate(req.body, {
      title: 'string|min:5|max:200',
      content: 'string|min:20',
      tags: 'array'
    });

    const question = await this.questionService.updateQuestion(
      req.params.id,
      req.user!.id,
      req.body
    );

    res.json({
      success: true,
      data: question
    });
  };

  deleteQuestion = async (req: Request, res: Response) => {
    await this.questionService.deleteQuestion(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  };

  addAnswer = async (req: Request, res: Response) => {
    validate(req.body, {
      content: 'required|string|min:20'
    });

    const question = await this.questionService.addAnswer(
      req.params.id,
      req.user!.id,
      req.body.content
    );

    res.status(201).json({
      success: true,
      data: question
    });
  };

  acceptAnswer = async (req: Request, res: Response) => {
    validate(req.params, {
      answerId: 'required|string'
    });

    const question = await this.questionService.acceptAnswer(
      req.params.id,
      req.params.answerId,
      req.user!.id
    );

    res.json({
      success: true,
      data: question
    });
  };

  voteQuestion = async (req: Request, res: Response) => {
    const value = req.body.value;
    if (value !== 1 && value !== -1) {
      throw new BadRequestError('Vote value must be 1 or -1');
    }

    const question = await this.questionService.voteQuestion(
      req.params.id,
      req.user!.id,
      value
    );

    res.json({
      success: true,
      data: question
    });
  };

  voteAnswer = async (req: Request, res: Response) => {
    validate(req.params, {
      answerId: 'required|string'
    });

    const value = req.body.value;
    if (value !== 1 && value !== -1) {
      throw new BadRequestError('Vote value must be 1 or -1');
    }

    const question = await this.questionService.voteAnswer(
      req.params.id,
      req.params.answerId,
      req.user!.id,
      value
    );

    res.json({
      success: true,
      data: question
    });
  };

  searchQuestions = async (req: Request, res: Response) => {
    validate(req.query, {
      q: 'required|string|min:3'
    });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const questions = await this.questionService.searchQuestions(
      req.query.q as string,
      page,
      limit
    );

    res.json({
      success: true,
      data: questions,
      pagination: {
        page,
        limit,
        total: questions.total,
        pages: Math.ceil(questions.total / limit)
      }
    });
  };
}