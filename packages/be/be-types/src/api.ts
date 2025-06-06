// API Response types
export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  statusCode: number;
  requestId?: string;
  errors?: ApiError[];
}

// Success response
export interface ApiSuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data?: T;
  meta?: Record<string, unknown>;
}

// Error response
export interface ApiErrorResponse extends ApiResponse {
  success: false;
  errors?: ApiError[];
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Pagination query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter query parameters
export interface FilterQuery {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | undefined;
}

// API endpoint definition
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  handler: string;
  middleware?: string[];
  validation?: Record<string, unknown>;
  auth?: boolean;
  roles?: string[];
}

// Route definition
export interface RouteDefinition {
  prefix?: string;
  endpoints: ApiEndpoint[];
}

// Middleware definition
export interface MiddlewareDefinition {
  name: string;
  path?: string;
  handler: (req: unknown, res: unknown, next: unknown) => void;
  order?: number;
}
