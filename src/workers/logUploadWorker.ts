import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import { s3 } from '../config/s3';
import path from 'path';
import AWS from 'aws-sdk';
import logger from '../utils/logger'

interface WorkerData {
  filePath: string;
  bucketName: string;
}

interface MessageData {
  success: boolean;
  error?: string;
  data?: string;
}

const { filePath, bucketName }: WorkerData = workerData;

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

async function uploadFileInChunks(filePath: string, bucketName: string): Promise<string> {
  const fileName = path.basename(filePath);
  const key = `${new Date().toISOString().split('T')[0]}/${fileName}`;

  const fileStats = fs.statSync(filePath);
  const fileSize = fileStats.size;

  if (fileSize <= CHUNK_SIZE) {
    // Single part upload for small files
    const fileContent = fs.readFileSync(filePath);
    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: 'text/plain',
    };

    return new Promise((resolve, reject) => {
      logger.info(`🚀 [Worker] Starting single-part upload for ${filePath} to bucket ${bucketName}`);
      s3.upload(params, (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
        if (err) {
          logger.error(`❌ [Worker] Single-part upload failed for ${filePath}:`, err);
          reject(err);
        } else {
          logger.info(`🚀 [Worker] Single-part upload completed for ${filePath}`);
          resolve(data.Location);
        }
      });
    });
  } else {
    // Multipart upload for large files
    const createParams: AWS.S3.CreateMultipartUploadRequest = {
      Bucket: bucketName,
      Key: key,
      ContentType: 'text/plain',
    };

    logger.info(`🚀 [Worker] Creating multipart upload for ${filePath}`)
    const uploadId = await new Promise<string>((resolve, reject) => {
      s3.createMultipartUpload(createParams, (err, data) => {
        if (err) {
          logger.error(`❌ [Worker] Failed to create multipart upload ${err}`)
          reject(err);
        } else {
          logger.info(`🚀 [Worker] Created multipart upload with ID: ${data.UploadId}`)
          resolve(data.UploadId!);
        }
      });
    });

    const parts: AWS.S3.CompletedPart[] = [];
    const totalParts = Math.ceil(fileSize / CHUNK_SIZE);

    logger.info(`🚀 [Worker] Starting multipart upload with ${totalParts} parts`);

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = fs.readFileSync(filePath).slice(start, end);

      logger.info(`🚀 [Worker] Uploading part ${partNumber}/${totalParts} (${chunk.length} bytes)`);

      const uploadParams: AWS.S3.UploadPartRequest = {
        Bucket: bucketName,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: chunk,
      };

      const etag = await new Promise<string>((resolve, reject) => {
        s3.uploadPart(uploadParams, (err, data) => {
          if (err) {
            logger.error(`❌ [Worker] Failed to upload part ${partNumber}:`, err);
            reject(err);
          } else {
            logger.info(`[Worker] Successfully uploaded part ${partNumber}`);
            resolve(data.ETag!);
          }
        });
      });

      parts.push({
        ETag: etag,
        PartNumber: partNumber,
      });
    }
    logger.info(`✅ [Worker] All parts uploaded, completing multipart upload`);

    const completeParams: AWS.S3.CompleteMultipartUploadRequest = {
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    };

    return new Promise((resolve, reject) => {
      console.log(`✅ [Worker] Completing multipart upload for ${filePath}`);
      s3.completeMultipartUpload(completeParams, (err, data) => {
        if (err) {
          logger.error(`❌ [Worker] Failed to complete multipart upload:`, err);
          reject(err);
        } else {
          logger.info(`✅ ====  [Worker] Multipart upload completed successfully === `);
          resolve(data.Location!);
        }
      });
    });
  }
}

(async () => {
  try {
    // Check if file exists before attempting upload
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error(`File is empty: ${filePath}`);
    }

    logger.info(`🚀 [Worker] Starting upload for ${filePath} (${stats.size} bytes)`);
    const location = await uploadFileInChunks(filePath, bucketName);
    const message: MessageData = { success: true, data: location };
    logger.info(`✅ === [Worker] Successfully uploaded === ${filePath} to ${location}`);
    // Send message to main thread after upload is done.
    parentPort?.postMessage(message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [Worker] Failed to upload ${filePath}:`, errorMessage);
    const message: MessageData = { success: false, error: errorMessage };
    parentPort?.postMessage(message);
  }
})();
