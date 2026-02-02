/**
 * Script to run when you you can update vector store
 * Used to seed initial vector db store with LLM embeddings.
 * db name : vector-store
 */
const mongoose = require('mongoose');
require('dotenv').config();

async function seedMongodbVectorDBWithRAG() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-app');
    console.log('✅ Connected to MongoDB');

    // Import RAG service
    const RAGService = require('./dist/services/rag.service').default;

    // Initialize vector store
    console.log('✅Initializing vector store...');
    await RAGService.initializeVectorStore();

    // Index content
    console.log('✅Indexing database content...');
    await RAGService.indexDatabaseContent();

  
    console.log('\n✅ RAG testing completed');

  } catch (error) {
    console.error('❌ RAG test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedMongodbVectorDBWithRAG();
