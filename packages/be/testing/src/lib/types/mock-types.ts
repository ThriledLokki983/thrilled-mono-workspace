/**
 * Mock factory function type
 */
export type MockFactory<T> = (overrides?: Partial<T>) => T;

/**
 * Mock factory with async support
 */
export type AsyncMockFactory<T> = (overrides?: Partial<T>) => Promise<T>;

// Specific mock data types
export interface MockUser {
  id: number;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  role: string;
  language_preference: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MockSession {
  id: string;
  user_id: number;
  device_info: {
    userAgent: string;
    ip: string;
    platform: string;
  };
  expires_at: Date;
  created_at: Date;
  last_accessed: Date;
  is_active: boolean;
}

export interface MockJwtPayload {
  userId: string;
  sessionId: string;
  roles: string[];
  permissions: string[];
  userData: {
    email: string;
    name: string;
  };
  iat: number;
  exp: number;
}

export interface MockDatabaseRecord {
  id: number;
  created_at: Date;
  updated_at: Date;
  version: number;
}

export interface MockApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  request_id: string;
}

export interface MockErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown> | ValidationError[];
  };
  timestamp: string;
  request_id: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value: string;
}

export interface MockPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MockPaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: MockPagination;
  timestamp: string;
  request_id: string;
}

export interface MockQueryResult {
  rows: unknown[];
  rowCount: number;
  command: string;
  oid: number;
  fields: unknown[];
}

export interface MockConnection {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connect: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  end: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: any;
}

/**
 * Factory options for generating test data
 */
export interface MockFactoryOptions {
  count?: number;
  sequence?: boolean;
  seed?: string | number;
  locale?: string;
}

/**
 * Mock provider interface
 */
export interface MockProvider<T = unknown> {
  name: string;
  factory: MockFactory<T>;
}

/**
 * Database mock options
 */
export interface DatabaseMockOptions {
  connection?: string;
  persist?: boolean;
  cleanup?: boolean;
}

/**
 * Auth mock options
 */
export interface AuthMockOptions {
  userId?: string;
  sessionId?: string;
  roles?: string[];
  permissions?: string[];
  expiresIn?: string;
}

/**
 * Service mock configuration
 */
export interface ServiceMockConfig {
  autoMock?: boolean;
  implementation?: Record<string, unknown>;
  spyOn?: string[];
}

/**
 * Express request mock options
 */
export interface RequestMockOptions {
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  user?: unknown;
  session?: unknown;
  ip?: string;
  method?: string;
  path?: string;
}

/**
 * Express response mock options
 */
export interface ResponseMockOptions {
  status?: number;
  headers?: Record<string, string>;
  locals?: Record<string, unknown>;
}
