import AWS from 'aws-sdk';

// Configure AWS SDK with timeout and retry settings
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  httpOptions: {
    timeout: 300000, // 5 minutes timeout
    connectTimeout: 60000, // 1 minute connect timeout
  },
  maxRetries: 3,
  retryDelayOptions: {
    base: 200, // Base delay in ms
  },
});

// Create S3 client with additional configuration
export const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4',
});

export const bucketName = process.env.S3_BUCKET_NAME;

// Validate configuration
export const validateS3Config = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!process.env.AWS_ACCESS_KEY_ID) {
    errors.push('AWS_ACCESS_KEY_ID is not set');
  }

  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    errors.push('AWS_SECRET_ACCESS_KEY is not set');
  }

  if (!process.env.S3_BUCKET_NAME) {
    errors.push('S3_BUCKET_NAME is not properly configured');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
