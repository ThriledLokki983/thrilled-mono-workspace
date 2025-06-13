import { PoolClient } from 'pg';
import { Container, Service } from 'typedi';
import { Logger } from '@mono/be-core';
import { HttpException } from '@thrilled/be-types';
import { DbHelper, EntitySqlHelpers } from '@thrilled/databases';
import { User } from '../interfaces/users.interface';
import { LoginDto, RequestPasswordResetDto, ResetPasswordDto } from '../dtos/auth.dto';
import { logger, redactSensitiveData } from '../utils/logger';
import { UserHelper } from '../utils/userHelper';
import { HttpStatusCodes } from '../utils/httpStatusCodes';

/**
 * AuthService handles user authentication, including signup, login, logout,
 * password reset, and token management.
 * It ensures secure handling of user credentials and session management.
 * This service uses transactions to maintain data integrity during operations.
 * It also includes methods for password reset and token management.
 */
@Service()
export class AuthService {
  private logger: Logger;

  // Auth package components - get instances from TypeDI container
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jwtProvider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private passwordManager: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sessionManager: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rbacManager: any;

  constructor() {
    // Initialize logger
    this.logger = Logger.create({
      level: 'info',
      format: 'json',
      dir: 'logs',
    });

    // Get auth package instances from TypeDI container
    this.jwtProvider = Container.get('jwtProvider');
    this.passwordManager = Container.get('passwordManager');
    this.sessionManager = Container.get('sessionManager');
    this.rbacManager = Container.get('rbacManager');
  }

  public async signup(userData: User): Promise<Omit<User, 'password'>> {
    const { email, password, name, first_name, last_name, phone, address, role, language_preference, is_active } = userData;

    // Using transaction to ensure atomicity of the signup process
    return await DbHelper.withTransaction(async (client: PoolClient) => {
      // Check if the email already exists
      const existsResult = await DbHelper.query(`SELECT 1 FROM users WHERE email = $1 LIMIT 1`, [email], client);
      if (existsResult.rowCount > 0) {
        throw new HttpException(HttpStatusCodes.CONFLICT, `This email ${email} already exists`);
      }

      // Hash the password using auth package
      const hashedPassword = await this.passwordManager.hashPassword(password);

      // Insert the new user into the database - must match EntitySqlHelpers.User.getInsertQuery() parameter order
      const result = await DbHelper.query(
        EntitySqlHelpers.User.getInsertQuery(),
        [
          email,
          hashedPassword,
          name,
          first_name,
          last_name,
          phone || null,
          address || null,
          role || 'user',  // Default to 'user' role if not provided
          language_preference || 'en',  // Default to 'en' if not provided
          is_active !== undefined ? is_active : true  // Default to true if not provided
        ],
        client,
      );

      return result.rows[0] as Omit<User, 'password'>;
    });
  }

  public async login(userData: LoginDto): Promise<{ cookie: string; findUser: Omit<User, 'password'>; token?: string }> {
    const { email, password } = userData;

    try {
      // Get the full user object with ALL fields including ID
      const result = await DbHelper.query(EntitySqlHelpers.User.getByEmailQuery(true, true), [email]);
      const user = result.rows[0] as (User & { password: string }) | undefined;

      if (!user) {
        // Changed status code to 404 as this is a not found scenario
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `User with email ${email} not found or is inactive`);
      }

      // Check if the password is correct using auth package
      const isPasswordMatching: boolean = await this.passwordManager.verifyPassword(password, user.password);
      if (!isPasswordMatching) {
        // Incorrect credentials should be 401 Unauthorized
        throw new HttpException(HttpStatusCodes.UNAUTHORIZED, 'Invalid credentials');
      }

      // Use debug level for development logs and redact any sensitive data
      logger.debug(`Creating token for user: ${JSON.stringify(redactSensitiveData({ id: user.id, email: user.email }))}`);

      // Create session using auth package
      const session = await this.sessionManager.createSession(user.id, {
        userAgent: 'Backend Service', // Could be extracted from request headers if available
        ip: '127.0.0.1', // Could be extracted from request if available
        platform: 'Backend',
      });

      // Create a token using auth package
      const accessToken = await this.jwtProvider.createAccessToken({
        userId: user.id,
        sessionId: session.sessionId,
        roles: user.role ? [user.role] : ['user'],
        permissions: [], // Can be expanded based on RBAC implementation
        userData: {
          email: user.email,
          name: user.name,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      });

      // Create cookie format compatible with existing system
      const cookie = `Authorization=${accessToken}; HttpOnly; Max-Age=3600; SameSite=Strict; Path=/`;

      // Format the user response using our helper
      const userWithoutPassword = UserHelper.formatUserResponse(user);

      return {
        cookie,
        findUser: userWithoutPassword as Omit<User, 'password'>,
        token: accessToken,
      };
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      throw error;
    }
  }

