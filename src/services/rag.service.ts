import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import mongoose from "mongoose";
import logger from '../utils/logger';
import { ApiError } from "../utils/apiError";
import User from "../models/user.model";
import { Channel } from "../models/channel.model";
import { Question } from "../models/quiz.model";
import { Attempt } from "../models/attempt.model";

export interface RAGQuery {
  query: string;
  filters?: RAGFilters;
}

export interface RAGFilters {
  username?: string;
  topic?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface RAGResponse {
  answer: string;
  sources: any[];
  metadata?: any;
}

export class RAGService {
  private genAI: GoogleGenerativeAI;
  private embeddings: GoogleGenerativeAIEmbeddings;
  private vectorStore: MongoDBAtlasVectorSearch | null = null;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new ApiError(500, 'GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  /**
   * Initialize vector store for semantic search
   */
  async initializeVectorStore(): Promise<void> {
    try {
      const collection = mongoose.connection.db!.collection("vector_store");

      this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
        collection,
        indexName: "default",
        textKey: "text",
        embeddingKey: "embedding",
      });

      logger.info("✅ RAG Vector Store initialized");
    } catch (error) {
      logger.error(`❌ Failed to initialize vector store: ${error}`);
      throw new ApiError(500, 'Failed to initialize vector store');
    }
  }

  /**
   * Index database content for RAG
   */
  async indexDatabaseContent(): Promise<void> {
    try {
      if (!this.vectorStore) {
        await this.initializeVectorStore();
      }

      // Index users
      const users = await User.find({ isActive: true }).select('username email roles createdAt lastActiveAt');
      for (const user of users) {
        const text = `User: ${user.username}, Email: ${user.email}, Roles: ${user.roles.join(', ')}, Created: ${user.createdAt}, Last Active: ${user.lastActiveAt}`;
        await this.vectorStore!.addDocuments([{
          pageContent: text,
          metadata: { type: 'user', id: user._id, username: user.username }
        }]);
      }

      // Index channels
      const channels = await Channel.find({ isArchived: false });
      for (const channel of channels) {
        const text = `Channel: ${channel.name}, Description: ${channel.description || 'No description'}, Owner: ${channel.owner}, Members: ${channel.members.length}, Public: ${channel.isPublic}`;
        await this.vectorStore!.addDocuments([{
          pageContent: text,
          metadata: { type: 'channel', id: channel._id, name: channel.name }
        }]);
      }

      // Index questions (quizzes)
      const questions = await Question.find({});
      for (const question of questions) {
        const text = `Question: ${question.questionText}, Channel: ${question.channelId}, Created by: ${question.createdBy}, Marks: ${question.marks}`;
        await this.vectorStore!.addDocuments([{
          pageContent: text,
          metadata: { type: 'question', id: question._id, channelId: question.channelId }
        }]);
      }

      // Index attempts
      const attempts = await Attempt.find({});
      for (const attempt of attempts) {
        const text = `Attempt: User ${attempt.userId}, Channel ${attempt.channelId}, Score: ${attempt.score}%, Percentage: ${attempt.percentage}%, Submitted: ${attempt.submittedAt || attempt.startedAt}`;
        await this.vectorStore!.addDocuments([{
          pageContent: text,
          metadata: { type: 'attempt', id: attempt._id, userId: attempt.userId, channelId: attempt.channelId }
        }]);
      }

      logger.info("✅ Database content indexed for RAG");
    } catch (error) {
      logger.error(`❌ Failed to index database content: ${error}`);
      throw new ApiError(500, 'Failed to index database content');
    }
  }

  /**
   * Query the RAG system
   */
  async query(params: RAGQuery): Promise<RAGResponse> {
    try {
      const { query } = params;

      // Validate query is a question
      if (!query.trim().endsWith('?')) {
        logger.error(`❌ QUERY :: ${query} must end with ?`);
        throw new ApiError(400, 'Query must be a question ending with "?"');
      }

      // Generate embedding for the query text
      const queryEmbedding = await this.embeddings.embedQuery(query);
      logger.info(`✅ Generated for ${query} embedding with ${queryEmbedding.length} dimensions`);

      // MongoDB aggregation pipeline for vector search
      const pipeline = [
        {
          $vectorSearch: {
            index: "default", // Your vector search index name
            path: "embedding", // The field containing the vector
            queryVector: queryEmbedding, // The 768-dimensional query vector
            numCandidates: 10, // Number of candidates to consider
            limit: 3, // Number of results to return
          }
        },
        {
          $project: {
            _id: 1,
            text: 1,
            type: 1,
            id: 1,
            channelId: 1,
            score: { $meta: "vectorSearchScore" } // Include similarity score
          }
        }
      ];

      // Execute the aggregation
      const collection = mongoose.connection.db!.collection("vector_store");
      const searchResults = await collection.aggregate(pipeline).toArray();

      logger.info(`✅Found ${searchResults.length} similar documents`);

      // Generate natural language answer using LLM
      const answer = await this.generateAnswerWithLLM(query, searchResults);

      return {
        answer,
        sources: searchResults,
        metadata: {
          query,
        }
      };

    } catch (error) {
      logger.error(`❌ RAG Query Error: ${error}`);
      throw new ApiError(500, `Failed to process query: ${error}`);
    }
  }


  /**
   * Generate a natural language answer using LLM
   */
  private async generateAnswerWithLLM(query: string, searchResults: any[]): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Prepare context from search results
      const context = searchResults.map(doc => `[${doc.type}] ${doc.text}`).join('\n\n');

      const prompt = `
Based on the following retrieved information, please provide a clear and concise answer to the user's query: "${query}"

Retrieved Information:
${context}

Please answer the query directly and naturally, as if you are responding to the user. If the information doesn't fully answer the query, say so politely.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error('❌ LLM generation error:', error);
      return `Sorry, I couldn't generate an answer due to an error: ${error.message}`;
    }
  }

  /**
   * Generate diagram data based on query
   */
  async generateDiagram(query: string): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      // Use AI to understand what diagram to generate
      const diagramPrompt = `
Based on this query: "${query}"

Generate diagram data in JSON format. The diagram should visualize data from our quiz application.
Possible diagram types: bar chart, pie chart, line chart, etc.

Return JSON with:
{
  "type": "bar|pie|line",
  "title": "Diagram Title",
  "data": [...],
  "labels": [...],
  "description": "..."
}

If no diagram makes sense, return {"type": "none"}
`;

      const result = await model.generateContent(diagramPrompt);
      const response = await result.response;
      const text = response.text();

      try {
        return JSON.parse(text);
      } catch {
        return { type: "none" };
      }

    } catch (error) {
      logger.error(`❌ Diagram generation error: ${error}`);
      return { type: "none" };
    }
  }

  /**
   * Parse natural language query to extract filters
   */
  parseQuery(query: string): Partial<RAGFilters> {
    const filters: Partial<RAGFilters> = {};

    // Extract username mentions
    const usernameMatch = query.match(/user(?:name)?\s+["']?(\w+)["']?/i);
    if (usernameMatch) {
      filters.username = usernameMatch[1];
    }

    // Extract topic mentions
    const topicMatch = query.match(/topic\s+["']?([^"']+)["']?/i);
    if (topicMatch) {
      filters.topic = topicMatch[1];
    }

    // Extract date ranges (basic implementation)
    const dateMatch = query.match(/from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      filters.dateRange = {
        start: new Date(dateMatch[1]),
        end: new Date(dateMatch[2]),
      };
    }

    return filters;
  }
}

export default new RAGService();
