import { Request, Response } from 'express';
import RAGService from '../services/rag.service';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

class RAGController {
  /**
   * Query the RAG system
   */
  query = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.body;

    if (!query) {
      throw new ApiError(400, 'Query is required');
    }

    const result = await RAGService.query({
      query,
    });

    res.status(200).json({
      success: true,
      data: result,
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