  public async logout(userData: User, token: string): Promise<Omit<User, 'password'>> {
    const { email } = userData;

    // Check if the user exists
    const result = await DbHelper.query(EntitySqlHelpers.User.getByEmailQuery(true, false), [email]);
    const user = result.rows[0] as User | undefined;

    if (!user) {
      // Changed to NOT_FOUND status code
      throw new HttpException(HttpStatusCodes.NOT_FOUND, `User with email ${email} not found`);
    }

    // Get token payload to extract session information
    const tokenPayload = this.jwtProvider.getTokenPayload(token);

    if (tokenPayload && tokenPayload.sessionId) {
      // Destroy the session using auth package
      await this.sessionManager.destroySession(tokenPayload.sessionId);
    }

    // Blacklist the token using auth package
    await this.jwtProvider.blacklistToken(token);

    // Format the user response using our helper
    return UserHelper.formatUserResponse(user) as Omit<User, 'password'>;
  }

  public async requestPasswordReset(passwordResetData: RequestPasswordResetDto): Promise<{ message: string }> {
    const { email } = passwordResetData;

    try {
      // 1. Find user by email
      const result = await DbHelper.query(EntitySqlHelpers.User.getByEmailQuery(), [email]);
      const user = result.rows[0] as { id: string; email: string } | undefined;

      if (!user) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `User with email ${email} not found`);
      }

      // 2. Generate reset token using auth package
      const { token } = await this.passwordManager.createResetToken(user.id, 30);

      // 3. Revoke any existing reset tokens for the user (handled by auth package)
      await this.passwordManager.revokeResetTokens(user.id);

      // 4. Simulated email message (replace with email logic in production)
      return {
        message: `Password reset link has been sent to ${email}. In production, the link would contain: ${token}`,
      };
    } catch (error) {
      this.logger.error(`Password reset request error: ${error.message}`);
      throw error;
    }
  }

  public async resetPassword(resetData: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetData;

    try {
      // 1. Verify the reset token and get user ID using auth package
      const userId = await this.passwordManager.verifyResetToken(token);

      // 2. Confirm user exists
      const result = await DbHelper.query(EntitySqlHelpers.User.getByIdQuery(), [userId]);
      const user = result.rows[0] as { id: string } | undefined;

      if (!user) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, 'User not found');
      }

      // 3. Hash the new password using auth package
      const hashedPassword = await this.passwordManager.hashPassword(password);

      // 4. Update user's password
      await DbHelper.query(
        `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
        [hashedPassword, userId]
      );

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      this.logger.error(`Password reset error: ${error.message}`);
      throw error;
    }
  }

  // Development-only method to retrieve a fresh password reset token
  public async getResetTokenForDev(email: string): Promise<string | null> {
    try {
      // 1. Lookup user by email
      const result = await DbHelper.query(EntitySqlHelpers.User.getByEmailQuery(), [email]);
      const user = result.rows[0] as { id: string } | undefined;

      if (!user) return null;

      const userId = user.id;

      // 2. Generate a new reset token using auth package
      const { token } = await this.passwordManager.createResetToken(userId, 30);

      // 3. Return the unhashed token (for dev use only!)
      return token;
    } catch (error) {
      // Only log the error message, not the full error object which might contain sensitive data
      this.logger.error(`Dev reset token error: ${error.message}`);
      return null;
    }
  }
}
