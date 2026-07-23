import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Allows your React apps to communicate with this API

const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟢 MongoDB successfully connected!'))
  .catch((err) => console.error('🔴 MongoDB connection error:', err));

// Basic Health Check Route
app.get('/', (req, res) => {
  res.send('ClearContract AI Guardian API is running.');
});

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});