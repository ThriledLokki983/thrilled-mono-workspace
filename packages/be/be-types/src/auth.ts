// Base user interface
export interface User {
  id: string;
  email: string;
  password?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  is_verified?: boolean;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

// User creation data
export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
}

// User update data
export interface UpdateUserData {
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

// User without sensitive data
export type SafeUser = Omit<User, 'password'>;

// Authentication result
export interface AuthResult {
  user: SafeUser;
  authenticated: boolean;
  error?: string;
}

// Token pair
export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data
export interface RegistrationData extends CreateUserData {
  confirmPassword?: string;
  acceptTerms?: boolean;
}

// Password reset request
export interface PasswordResetRequest {
  email: string;
}

// Password reset data
export interface PasswordResetData {
  token: string;
  newPassword: string;
}

// Auth utility types
export interface RequestWithToken {
  headers: {
    authorization?: string;
  };
  query: {
    token?: string | string[];
  };
  cookies?: {
    accessToken?: string;
  };
}

// Auth utility functions
export const extractToken = (req: RequestWithToken): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check query parameter
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  // Check cookie
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};
