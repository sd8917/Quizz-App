import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { sendSupportEmail } from '../utils/mailer';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ErrorDetection from '../models/errorDetection.model';

// In-memory store for approval requests (in production, use a database)
interface ApprovalRequest {
  id: string;
  type: 'auto_recovery';
  errorType: string;
  errorDetected: string;
  errorDetails: ErrorDetails;
  proposedFix: ProposedFix;
  filePath: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_applied';
  createdAt: Date;
  expiresAt: Date;
  autoApplied?: boolean;
}

interface ErrorDetails {
  message: string;
  statusCode?: number;
  modelName?: string;
  apiEndpoint?: string;
  rawError?: string;
  stack?: string;
}

interface ProposedFix {
  type: 'model_update' | 'api_key_rotation' | 'quota_adjustment' | 'rate_limit_adjustment' | 'configuration_update' | 'none';
  description: string;
  oldValue?: string;
  newValue?: string;
  confidence: 'high' | 'medium' | 'low';
  affectedFiles: string[];
}

interface DetectedError {
  errorType: string;
  errorDetails: ErrorDetails;
  timestamp: string;
}

// Error log path
const ERROR_LOG_PATH = path.join(process.cwd(), 'logs', 'error.log');
const AI_SERVICE_PATH = path.join(process.cwd(), 'src', 'services', 'ai.service.ts');

// Known working fallback models (updated list for 2025 - using v1 API)
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-001'
];

// Current working model to use for fix determination (v1 API)
const RECOVERY_MODEL = 'gemini-2.5-flash';

const approvalRequests = new Map<string, ApprovalRequest>();

