export interface IApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
}

export interface IHealthCheck {
  status: string;
  uptime: number;
  timestamp: number;
  env: string;
  memory: NodeJS.MemoryUsage;
  database: {
    state: string;
    readyState: number;
  };
}

export interface IDecodedToken {
  id: string;
  iat: number;
  exp: number;
}