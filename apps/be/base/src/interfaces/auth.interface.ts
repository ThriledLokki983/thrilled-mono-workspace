import { Request } from 'express';
import { User } from './users.interface';

// Main interface for authenticated requests
// TODO: Consider migrating to centralized AuthenticatedRequest from @thrilled/be-auth
export interface RequestWithUser extends Request {
  user: User;
  token?: string; // Add token to store the JWT during logout
}
