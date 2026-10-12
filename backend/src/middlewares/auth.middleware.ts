import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthTokenPayload } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

const authService = new AuthService();

export const authenticateJwt = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ApiResponse.error(res, 'Authorization token missing or invalid format.', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    ApiResponse.error(res, 'Session expired or invalid token. Please log in again.', 401);
  }
};
