import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { UserRole } from '../constants/roles';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Role-Based Access Control (RBAC) Middleware.
 * Admin role always has wildcard access to all executive operations.
 * If user does not possess required role, returns HTTP 403 Forbidden.
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.error(res, 'Authentication required before checking roles.', 401);
      return;
    }

    // Admin has universal super-privileges across all executive operations
    const userRole = req.user.role;
    const isAuthorized =
      allowedRoles.includes(userRole) ||
      (userRole === UserRole.ADMIN && allowedRoles.some((r) => r !== UserRole.BORROWER));

    if (!isAuthorized) {
      ApiResponse.error(
        res,
        `Access Forbidden: Role '${userRole}' does not have permission to access this resource. Required roles: ${allowedRoles.join(', ')}.`,
        403
      );
      return;
    }

    next();
  };
};
