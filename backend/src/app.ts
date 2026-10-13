import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';

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
