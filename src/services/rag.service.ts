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
import ChatSession, { IChatMessage } from "../models/chatSession.model";

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
  userId?: string;
  sessionId?: string;
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
        const text = `Channel: ${channel.name}, Description: ${channel.description || "No description"
          }, Owner: ${channel.owner}, Members: ${channel.members.length
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
        const text = `Question: ${question.questionText}, Channel: ${question.channelId
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
        const text = `Attempt: User ${attempt.userId}, Channel ${attempt.channelId
          }, Score: ${attempt.score}%, Percentage: ${attempt.percentage
          }%, Submitted: ${attempt.submittedAt || attempt.startedAt
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

  /**
   * Generates a standalone search query from conversation history and user query
   */
  private async generateStandaloneQuery(
    query: string,
    history: IChatMessage[]
  ): Promise<string> {
    if (history.length === 0) {
      return query;
    }

    try {
      const conversationHistory = history
        .map((msg) => `${msg.role === "user" ? "User" : "Model"}: ${msg.content}`)
        .join("\n");

      const prompt = `
Given the conversation history and a follow-up query, generate a standalone search query that contains all necessary details from the history.
Do not answer the query, just return the standalone search query. Make sure it ends with a question mark.

Conversation History:
${conversationHistory}

Follow-up Query:
"${query}"

Standalone Search Query:
`;

      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const standalone = response.text?.trim() || query;
      logger.info(`🔄 Rewrote query "${query}" to standalone: "${standalone}"`);
      return standalone;
    } catch (error) {
      logger.error(`❌ Error generating standalone query: ${error}`);
      return query;
    }
  }

  /**
   * Re-ranks search results using Gemini LLM
   */
  private async reRankDocuments(
    query: string,
    documents: any[]
  ): Promise<any[]> {
    if (documents.length <= 1) {
      return documents;
    }

    try {
      const documentsList = documents
        .map((doc, idx) => `Document ID: ${idx}\nContent: [${doc.metadata?.type || 'unknown'}] ${doc.text}`)
        .join("\n\n");

      const prompt = `
You are an expert search re-ranker. Given the user's search query and a list of retrieved documents, evaluate the relevance of each document to the query.
Assign a relevance score between 0.0 (completely irrelevant) and 1.0 (highly relevant) to each document.

User Query:
"${query}"

Retrieved Documents:
${documentsList}

Return the results as a JSON array of objects, containing the Document ID and the relevance score, sorted in descending order of relevance. Do not return any other text or markdown formatting besides the valid JSON.
Example format:
[
  {"id": 0, "score": 0.95},
  {"id": 1, "score": 0.3}
]
`;

      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const rankedList = JSON.parse(cleanJson);

      const rankedDocs: any[] = [];
      for (const item of rankedList) {
        const index = parseInt(item.id, 10);
        if (index >= 0 && index < documents.length) {
          const doc = documents[index];
          rankedDocs.push({
            ...doc,
            reRankScore: item.score,
          });
        }
      }

      rankedDocs.sort((a, b) => b.reRankScore - a.reRankScore);
      return rankedDocs;
    } catch (error) {
      logger.error(`❌ Re-ranking error: ${error}`);
      return documents;
    }
  }

  async query(params: RAGQuery): Promise<RAGResponse> {
    try {
      let { query, userId, sessionId } = params;

      // UX improvement: auto-append question mark if missing
      let normalizedQuery = query.trim();
      if (!normalizedQuery.endsWith("?")) {
        normalizedQuery += "?";
      }

      let history: IChatMessage[] = [];
      let chatSession: any = null;
      let activeSessionId = sessionId;

      // Retrieve/create chat session if userId is provided
      if (userId) {
        if (activeSessionId) {
          chatSession = await ChatSession.findOne({ sessionId: activeSessionId, userId });
        }

        if (!chatSession) {
          activeSessionId = activeSessionId || new mongoose.Types.ObjectId().toString();
          chatSession = await ChatSession.create({
            userId,
            sessionId: activeSessionId,
            messages: []
          });
        }
        history = chatSession.messages || [];
      }

      // Generate standalone query if history exists
      const standaloneQuery = await this.generateStandaloneQuery(normalizedQuery, history);

      const queryEmbedding = await this.embeddings.embedQuery(standaloneQuery);

      const pipeline = [
        {
          $vectorSearch: {
            index: "default",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 30, // Retrieve larger candidate pool
            limit: 10,         // Retrieve more candidates for re-ranking
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

      // Apply re-ranking
      const reRankedResults = await this.reRankDocuments(standaloneQuery, searchResults);

      // Select top 3 after re-ranking
      const topResults = reRankedResults.slice(0, 3);

      // Generate response using history & top results
      const answer = await this.generateAnswerWithLLM(
        normalizedQuery,
        topResults,
        history
      );

      // Save messages to history
      if (chatSession) {
        chatSession.messages.push({
          role: 'user',
          content: normalizedQuery,
          timestamp: new Date()
        });
        chatSession.messages.push({
          role: 'model',
          content: answer,
          timestamp: new Date()
        });
        await chatSession.save();
      }

      return {
        answer,
        sources: topResults,
        metadata: {
          query: normalizedQuery,
          standaloneQuery,
          sessionId: activeSessionId,
          historyCount: history.length
        },
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
    searchResults: any[],
    history: IChatMessage[] = []
  ): Promise<string> {
    try {
      const context = searchResults
        .map((doc) => `[${doc.metadata?.type || 'unknown'}] ${doc.text}`)
        .join("\n\n");

      const conversationHistory = history
        .map((msg) => `${msg.role === "user" ? "User" : "Model"}: ${msg.content}`)
        .join("\n");

      const prompt = `
Based on the retrieved database information and the conversation history, answer the user's query.

Retrieved Database Information:
${context}

Conversation History (if any):
${conversationHistory}

User Query:
"${query}"

If the information is insufficient, politely say so. Provide a direct, natural, and helpful response.
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