import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { ENV } from './config/env';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: '*', // Allows local Next.js frontend or any deployment client
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static uploads
  app.use('/uploads', express.static(path.join(process.cwd(), ENV.UPLOAD_DIR)));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Loan Management System API',
    });
  });

  // API Routes
  app.use('/api', apiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