// Clean old approval requests (older than 24 hours)
function cleanupOldRequests() {
  const now = new Date();
  for (const [id, request] of approvalRequests.entries()) {
    if (request.expiresAt < now) {
      approvalRequests.delete(id);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldRequests, 60 * 60 * 1000);

/**
 * Generate a unique ID for approval requests
 */
function generateApprovalId(): string {
  return `AR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse JSON log lines from error.log
 */
function parseErrorLog(): { lines: string[]; parsedErrors: any[] } {
  try {
    if (!fs.existsSync(ERROR_LOG_PATH)) {
      return { lines: [], parsedErrors: [] };
    }
    const content = fs.readFileSync(ERROR_LOG_PATH, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    // Parse JSON log entries
    const parsedErrors: any[] = [];
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.level === 'error') {
          parsedErrors.push(parsed);
        }
      } catch {
        // Not JSON, skip
      }
    }
    
    return { lines, parsedErrors };
  } catch (error) {
    logger.error('[AutoRecovery] Failed to read error log:', error);
    return { lines: [], parsedErrors: [] };
  }
}

/**
 * Classify the error type based on error message
 */
function classifyError(errorMessage: string, rawError?: string): string {
  const combinedText = (errorMessage + ' ' + (rawError || '')).toLowerCase();
  
  // Model not found / deprecated
  if (combinedText.includes('not found') && combinedText.includes('model')) {
    return 'MODEL_DEPRECATED';
  }
  
  // Model not available to new users
  if (combinedText.includes('no longer available to new users') || 
      combinedText.includes('not available') ||
      combinedText.includes('is not supported')) {
    return 'MODEL_UNAVAILABLE';
  }
  
  // API Key issues
  if (combinedText.includes('api key') && 
      (combinedText.includes('invalid') || combinedText.includes('unauthorized') || combinedText.includes('forbidden'))) {
    return 'API_KEY_INVALID';
  }
  
  // Quota exceeded
  if (combinedText.includes('quota') || combinedText.includes('limit exceeded') || combinedText.includes('resource exhausted')) {
    return 'QUOTA_EXCEEDED';
  }
  
  // Rate limit
  if (combinedText.includes('rate limit') || combinedText.includes('too many requests') || combinedText.includes('429')) {
    return 'RATE_LIMIT';
  }
  
  // Network errors
  if (combinedText.includes('network') || combinedText.includes('fetch') || combinedText.includes('timeout') || combinedText.includes('econnrefused')) {
    return 'NETWORK_ERROR';
  }
  
  // Service unavailable
  if (combinedText.includes('503') || combinedText.includes('service unavailable') || combinedText.includes('backend error')) {
    return 'SERVICE_UNAVAILABLE';
  }
  
  // Authentication issues
  if (combinedText.includes('authentication') || combinedText.includes('401') || combinedText.includes('unauthorized')) {
    return 'AUTHENTICATION_ERROR';
  }
  
  // Mongoose disconnection
  if (combinedText.includes('mongoose') && (combinedText.includes('disconnected') || combinedText.includes('connection'))) {
    return 'MONGOOSE_DISCONNECTED';
  }
  
  // Generic AI error
  if (combinedText.includes('aierror') || combinedText.includes('google generativeai')) {
    return 'AI_SERVICE_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
}

/**
 * Save detected error to database
 */
async function saveErrorToDatabase(
  errorType: string, 
  errorMessage: string, 
  proposedFix: ProposedFix,
  approvalId?: string
): Promise<void> {
  try {
    const errorDetection = new ErrorDetection({
      errorType,
      errorMessage,
      detectedAt: new Date(),
      status: 'detected',
      proposedFix: {
        type: proposedFix.type,
        description: proposedFix.description,
        confidence: proposedFix.confidence
      },
      approvalId,
      service: 'triviaverse-api',
      rawError: errorMessage
    });
    
    await errorDetection.save();
    logger.info(`[AutoRecovery] Error saved to database: ${errorType}`);
  } catch (error) {
    logger.error('[AutoRecovery] Failed to save error to database:', error);
  }
}

/**
 * Send daily error summary email to admin
 */
async function sendDailyErrorSummaryEmail(errors: any[]): Promise<void> {
  if (errors.length === 0) return;
  
  const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
  const errorListHtml = errors.map((err, index) => `
    <li style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
      <strong>${index + 1}. ${err.errorType}</strong><br/>
      <small>${new Date(err.detectedAt).toLocaleString()}</small><br/>
      <span>${err.errorMessage.substring(0, 150)}...</span><br/>
      <em>Suggested Fix: ${err.proposedFix?.description || 'None'}</em>
    </li>
  `).join('');

  const html = `
    <h2>Daily Error Detection Report</h2>
    <p>A total of <strong>${errors.length}</strong> error(s) were detected in your Quizz-App.</p>
    
    <h3>Error Details:</h3>
    <ul style="list-style: none; padding: 0;">
      ${errorListHtml}
    </ul>
    
    <p style="margin-top: 20px;">
      <a href="${websiteUrl}/admin/errors" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View All Errors</a>
    </p>
    
    <p><small>This is an automated daily report from the Auto-Recovery System.</small></p>
  `;

  try {
    await sendSupportEmail(
      'Auto-Recovery System',
      process.env.EMAIL_USER || 'system@triviaverse.com',
      `Daily Error Report - ${errors.length} Error(s) Detected`,
      `Daily Error Report\n\nTotal Errors: ${errors.length}\n\nPlease check the admin dashboard for details.\n\nWebsite: ${websiteUrl}/admin/errors`
    );
    logger.info('[AutoRecovery] Daily error summary email sent');
  } catch (error) {
    logger.error('[AutoRecovery] Failed to send daily summary email:', error);
  }
}

/**
 * Extract model name from error message
 */
function extractModelFromError(errorMessage: string): string | null {
  // Match patterns like "models/gemini-1.0-pro" or "gemini-1.0-pro"
  const patterns = [
    /models\/([a-zA-Z0-9.-]+)/,
    /model['"]?\s*[:=]\s*['"]?([a-zA-Z0-9.-]+)/,
    /\b(gemini-[0-9.]+-[a-z]+)\b/i,
  ];
  
  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Detect AI service errors from the log with comprehensive error extraction
 */
function detectAIError(logLines: string[], parsedErrors: any[]): DetectedError | null {
  // First, check parsed JSON errors
  console.log('==## detect error ### ', parsedErrors.length);
  for (let i = parsedErrors.length - 1; i >= 0; i--) {
    const error = parsedErrors[i];
    const message = error.message || '';
    
    // Check for AIService errors
    if (error.level == "error") {
      
      const errorType = classifyError(message, error.stack);
      const modelName = extractModelFromError(message);
      
      logger.info(`[AutoRecovery] Detected AI error: ${errorType}, Model: ${modelName}`);
      
      return {
        errorType,
        errorDetails: {
          message,
          statusCode: error.status || extractStatusCode(message),
          modelName: modelName || undefined,
          apiEndpoint: extractApiEndpoint(message),
          rawError: error.stack || message,
          stack: error.stack
        },
        timestamp: error.timestamp
      };
    }
    
    // Check for AutoRecovery errors (recursive issue)
    if (message.includes('[AutoRecovery]') && message.includes('failed')) {
      const errorType = classifyError(message, error.stack);
      const modelName = extractModelFromError(message);
      
      logger.info(`[AutoRecovery] Detected AutoRecovery error: ${errorType}, Model: ${modelName}`);
      
      return {
        errorType,
        errorDetails: {
          message,
          statusCode: error.status || extractStatusCode(message),
          modelName: modelName || undefined,
          apiEndpoint: extractApiEndpoint(message),
          rawError: error.stack || message,
          stack: error.stack
        },
        timestamp: error.timestamp
      };
    }
  }
  
  // Fallback to line-based detection for non-JSON errors
  for (let i = logLines.length - 1; i >= 0; i--) {
    const line = logLines[i];
    if (line.includes('[AIService]') && (line.includes('Error') || line.includes('error'))) {
      const errorType = classifyError(line);
      const modelName = extractModelFromError(line);
      
      return {
        errorType,
        errorDetails: {
          message: line,
          modelName: modelName || undefined,
          apiEndpoint: extractApiEndpoint(line),
          rawError: line
        },
        timestamp: new Date().toISOString()
      };
    }
  }
  
  return null;
}

/**
 * Extract status code from error message
 */
function extractStatusCode(message: string): number | undefined {
  const match = message.match(/\b([45]\d{2})\b/);
  return match ? parseInt(match[1]) : undefined;
}

/**
 * Extract API endpoint from error message
 */
function extractApiEndpoint(message: string): string | undefined {
  const match = message.match(/https:\/\/[^\s]+/);
  return match ? match[0] : undefined;
}

/**
 * Determine the appropriate fix based on error type
 */
function determineFix(errorType: string, errorDetails: ErrorDetails): ProposedFix {
  const modelName = errorDetails.modelName;
  
  switch (errorType) {
    case 'MODEL_DEPRECATED':
    case 'MODEL_UNAVAILABLE':
    case 'AI_SERVICE_ERROR': {
      // Use the latest stable recovery model (gemini-2.5-flash)
      const newModel = RECOVERY_MODEL;
      
      return {
        type: 'model_update',
        description: `Update MODEL_NAME from "${modelName || 'unknown'}" to "${newModel}" in ai.service.ts`,
        oldValue: modelName,
        newValue: newModel,
        confidence: 'high',
        affectedFiles: [AI_SERVICE_PATH]
      };
    }
    
    case 'API_KEY_INVALID':
      return {
        type: 'api_key_rotation',
        description: 'The GEMINI_API_KEY appears to be invalid. Please update the API key in environment variables.',
        confidence: 'high',
        affectedFiles: ['.env']
      };
    
    case 'QUOTA_EXCEEDED':
      return {
        type: 'quota_adjustment',
        description: 'API quota has been exceeded. Consider upgrading the Google Cloud plan or implementing request throttling.',
        confidence: 'high',
        affectedFiles: []
      };
    
    case 'RATE_LIMIT':
      return {
        type: 'rate_limit_adjustment',
        description: 'Rate limit hit. Implement exponential backoff and reduce request frequency.',
        confidence: 'high',
        affectedFiles: [AI_SERVICE_PATH]
      };
    
    case 'NETWORK_ERROR':
      return {
        type: 'configuration_update',
        description: 'Network connectivity issues detected. Check firewall settings and network configuration.',
        confidence: 'medium',
        affectedFiles: []
      };
    
    case 'SERVICE_UNAVAILABLE':
      return {
        type: 'configuration_update',
        description: 'Google AI service temporarily unavailable. Consider adding retry logic with exponential backoff.',
        confidence: 'medium',
        affectedFiles: [AI_SERVICE_PATH]
      };
    
    case 'AUTHENTICATION_ERROR':
      return {
        type: 'api_key_rotation',
        description: 'Authentication failed. Verify the API key has correct permissions and is not expired.',
        confidence: 'high',
        affectedFiles: ['.env']
      };
    
    default:
      return {
        type: 'none',
        description: 'Unable to determine automatic fix for this error. Manual investigation required.',
        confidence: 'low',
        affectedFiles: []
      };
  }
}

/**
 * Use AI to get additional fix suggestions (with fallback model)
 */
async function determineFixWithAI(errorMessage: string): Promise<string> {
  try {
    // Use a known working model for determining fixes
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    const prompt = `
You are a code fixing assistant. Analyze this error message from a Google Generative AI API:

Error: ${errorMessage}

The error indicates an issue with the AI service.
What is the correct model name that should be used? 
Provide ONLY the model name (e.g., "gemini-1.5-flash" or "gemini-2.0-flash").
Do not include any explanation or additional text.
`;

    const model = genAI.getGenerativeModel({ model: RECOVERY_MODEL });
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    // Validate it's a reasonable model name
    if (response.includes('gemini')) {
      logger.info(`[AutoRecovery] AI suggested model: ${response}`);
      return response;
    }
    
    return RECOVERY_MODEL;
  } catch (error) {
    logger.error('[AutoRecovery] AI fix determination failed:', error);
    return RECOVERY_MODEL;
  }
}

/**
 * Apply the fix to the AI service file
 */
function applyFix(filePath: string, newModelName: string): boolean {
  try {
    if (!fs.existsSync(filePath)) {
      logger.error(`[AutoRecovery] File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if MODEL_NAME constant exists
    const modelNameRegex = /const MODEL_NAME = "([^"]+)"/;
    const match = content.match(modelNameRegex);
    
    if (!match) {
      logger.error('[AutoRecovery] Could not find MODEL_NAME in ai.service.ts');
      return false;
    }

    const oldModelName = match[1];
    const newContent = content.replace(
      `const MODEL_NAME = "${oldModelName}"`,
      `const MODEL_NAME = "${newModelName}"`
    );

    fs.writeFileSync(filePath, newContent, 'utf-8');
    logger.info(`[AutoRecovery] Successfully updated MODEL_NAME from "${oldModelName}" to "${newModelName}"`);
    return true;
  } catch (error) {
    logger.error('[AutoRecovery] Failed to apply fix:', error);
    return false;
  }
}

