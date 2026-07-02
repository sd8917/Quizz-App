import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import RAGService from '../src/services/rag.service';
import User from '../src/models/user.model';
import ChatSession from '../src/models/chatSession.model';

async function main() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-app';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Create a mock user or find one
    let testUser = await User.findOne({ email: 'admin_test_rag@example.com' });
    if (!testUser) {
      testUser = await User.create({
        username: 'admin_test_rag',
        email: 'admin_test_rag@example.com',
        password: 'secure_password_123',
        roles: ['admin'],
        isActive: true
      });
      console.log('Created test user:', testUser.username);
    } else {
      console.log('Using existing test user:', testUser.username);
    }

    const userId = (testUser._id as any).toString();
    const sessionId = 'session_test_123';

    // Clear any previous chat sessions
    await ChatSession.deleteMany({ sessionId, userId });
    console.log('Cleared previous chat session history.');

    // Query 1: Initial query
    const q1 = "Who is the user admin_test_rag?";
    console.log(`\n--- Send Query 1: "${q1}" ---`);
    const res1 = await RAGService.query({
      query: q1,
      userId,
      sessionId
    });

    console.log('Response 1 Answer:');
    console.log(res1.answer);
    console.log('Response 1 Metadata:', JSON.stringify(res1.metadata, null, 2));
    console.log('Sources returned count:', res1.sources.length);

    // Query 2: Follow-up query (should be condensed using context)
    const q2 = "What are their roles?";
    console.log(`\n--- Send Query 2 (Follow-up): "${q2}" ---`);
    const res2 = await RAGService.query({
      query: q2,
      userId,
      sessionId
    });

    console.log('Response 2 Answer:');
    console.log(res2.answer);
    console.log('Response 2 Metadata:', JSON.stringify(res2.metadata, null, 2));

    // Retrieve chat session history from DB to verify it was recorded
    const savedSession = await ChatSession.findOne({ sessionId, userId });
    console.log('\n--- Saved Chat Session in Database ---');
    console.log(`Session ID: ${savedSession?.sessionId}`);
    console.log(`Message Count: ${savedSession?.messages.length}`);
    savedSession?.messages.forEach((msg, idx) => {
      console.log(`[${idx}] ${msg.role}: ${msg.content.substring(0, 100)}...`);
    });

    // Cleanup test user
    await User.deleteOne({ _id: testUser._id });
    await ChatSession.deleteMany({ sessionId, userId });
    console.log('Cleanup completed successfully.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

main();
