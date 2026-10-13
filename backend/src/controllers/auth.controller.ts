import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../constants/roles';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullName, email, password, phone } = req.body;

      if (!fullName || !email || !password) {
        ApiResponse.error(res, 'Full Name, email, and password are required.', 400);
        return;
      }

      if (password.length < 6) {
        ApiResponse.error(res, 'Password must be at least 6 characters long.', 400);
        return;
      }

      const result = await this.authService.register(
        fullName,
        email,
        password,
        UserRole.BORROWER,
        phone
      );

      ApiResponse.success(res, 'User registration successful.', result, 201);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Registration failed.', 400);
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        ApiResponse.error(res, 'Email and password are required.', 400);
        return;
      }

      const result = await this.authService.login(email, password);
      ApiResponse.success(res, 'Login successful.', result, 200);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Login failed.', 401);
    }
  };

  public getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'User session not found.', 401);
        return;
      }
      ApiResponse.success(res, 'User authenticated.', req.user, 200);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch session.', 500);
    }
  };
}
