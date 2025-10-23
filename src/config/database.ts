import mongoose from 'mongoose';

// Connection function
export const connectDB = async (): Promise<void> => {
    try {
        const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-app';
        const conn = await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to DB');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`Mongoose connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose connection disconnected');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Mongoose connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error}`);
        process.exit(1);
    }
};