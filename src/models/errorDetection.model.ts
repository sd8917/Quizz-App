import mongoose, { Schema, Document } from 'mongoose';

export interface IErrorDetection extends Document {
  errorType: string;
  errorMessage: string;
  detectedAt: Date;
  status: 'detected' | 'resolved' | 'ignored';
  proposedFix?: {
    type: string;
    description: string;
    confidence: string;
    appliedAt?: Date;
  };
  approvalId?: string;
  service: string;
  rawError?: string;
}

const errorDetectionSchema = new Schema<IErrorDetection>(
  {
    errorType: { 
      type: String, 
      required: true,
      enum: [
        'MODEL_DEPRECATED',
        'MODEL_UNAVAILABLE', 
        'API_KEY_INVALID',
        'QUOTA_EXCEEDED',
        'RATE_LIMIT',
        'NETWORK_ERROR',
        'SERVICE_UNAVAILABLE',
        'AUTHENTICATION_ERROR',
        'AI_SERVICE_ERROR',
        'MONGOOSE_DISCONNECTED',
        'UNKNOWN_ERROR'
      ]
    },
    errorMessage: { type: String, required: true },
    detectedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['detected', 'resolved', 'ignored'],
      default: 'detected'
    },
    proposedFix: {
      type: {
        type: String,
        enum: ['model_update', 'api_key_rotation', 'quota_adjustment', 'rate_limit_adjustment', 'configuration_update', 'none']
      },
      description: String,
      confidence: String,
      appliedAt: Date
    },
    approvalId: String,
    service: { type: String, default: 'triviaverse-api' },
    rawError: String
  },
  { timestamps: true }
);

// Index for querying by date and status
errorDetectionSchema.index({ detectedAt: -1 });
errorDetectionSchema.index({ status: 1 });
errorDetectionSchema.index({ errorType: 1 });

export default mongoose.model<IErrorDetection>('ErrorDetection', errorDetectionSchema);

