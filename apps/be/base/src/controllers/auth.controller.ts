import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '@thrilled/be-auth';
import { User } from '../interfaces/users.interface';
import { LoginDto, RequestPasswordResetDto, ResetPasswordDto } from '../dtos/auth.dto';
import { NODE_ENV } from '../config';
import { apiResponse } from '@mono/be-core';

export class AuthController {
  private readonly authService = Container.get(AuthService);

  // Extract token from request headers, cookies, or query parameters
  private extractToken(req: Request): string | null {
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
  }

  public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const newUser = await this.authService.signup(userData);
      apiResponse.created(res, 'User successfully registered', newUser);
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginData: LoginDto = req.body;
      const { cookie, findUser, token } = await this.authService.login(loginData);
      res.setHeader('Set-Cookie', [cookie]);

      const responseData = {
        ...findUser,
        ...(NODE_ENV === 'development' ? { debug: { token } } : {}),
      };

      apiResponse.success(res, 'Login successful', responseData);
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from request headers, cookies, or query parameters
      const token = this.extractToken(req);
      if (!token) {
        apiResponse.badRequest(res, 'No token provided');
        return;
      }

      // Convert centralized user to local User interface for auth service
      const userData = req.user as unknown as User;

      const logOutUser = await this.authService.logout(userData, token);
      res.setHeader('Set-Cookie', ['Authorization=; Max-Age=0']);
      apiResponse.success(res, 'Logout successful', logOutUser);
    } catch (error) {
      next(error);
    }
  };

  public requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: RequestPasswordResetDto = req.body;
      const result = await this.authService.requestPasswordReset(dto);
      apiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: ResetPasswordDto = req.body;
      const result = await this.authService.resetPassword(dto);
      apiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  public getResetTokenForDev = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (NODE_ENV !== 'development') {
        apiResponse.notFound(res, 'Endpoint not available in this environment');
        return;
      }

      const email = req.query.email;
      if (typeof email !== 'string') {
        apiResponse.badRequest(res, 'A valid email is required');
        return;
      }

      const token = await this.authService.getResetTokenForDev(email);

      if (!token) {
        apiResponse.notFound(res, 'No active reset token found for this email');
        return;
      }

      apiResponse.success(res, 'Reset token retrieved successfully', { email, token });
    } catch (error) {
      next(error);
    }
  };
}