/**
 * Apply the fix to .env file
 */
function applyEnvFix(newValue: string, key: string): boolean {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      logger.error(`[AutoRecovery] .env file not found`);
      return false;
    }

    let content = fs.readFileSync(envPath, 'utf-8');
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (content.match(regex)) {
      content = content.replace(regex, `${key}=${newValue}`);
    } else {
      content += `\n${key}=${newValue}`;
    }

    fs.writeFileSync(envPath, content, 'utf-8');
    logger.info(`[AutoRecovery] Successfully updated ${key} in .env`);
    return true;
  } catch (error) {
    logger.error('[AutoRecovery] Failed to apply .env fix:', error);
    return false;
  }
}

/**
 * Send approval request email to admin
 */
async function sendApprovalRequestEmail(request: ApprovalRequest): Promise<void> {
  const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
  const approvalUrl = `${websiteUrl}/api/v1/auto-recovery/approve/${request.id}`;
  const rejectUrl = `${websiteUrl}/api/v1/auto-recovery/reject/${request.id}`;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const html = `
    <h2>Auto-Recovery Approval Request</h2>
    <p>An error was detected in the AI service that requires your approval to fix.</p>
    
    <h3>Error Type:</h3>
    <p><strong>${request.errorType}</strong></p>
    
    <h3>Error Details:</h3>
    <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${request.errorDetected}</pre>
    
    <h3>Proposed Fix:</h3>
    <p>${request.proposedFix.description}</p>
    <p><strong>Confidence:</strong> ${request.proposedFix.confidence}</p>
    <p><strong>Affected Files:</strong> ${request.proposedFix.affectedFiles.join(', ') || 'None'}</p>
    
    <div style="margin: 20px 0;">
      <a href="${approvalUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Approve</a>
      <a href="${rejectUrl}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reject</a>
    </div>
    
    <p><small>This request will expire in 24 hours.</small></p>
  `;

  try {
    await sendSupportEmail(
      'Auto-Recovery System',
      process.env.EMAIL_USER || 'system@triviaverse.com',
      `Auto-Recovery Approval Request #${request.id}`,
      `Error detected in AI service. Please review and approve the fix.\n\nError Type: ${request.errorType}\n\nError: ${request.errorDetected}\n\nProposed Fix: ${request.proposedFix.description}\n\nConfidence: ${request.proposedFix.confidence}\n\nApprove: ${approvalUrl}\nReject: ${rejectUrl}`
    );
    logger.info(`[AutoRecovery] Approval request email sent for ${request.id}`);
  } catch (error) {
    logger.error('[AutoRecovery] Failed to send approval email:', error);
  }
}

