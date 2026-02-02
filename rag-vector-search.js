/**
 * Testing file to understand r&d for RAG in quiz app MERN STACK
 * Learning docs.
 */

const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-app');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Vector search query for RAG system
async function performVectorSearch(queryText, limit = 3) {
  try {
    // First, generate embedding for the query text
    const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Generate embedding for the search query
    const queryEmbedding = await embeddings.embedQuery(queryText);
    console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);

    // MongoDB aggregation pipeline for vector search
    const pipeline = [
      {
        $vectorSearch: {
          index: "default", // Your vector search index name
          path: "embedding", // The field containing the vector
          queryVector: queryEmbedding, // The 768-dimensional query vector
          numCandidates: 10, // Number of candidates to consider
          limit: limit, // Number of results to return
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
    const collection = mongoose.connection.db.collection("vector_store");
    const results = await collection.aggregate(pipeline).toArray();

    console.log(`Found ${results.length} similar documents`);
    return results;

  } catch (error) {
    console.error('❌ Vector search error:', error);
    throw error;
  }
}

// Example usage
async function exampleSearch() {
  await connectDB();

  const searchQueries = [
    "How many users are there?",
    "What channels exist?",
    "Show me quiz information"
  ];

  for (const query of searchQueries) {
    console.log(`\n🔍 Searching for: "${query}"`);
    try {
      const results = await performVectorSearch(query, 3);
      const answer = await generateAnswerWithLLM(query, results);
      console.log(`🤖 Answer: ${answer}`);
    } catch (error) {
      console.error(`❌ Search failed: ${error.message}`);
    }
  }

  await mongoose.disconnect();
}

// Function to generate a natural language answer using LLM
async function generateAnswerWithLLM(query, searchResults) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model:"gemini-2.5-flash" });

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
    console.error('❌ LLM generation error:', error);
    return `Sorry, I couldn't generate an answer due to an error: ${error.message}`;
  }
}

// Export functions
module.exports = { performVectorSearch, generateAnswerWithLLM, exampleSearch };

// Run example if called directly
if (require.main === module) {
  exampleSearch();
}
