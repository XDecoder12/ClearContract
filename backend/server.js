import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.js'; // <-- 1. Add this import
import authRoutes from './routes/auth.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); 
app.use(cors()); 

const PORT = process.env.PORT || 5001;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟢 MongoDB successfully connected!'))
  .catch((err) => console.error('🔴 MongoDB connection error:', err));

// Use Routes
app.use('/api/ai', aiRoutes); // <-- 2. Connect the AI route
app.use('/api/auth', authRoutes);

// Basic Health Check Route
app.get('/', (req, res) => {
  res.send('ClearContract AI Guardian API is running.');
});

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});