/**
 * Main auto-recovery function - call this periodically or after errors
 */
export async function performAutoRecovery(autoApply: boolean = false): Promise<{
  success: boolean;
  approvalId?: string;
  message: string;
  errorType?: string;
  fixApplied?: boolean;
}> {
  logger.info('[AutoRecovery] Starting auto-recovery check...');

  // Read and parse error log
  const { lines, parsedErrors } = parseErrorLog();

  console.log("==== line and parseError ", lines, " == ",parsedErrors)
  
  if (lines.length === 0) {
    return { success: true, message: 'No errors found in log' };
  }

  // Detect AI service error with comprehensive extraction
  const detectedError = detectAIError(lines, parsedErrors);
  console.log('=== detect error === ', detectedError);
  
  if (!detectedError) {
    logger.info('[AutoRecovery] No AI service error detected');
    return { success: true, message: 'No AI service error detected' };
  }

  logger.info(`[AutoRecovery] AI error detected: ${detectedError.errorType}`);

  // Determine the fix based on error type
  const proposedFix = determineFix(detectedError.errorType, detectedError.errorDetails);
  
  // For high-confidence model updates, try AI suggestion as well
  if (proposedFix.type === 'model_update' && proposedFix.confidence === 'high') {
    try {
      const aiSuggestedModel = await determineFixWithAI(detectedError.errorDetails.message);
      if (aiSuggestedModel && aiSuggestedModel !== proposedFix.newValue) {
        logger.info(`[AutoRecovery] AI suggested different model: ${aiSuggestedModel}`);
        // Use AI suggestion if it's different
        proposedFix.newValue = aiSuggestedModel;
        proposedFix.description = `Update MODEL_NAME from "${proposedFix.oldValue || 'unknown'}" to "${aiSuggestedModel}" in ai.service.ts`;
      }
    } catch (error) {
      logger.warn('[AutoRecovery] AI suggestion failed, using local fix determination');
    }
  }

  // Create approval request
  const approvalId = generateApprovalId();

  // Save error to database
  await saveErrorToDatabase(
    detectedError.errorType,
    detectedError.errorDetails.message,
    proposedFix,
    approvalId
  );

  // Check if we should auto-apply (for high confidence fixes with autoApply enabled)
  const shouldAutoApply = autoApply && proposedFix.confidence === 'high' && proposedFix.type !== 'none';
  
  // Create approval request
  const approvalRequest: ApprovalRequest = {
    id: approvalId,
    type: 'auto_recovery',
    errorType: detectedError.errorType,
    errorDetected: detectedError.errorDetails.message,
    errorDetails: detectedError.errorDetails,
    proposedFix,
    filePath: proposedFix.affectedFiles[0] || AI_SERVICE_PATH,
    status: shouldAutoApply ? 'pending' : 'pending', // Always pending until approved
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  // If auto-apply is enabled and fix is high confidence, apply it automatically
  if (shouldAutoApply) {
    let applied = false;
    
    if (proposedFix.type === 'model_update' && proposedFix.newValue) {
      applied = applyFix(AI_SERVICE_PATH, proposedFix.newValue);
    } else if (proposedFix.type === 'api_key_rotation') {
      // Don't auto-apply API key changes
      logger.warn('[AutoRecovery] Skipping auto-apply for API key changes');
    }
    
    if (applied) {
      approvalRequest.status = 'auto_applied';
      approvalRequest.autoApplied = true;
      approvalRequests.set(approvalId, approvalRequest);
      
      logger.info(`[AutoRecovery] Auto-applied fix for ${approvalId}`);
      
      return {
        success: true,
        approvalId,
        message: `Auto-recovery detected and automatically applied fix: ${proposedFix.description}`,
        errorType: detectedError.errorType,
        fixApplied: true
      };
    }
  }

  // Store the approval request
  approvalRequests.set(approvalId, approvalRequest);
  logger.info(`[AutoRecovery] Created approval request: ${approvalId}`);

  // Send email to admin for approval
  try {
    await sendApprovalRequestEmail(approvalRequest);
  } catch (error) {
    logger.error('[AutoRecovery] Failed to send approval email:', error);
  }

  return {
    success: false,
    approvalId,
    message: `Auto-recovery detected error (${detectedError.errorType}). Approval request #${approvalId} created.`,
    errorType: detectedError.errorType
  };
}

/**
 * Approve and apply the fix
 */
export async function approveRecovery(approvalId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const request = approvalRequests.get(approvalId);

  if (!request) {
    return { success: false, message: 'Approval request not found or expired' };
  }

  if (request.status !== 'pending') {
    return { success: false, message: `Request already ${request.status}` };
  }

  // Apply the fix based on type
  let applied = false;
  
  if (request.proposedFix.type === 'model_update' && request.proposedFix.newValue) {
    applied = applyFix(request.filePath, request.proposedFix.newValue);
  } else if (request.proposedFix.type === 'api_key_rotation') {
    return { 
      success: false, 
      message: 'API key changes require manual intervention. Please update the .env file manually.' 
    };
  } else if (request.proposedFix.type === 'configuration_update') {
    // Configuration updates might need manual intervention
    return {
      success: false,
      message: 'Configuration updates require manual review. Please check the affected files.'
    };
  }

  if (applied) {
    request.status = 'approved';
    approvalRequests.set(approvalId, request);
    logger.info(`[AutoRecovery] Recovery approved and applied for ${approvalId}`);
    return { 
      success: true, 
      message: `Fix applied: ${request.proposedFix.description}` 
    };
  } else {
    request.status = 'rejected';
    approvalRequests.set(approvalId, request);
    return { success: false, message: 'Failed to apply the fix' };
  }
}

/**
 * Reject the recovery request
 */
export function rejectRecovery(approvalId: string): {
  success: boolean;
  message: string;
} {
  const request = approvalRequests.get(approvalId);

  if (!request) {
    return { success: false, message: 'Approval request not found or expired' };
  }

  if (request.status !== 'pending') {
    return { success: false, message: `Request already ${request.status}` };
  }

  request.status = 'rejected';
  approvalRequests.set(approvalId, request);
  logger.info(`[AutoRecovery] Recovery rejected for ${approvalId}`);

  return { success: true, message: 'Recovery request rejected' };
}

/**
 * Get approval request status
 */
export function getApprovalStatus(approvalId: string): ApprovalRequest | null {
  return approvalRequests.get(approvalId) || null;
}

/**
 * Get all pending approval requests
 */
export function getAllPendingRequests(): ApprovalRequest[] {
  const pending: ApprovalRequest[] = [];
  for (const request of approvalRequests.values()) {
    if (request.status === 'pending') {
      pending.push(request);
    }
  }
  return pending;
}

/**
 * Trigger auto-recovery with auto-apply option
 */
export async function triggerAutoRecovery(autoApply: boolean = false): Promise<{
  success: boolean;
  approvalId?: string;
  message: string;
  errorType?: string;
  fixApplied?: boolean;
}> {
  return performAutoRecovery(autoApply);
}


/**
 * Get today's errors from database for daily summary
 */
async function getTodaysErrorsFromDatabase(): Promise<any[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const errors = await ErrorDetection.find({
      detectedAt: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ detectedAt: -1 });

    return errors;
  } catch (error) {
    logger.error('[AutoRecovery] Failed to get today\'s errors from database:', error);
    return [];
  }
}

