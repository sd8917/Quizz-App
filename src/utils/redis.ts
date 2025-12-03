import dotenv from 'dotenv';
import { createClient, RedisClientType } from 'redis';

// Load environment variables (safe to call multiple times)
dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || process.env.REDIS_URL || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const REDIS_USERNAME = process.env.REDIS_USERNAME || undefined;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export const getRedisConnectionOptions = () => ({
    host: REDIS_HOST,
    port: REDIS_PORT,
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
});

// Export a redis client instance. Do not auto-connect on import to avoid
// unexpected side-effects; consumers can call `connectRedis()` when needed.
export const client: RedisClientType = createClient({
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    },
});

client.on('error', (err) => console.log('Redis Client Error', err));

export async function connectRedis(): Promise<void> {
    if (!client.isOpen) {
        await client.connect();
    }
}