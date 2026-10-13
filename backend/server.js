import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

import { validateEnvironment } from './config/env.js';
import { createShutdownHandler } from './config/shutdown.js';

const PORT = Number(process.env.PORT || 5001);

const startServer = async () => {
  try {
    validateEnvironment();
  } catch (error) {
    console.error(
      '🔴 Environment configuration error:',
      error.message
    );

    process.exit(1);
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.error('🔴 MongoDB connection error:', error);

    process.exit(1);
    return;
  }

  console.log('🟢 MongoDB successfully connected!');

  const server = app.listen(PORT, () => {
    console.log(
      `🚀 Server running on http://localhost:${PORT}`
    );
  });

  const shutdown = createShutdownHandler({
    server,
    disconnectDatabase: () => mongoose.disconnect()
  });

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((error) => {
  console.error('🔴 Server startup error:', error);
  process.exit(1);
});