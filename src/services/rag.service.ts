// import { GoogleGenerativeAI } from "@google/generative-ai";//DEPRECATED : https://ai.google.dev/gemini-api/docs/changelog#01-14-2026
import { GoogleGenAI } from "@google/genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import mongoose from "mongoose";
import logger from '../utils/logger';
import { ApiError } from "../utils/apiError";
import User from "../models/user.model";
import { Channel } from "../models/channel.model";
import { Question } from "../models/quiz.model";
import { Attempt } from "../models/attempt.model";

/* =========================================================
   Custom Gemini Embedding Wrapper (for LangChain)
========================================================= */

class GeminiEmbeddings {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await this.ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

    if (!response.embeddings || response.embeddings.length === 0) {
      throw new Error("No embeddings returned from the API");
    }

    return (response as any).embeddings[0].values;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const response = await this.ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: texts,
    });

    if (!response.embeddings || response.embeddings.length === 0) {
      throw new Error("No embeddings returned from the API");
    }

    return response.embeddings.map((e: any) => e.values);
  }
}

/* =========================================================
   Interfaces
========================================================= */

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

/* =========================================================
   RAG Service
========================================================= */

export class RAGService {
  private genAI: GoogleGenAI;
  private embeddings: GeminiEmbeddings;
  private vectorStore: MongoDBAtlasVectorSearch | null = null;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new ApiError(500, 'GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.embeddings = new GeminiEmbeddings(
      process.env.GEMINI_API_KEY
    );
  }

  /**
   * Initialize vector store for semantic search
   */
  async initializeVectorStore(): Promise<void> {
    try {
      const collection = mongoose.connection.db!.collection("vector_store");

      this.vectorStore = new MongoDBAtlasVectorSearch(
        this.embeddings as any,
        {
          collection,
          indexName: "default",
          textKey: "text",
          embeddingKey: "embedding",
        }
      );

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
        const text = `User: ${user.username}, Email: ${user.email}, Roles: ${user.roles.join(
          ", "
        )}, Created: ${user.createdAt}, Last Active: ${user.lastActiveAt}`;

        await this.vectorStore!.addDocuments([
          {
            pageContent: text,
            metadata: {
              type: "user",
              id: user._id,
              username: user.username,
            },
          },
        ]);
      }

      // Index channels
      const channels = await Channel.find({ isArchived: false });
      for (const channel of channels) {
        const text = `Channel: ${channel.name}, Description: ${
          channel.description || "No description"
        }, Owner: ${channel.owner}, Members: ${
          channel.members.length
        }, Public: ${channel.isPublic}`;

        await this.vectorStore!.addDocuments([
          {
            pageContent: text,
            metadata: {
              type: "channel",
              id: channel._id,
              name: channel.name,
            },
          },
        ]);
      }

      /* -------- Questions -------- */
      const questions = await Question.find({});

      for (const question of questions) {
        const text = `Question: ${question.questionText}, Channel: ${
          question.channelId
        }, Created by: ${question.createdBy}, Marks: ${question.marks}`;

        await this.vectorStore!.addDocuments([
          {
            pageContent: text,
            metadata: {
              type: "question",
              id: question._id,
              channelId: question.channelId,
            },
          },
        ]);
      }

      /* -------- Attempts -------- */
      const attempts = await Attempt.find({});

      for (const attempt of attempts) {
        const text = `Attempt: User ${attempt.userId}, Channel ${
          attempt.channelId
        }, Score: ${attempt.score}%, Percentage: ${
          attempt.percentage
        }%, Submitted: ${
          attempt.submittedAt || attempt.startedAt
        }`;

        await this.vectorStore!.addDocuments([
          {
            pageContent: text,
            metadata: {
              type: "attempt",
              id: attempt._id,
              userId: attempt.userId,
              channelId: attempt.channelId,
            },
          },
        ]);
      }

      logger.info("✅ Database content indexed for RAG");
    } catch (error) {
      logger.error(`❌ Failed to index database content: ${error}`);
      throw new ApiError(500, "Failed to index database content");
    }
  }

  /* =========================================================
     Query RAG
  ========================================================= */

  async query(params: RAGQuery): Promise<RAGResponse> {
    try {
      const { query } = params;

      if (!query.trim().endsWith("?")) {
        throw new ApiError(
          400,
          'Query must be a question ending with "?"'
        );
      }

      const queryEmbedding = await this.embeddings.embedQuery(query);

      const pipeline = [
        {
          $vectorSearch: {
            index: "default",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 10,
            limit: 3,
          },
        },
        {
          $project: {
            _id: 1,
            text: 1,
            metadata: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ];

      const collection =
        mongoose.connection.db!.collection("vector_store");

      const searchResults = await collection
        .aggregate(pipeline)
        .toArray();

      const answer = await this.generateAnswerWithLLM(
        query,
        searchResults
      );

      return {
        answer,
        sources: searchResults,
        metadata: { query },
      };
    } catch (error: any) {
      logger.error(`❌ RAG Query Error: ${error}`);
      throw new ApiError(
        500,
        `Failed to process query: ${error.message}`
      );
    }
  }

  /* =========================================================
     LLM Answer Generation (NEW SDK)
  ========================================================= */

  private async generateAnswerWithLLM(
    query: string,
    searchResults: any[]
  ): Promise<string> {
    try {
      const context = searchResults
        .map((doc) => `[${doc.metadata?.type}] ${doc.text}`)
        .join("\n\n");

      const prompt = `
Based on the following retrieved information, answer the user's query.

User Query:
"${query}"

Retrieved Information:
${context}

If the information is insufficient, politely say so.
`;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return (result as any).text;
    } catch (error: any) {
      logger.error("❌ LLM generation error:", error);
      return `Sorry, I couldn't generate an answer: ${error.message}`;
    }
  }

  /* =========================================================
     Diagram Generation
  ========================================================= */

  async generateDiagram(query: string): Promise<any> {
    try {
      const diagramPrompt = `
Based on this query: "${query}"

Generate diagram data in JSON format.

Return:
{
  "type": "bar|pie|line|none",
  "title": "Diagram Title",
  "data": [],
  "labels": [],
  "description": ""
}
`;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: diagramPrompt,
      });

      try {
        return JSON.parse((result as any).text);
      } catch {
        return { type: "none" };
      }
    } catch (error) {
      logger.error(`❌ Diagram generation error: ${error}`);
      return { type: "none" };
    }
  }
}

export default new RAGService();