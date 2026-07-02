import { Request, Response } from 'express';
import RAGService from '../services/rag.service';
import ChatSession from '../models/chatSession.model';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

class RAGController {
  /**
   * Query the RAG system
   */
  query = asyncHandler(async (req: Request, res: Response) => {
    const { query, sessionId } = req.body;
    const userId = req.user?._id;

    if (!query) {
      throw new ApiError(400, 'Query is required');
    }

    const result = await RAGService.query({
      query,
      userId: userId ? (userId as any).toString() : undefined,
      sessionId,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get all chat sessions for the current user
   */
  getSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const sessions = await ChatSession.find({ userId })
      .select('sessionId createdAt updatedAt messages')
      .sort({ updatedAt: -1 });

    const formattedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length,
      lastMessage: session.messages.length > 0 ? session.messages[session.messages.length - 1] : null
    }));

    res.status(200).json({
      success: true,
      data: formattedSessions,
    });
  });

  /**
   * Get details/messages of a specific session
   */
  getSessionById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { sessionId } = req.params;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const session = await ChatSession.findOne({ sessionId, userId });

    if (!session) {
      throw new ApiError(404, 'Chat session not found');
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  });

  /**
   * Clear (delete) a specific session
   */
  clearSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { sessionId } = req.params;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const session = await ChatSession.findOneAndDelete({ sessionId, userId });

    if (!session) {
      throw new ApiError(404, 'Chat session not found');
    }

    res.status(200).json({
      success: true,
      message: 'Chat session cleared successfully',
    });
  });

  /**
   * Generate diagram based on query
   */
  generateDiagram = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.body;

    if (!query) {
      throw new ApiError(400, 'Query is required');
    }

    const result = await RAGService.generateDiagram(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Index database content for RAG
   */
  indexContent = asyncHandler(async (_req: Request, res: Response) => {
    await RAGService.indexDatabaseContent();

    res.status(200).json({
      success: true,
      message: 'Database content indexed successfully',
    });
  });

  /**
   * Initialize vector store
   */
  initializeVectorStore = asyncHandler(async (_req: Request, res: Response) => {
    await RAGService.initializeVectorStore();

    res.status(200).json({
      success: true,
      message: 'Vector store initialized successfully',
    });
  });
}

export default new RAGController();
