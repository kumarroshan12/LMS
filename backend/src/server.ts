import { createApp } from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';

const startServer = async () => {
  try {
    await connectDB();

    const app = createApp();

    app.listen(ENV.PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 LMS Backend Running on port ${ENV.PORT}`);
      console.log(`🌐 Base API URL: http://localhost:${ENV.PORT}/api`);
      console.log(`🩺 Health Check: http://localhost:${ENV.PORT}/api/health`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to bootstrap server:', error);
    process.exit(1);
  }
};

startServer();
