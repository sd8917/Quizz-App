import mongoose from 'mongoose';
import logger from '../utils/logger';

// Connection function
export const connectDB = async (): Promise<void> => {
    try {
        const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-app';
        const conn = await mongoose.connect(connectionString, {
            // serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            readPreference: 'secondaryPreferred'
        });

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('connected', () => {
            logger.info('✅ Mongoose connected to DB');
        });

        mongoose.connection.on('error', (err) => {
            logger.error(`❌ Mongoose connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            logger.error('❌ Mongoose connection disconnected');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.error('❌ Mongoose connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        logger.error(`❌ Error connecting to MongoDB: ${error}`);
        process.exit(1);
    }
};