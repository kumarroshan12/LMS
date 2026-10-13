import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthTokenPayload } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';
import { UserRepository } from '../repositories/user.repository';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

const authService = new AuthService();
const userRepository = new UserRepository();

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiResponse.error(res, 'Authorization token missing or invalid format.', 401);
    return;
  }

  let decoded: AuthTokenPayload;
  try {
    decoded = authService.verifyToken(authHeader.split(' ')[1]);
  } catch {
    ApiResponse.error(res, 'Session expired or invalid token. Please log in again.', 401);
    return;
  }

  try {
    const account = await userRepository.findById(decoded.id);
    if (!account) {
      ApiResponse.error(res, 'Account no longer exists. Please log in again.', 401);
      return;
    }
    // Use current account data so removed/changed roles take effect immediately.
    req.user = {
      id: account._id.toString(),
      email: account.email,
      role: account.role,
      fullName: account.fullName,
    };
    next();
  } catch (error) {
    next(error);
  }
};
