import { parentPort } from 'worker_threads';
import logger from '../utils/logger';

// Import the auto-recovery service
import { performAutoRecovery } from '../services/autoRecovery.service';

interface WorkerMessage {
  success: boolean;
  message?: string;
  approvalId?: string;
  errorDetected?: string;
  proposedFix?: string;
  apiEndpoint?: string;
  timestamp?: string;
}

// Check if this is running as a worker (has parentPort)
const isWorker = !!parentPort;

// If running as a worker, listen for messages from main thread
if (isWorker) {
  parentPort!.on('message', async (message: { action: string }) => {
    if (message.action === 'trigger') {
      await runAutoRecovery();
    }
  });
}

/**
 * Main function to run auto-recovery check
 * This can be called from worker or directly
 */
async function runAutoRecovery(): Promise<void> {
  const startTime = Date.now();
  logger.info('[AutoRecovery Worker] Starting auto-recovery check...');

  try {
    const result = await performAutoRecovery();

    if (result.success) {
      // No errors detected, log and continue
      logger.info(`[AutoRecovery Worker] ${result.message}`);
      
      // Notify parent if running as worker
      if (parentPort) {
        parentPort.postMessage({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        } as WorkerMessage);
      }
    } else {
      // Error detected, approval request created
      const approvalId = result.approvalId;
      const apiEndpoint = `/api/v1/auto-recovery/approve/${approvalId}`;
      
      logger.warn(`[AutoRecovery Worker] Error detected! Approval request created: ${approvalId}`);
      logger.warn(`[AutoRecovery Worker] API Endpoint for approval: ${apiEndpoint}`);
      logger.warn(`[AutoRecovery Worker] Time taken: ${Date.now() - startTime}ms`);

      // Notify parent if running as worker with approval details
      if (parentPort) {
        parentPort.postMessage({
          success: false,
          message: result.message,
          approvalId,
          apiEndpoint,
          timestamp: new Date().toISOString(),
        } as WorkerMessage);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[AutoRecovery Worker] Error during auto-recovery check:`, error);

    if (parentPort) {
      parentPort.postMessage({
        success: false,
        message: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      } as WorkerMessage);
    }
  }
}

/**
 * Start the auto-recovery worker with interval
 * This function runs the check every day (24 hours)
 * Default: 1 day = 24 * 60 * 60 * 1000 = 86400000 ms
 */
export function startAutoRecoveryWorker(intervalMs: number = 86400000): void {
  logger.info(`[AutoRecovery Worker] Starting worker with ${intervalMs}ms interval (${intervalMs / 86400000} day(s))`);

  // Run immediately on start
  runAutoRecovery();

  // Then run every day (or custom interval)
  setInterval(() => {
    runAutoRecovery();
  }, intervalMs);
}

// If this file is executed directly (not imported as a module), start the worker
// This is useful for testing
if (require.main === module) {
  startAutoRecoveryWorker();
}

export { runAutoRecovery };
