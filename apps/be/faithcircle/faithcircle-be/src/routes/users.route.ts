import { Router, RequestHandler } from 'express';
import { UserController } from '../controllers/users.controller';
import { CreateUserDto } from '../dtos/users.dto';
import { Routes } from '../interfaces/routes.interface';
import { ClassValidatorMiddleware } from '@thrilled/be-validation';
import { Container } from 'typedi';
import { AuthMiddleware } from '@thrilled/be-auth';

/**
 * Get the centralized auth middleware instance from the container
 */
function getAuthMiddleware(): AuthMiddleware {
  return Container.get('authMiddleware') as AuthMiddleware;
}

export class UserRoute implements Routes {
  public path = '/users';
  public router: Router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Place the /me route BEFORE the /:id route to ensure it's not treated as a UUID parameter
    /**
     * @swagger
     * /users/me:
     *   get:
     *     tags:
     *       - Users
     *     summary: Get current user profile
     *     description: Retrieve the profile of the currently authenticated user
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Current user data retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       401:
     *         description: Unauthorized - Authentication required
     *       404:
     *         description: Authentication token missing
     */
    this.router.get(`${this.path}/me`, getAuthMiddleware().requireAuth() as RequestHandler, this.user.getCurrentUser as RequestHandler);

    /**
     * @swagger
     * /users:
     *   get:
     *     tags:
     *       - Users
     *     summary: Get all users
     *     description: Retrieve a list of all users
     *     responses:
     *       200:
     *         description: List of users retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/User'
     */
    this.router.get(`${this.path}`, this.user.getUsers);

    /**
     * @swagger
     * /users/{id}:
     *   get:
     *     tags:
     *       - Users
     *     summary: Get a specific user
     *     description: Retrieve user details by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: User ID
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: User found and returned
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       409:
     *         description: User not found
     */
    this.router.get(`${this.path}/:id`, this.user.getUserById);

    /**
     * @swagger
     * /users:
     *   post:
     *     tags:
     *       - Users
     *     summary: Create a new user
     *     description: Create a new user with email and password
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateUserDto'
     *     responses:
     *       201:
     *         description: User created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Bad request - validation error
     *       409:
     *         description: Email already exists
     */
    this.router.post(`${this.path}`, ClassValidatorMiddleware(CreateUserDto, 'body'), this.user.createUser);

    /**
     * @swagger
     * /users/{id}:
     *   put:
     *     tags:
     *       - Users
     *     summary: Update a user
     *     description: Update user details by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: User ID
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateUserDto'
     *     responses:
     *       200:
     *         description: User updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Bad request - validation error
     *       409:
     *         description: User not found
     */
    this.router.put(
      `${this.path}/:id`,
      ClassValidatorMiddleware(CreateUserDto, 'body', {
        skipMissingProperties: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
      this.user.updateUser,
    );

    /**
     * @swagger
     * /users/{id}:
     *   delete:
     *     tags:
     *       - Users
     *     summary: Delete a user
     *     description: Delete user by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: User ID
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: User deleted successfully
     *       409:
     *         description: User not found
     */
    this.router.delete(`${this.path}/:id`, this.user.deleteUser);
  }
}
