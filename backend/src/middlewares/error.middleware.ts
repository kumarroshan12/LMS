import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Unhandled Error]:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      ApiResponse.error(res, 'Uploaded file exceeds the maximum 5 MB size limit.', 400);
      return;
    }
    ApiResponse.error(res, `File upload error: ${err.message}`, 400);
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  ApiResponse.error(res, message, statusCode);
};
