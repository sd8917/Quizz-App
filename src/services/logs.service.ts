import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service?: string;
  stack?: string;
  [key: string]: any;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  file: string;
}

interface LogFilesResponse {
  files: Array<{
    name: string;
    path: string;
    size: number;
    sizeFormatted: string;
    modifiedAt: string;
    type: 'error' | 'combined' | 'other';
  }>;
}

class LogsService {
  private logsDir = path.join(process.cwd(), 'logs');

  /**
   * Format bytes to human-readable size
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Parse a single JSON log line
   */
  private parseLogLine(line: string): LogEntry | null {
    try {
      const parsed = JSON.parse(line);
      return {
        timestamp: parsed.timestamp || new Date().toISOString(),
        level: parsed.level || 'info',
        message: parsed.message || '',
        service: parsed.service,
        stack: parsed.stack,
        ...parsed,
      };
    } catch (error) {
      // If not JSON, treat as plain text log
      return {
        timestamp: new Date().toISOString(),
        level: 'unknown',
        message: line,
      };
    }
  }

  /**
   * Get list of available log files
   */
  async getLogFiles(): Promise<LogFilesResponse> {
    try {
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }

      const files = await readdir(this.logsDir);
      const fileDetails = await Promise.all(
        files
          .filter(file => file.endsWith('.log'))
          .map(async (file) => {
            const filePath = path.join(this.logsDir, file);
            const stats = await stat(filePath);
            
            let type: 'error' | 'combined' | 'other' = 'other';
            if (file.includes('error')) type = 'error';
            else if (file.includes('combined')) type = 'combined';

            return {
              name: file,
              path: file.replace('.log', ''),
              size: stats.size,
              sizeFormatted: this.formatBytes(stats.size),
              modifiedAt: stats.mtime.toISOString(),
              type,
            };
          })
      );

      // Sort by modified date (newest first)
      fileDetails.sort((a, b) => 
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
      );

      return { files: fileDetails };
    } catch (error: any) {
      throw new Error(`Failed to read log files: ${error.message}`);
    }
  }

  /**
   * Get logs from a specific file with pagination and filtering
   */
  async getLogs(
    fileName: string = 'combined',
    page: number = 1,
    pageSize: number = 50,
    level?: string,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<LogsResponse> {
    try {
      const filePath = path.join(this.logsDir, `${fileName}.log`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`Log file '${fileName}.log' not found`);
      }

      // Read the file
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() !== '');

      // Parse all logs
      let logs: LogEntry[] = lines
        .map(line => this.parseLogLine(line))
        .filter((log): log is LogEntry => log !== null)
        .reverse(); // Newest first

      // Apply filters
      if (level) {
        logs = logs.filter(log => 
          log.level.toLowerCase() === level.toLowerCase()
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        logs = logs.filter(log =>
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log).toLowerCase().includes(searchLower)
        );
      }

      if (startDate) {
        const start = new Date(startDate);
        logs = logs.filter(log => new Date(log.timestamp) >= start);
      }

      if (endDate) {
        const end = new Date(endDate);
        logs = logs.filter(log => new Date(log.timestamp) <= end);
      }

      // Calculate pagination
      const total = logs.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedLogs = logs.slice(startIndex, endIndex);

      return {
        logs: paginatedLogs,
        total,
        page,
        pageSize,
        totalPages,
        file: fileName,
      };
    } catch (error: any) {
      throw new Error(`Failed to read logs: ${error.message}`);
    }
  }

  /**
   * Get recent error logs (last 100)
   */
  async getRecentErrors(limit: number = 100): Promise<LogEntry[]> {
    try {
      const filePath = path.join(this.logsDir, 'error.log');

      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() !== '');

      const logs = lines
        .map(line => this.parseLogLine(line))
        .filter((log): log is LogEntry => log !== null)
        .reverse()
        .slice(0, limit);

      return logs;
    } catch (error: any) {
      throw new Error(`Failed to read error logs: ${error.message}`);
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(): Promise<any> {
    try {
      const files = await this.getLogFiles();
      const errorLogs = await this.getRecentErrors(1000);

      // Count errors by level
      const errorsByLevel: Record<string, number> = {};
      errorLogs.forEach(log => {
        errorsByLevel[log.level] = (errorsByLevel[log.level] || 0) + 1;
      });

      // Get time range
      const timestamps = errorLogs.map(log => new Date(log.timestamp).getTime());
      const oldestError = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null;
      const newestError = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

      return {
        totalFiles: files.files.length,
        files: files.files.map(f => ({
          name: f.name,
          size: f.sizeFormatted,
          modifiedAt: f.modifiedAt,
        })),
        recentErrors: {
          total: errorLogs.length,
          byLevel: errorsByLevel,
          oldestTimestamp: oldestError?.toISOString(),
          newestTimestamp: newestError?.toISOString(),
        },
        serverUptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      };
    } catch (error: any) {
      throw new Error(`Failed to get log stats: ${error.message}`);
    }
  }

  /**
   * Clear logs from a specific file
   */
  async clearLogs(fileName: string): Promise<void> {
    try {
      const filePath = path.join(this.logsDir, `${fileName}.log`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Log file '${fileName}.log' not found`);
      }

      // Delete the file
      await fs.promises.unlink(filePath);
    } catch (error: any) {
      throw new Error(`Failed to delete logs: ${error.message}`);
    }
  }
}

export default new LogsService();
