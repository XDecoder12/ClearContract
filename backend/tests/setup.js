import mongoose from 'mongoose';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.PORT = '5001';

export const connectTestDatabase = async (mongoUri) => {
  await mongoose.connect(mongoUri);
};

export const disconnectTestDatabase = async () => {
  await mongoose.disconnect();
};