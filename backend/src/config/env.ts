import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const configuredJwtSecret = process.env.JWT_SECRET;

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: nodeEnv,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms_db',
  JWT_SECRET: configuredJwtSecret || (nodeEnv === 'development' ? 'local-development-secret-change-me-2026' : ''),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
};
