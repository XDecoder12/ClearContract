import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

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