/**
 * Send daily error summary - fetches errors from database and sends email
 */
export async function sendDailyErrorSummary(): Promise<void> {
  logger.info('[AutoRecovery] Starting daily error summary...');
  
  const todaysErrors = await getTodaysErrorsFromDatabase();
  
  if (todaysErrors.length === 0) {
    logger.info('[AutoRecovery] No errors found for today');
    return;
  }
  
  logger.info(`[AutoRecovery] Found ${todaysErrors.length} errors for today`);
  await sendDailyErrorSummaryEmail(todaysErrors);
}

// Export for testing
export { approvalRequests, FALLBACK_MODELS, RECOVERY_MODEL };

/**
 * Analyze errors from log file and return suggestions
 */
export async function analyzeErrorsAndGetSuggestions(): Promise<{
  success: boolean;
  errors: Array<{
    timestamp: string;
    service: string;
    message: string;
    suggestion: string;
    fixType: string;
    confidence: string;
  }>;
  summary: {
    totalErrors: number;
    aiServiceErrors: number;
    autoRecoveryErrors: number;
    mongooseErrors: number;
  };
}> {
  logger.info('[AutoRecovery] Analyzing errors and generating suggestions...');
  
  const { lines, parsedErrors } = parseErrorLog();
  
  if (parsedErrors.length === 0) {
    return {
      success: true,
      errors: [],
      summary: {
        totalErrors: 0,
        aiServiceErrors: 0,
        autoRecoveryErrors: 0,
        mongooseErrors: 0
      }
    };
  }

  const errors: Array<{
    timestamp: string;
    service: string;
    message: string;
    suggestion: string;
    fixType: string;
    confidence: string;
  }> = [];

  let aiServiceErrors = 0;
  let autoRecoveryErrors = 0;
  let mongooseErrors = 0;

  for (const error of parsedErrors) {
    const message = error.message || '';
    const timestamp = error.timestamp || new Date().toISOString();
    const service = error.service || 'unknown';
    
    let suggestion = '';
    let fixType = 'none';
    let confidence = 'low';

    // Analyze based on error message
    if (message.includes('[AIService]') || message.includes('GoogleGenerativeAI')) {
      aiServiceErrors++;
      const errorType = classifyError(message, error.stack);
      const modelName = extractModelFromError(message);
      
      if (errorType === 'MODEL_DEPRECATED' || errorType === 'MODEL_UNAVAILABLE') {
        suggestion = `Update MODEL_NAME from "${modelName || 'unknown'}" to "${RECOVERY_MODEL}" in ai.service.ts`;
        fixType = 'model_update';
        confidence = 'high';
      } else if (errorType === 'API_KEY_INVALID') {
        suggestion = 'The GEMINI_API_KEY appears to be invalid. Please update the API key in environment variables.';
        fixType = 'api_key_rotation';
        confidence = 'high';
      } else if (errorType === 'QUOTA_EXCEEDED') {
        suggestion = 'API quota has been exceeded. Consider upgrading the Google Cloud plan or implementing request throttling.';
        fixType = 'quota_adjustment';
        confidence = 'high';
      } else {
        suggestion = 'Check AI service configuration and ensure correct model is being used.';
        fixType = 'configuration_update';
        confidence = 'medium';
      }
    } else if (message.includes('[AutoRecovery]')) {
      autoRecoveryErrors++;
      const errorType = classifyError(message, error.stack);
      const modelName = extractModelFromError(message);
      
      suggestion = `The recovery model "${modelName || RECOVERY_MODEL}" is failing. Update RECOVERY_MODEL to "${RECOVERY_MODEL}" in autoRecovery.service.ts`;
      fixType = 'recovery_model_update';
      confidence = 'high';
    } else if (message.includes('Mongoose') || message.includes('disconnected')) {
      mongooseErrors++;
      suggestion = 'Database connection lost. Check MongoDB connection settings and ensure the database server is running.';
      fixType = 'database_reconnection';
      confidence = 'high';
    } else {
      suggestion = 'Unknown error. Manual investigation required.';
      fixType = 'manual_review';
      confidence = 'low';
    }

    errors.push({
      timestamp,
      service,
      message: message.substring(0, 200), // Limit message length
      suggestion,
      fixType,
      confidence
    });
  }

  // Sort by timestamp (newest first)
  errors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  logger.info(`[AutoRecovery] Analysis complete: ${errors.length} errors analyzed`);

  return {
    success: true,
    errors,
    summary: {
      totalErrors: parsedErrors.length,
      aiServiceErrors,
      autoRecoveryErrors,
      mongooseErrors
    }
  };
}
