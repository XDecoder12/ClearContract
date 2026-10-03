import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';
import { validateEnvironment } from './config/env.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

try {
  validateEnvironment();
} catch (error) {
  console.error('🔴 Environment configuration error:', error.message);
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🟢 MongoDB successfully connected!');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('🔴 MongoDB connection error:', err);
    process.exit(1);
  });