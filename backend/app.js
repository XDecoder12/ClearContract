import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import scansRoutes from './routes/scans.js';

const app = express();

const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS || ''
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests that do not send an Origin header,
    // such as Supertest and other server-to-server requests.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  }
};

const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many analysis requests. Please try again later.'
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(cors(corsOptions));

app.use('/api/ai/analyze', aiRateLimiter);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/scans', scansRoutes);

app.get('/', (req, res) => {
  res.send('ClearContract AI Guardian API is running.');
});

export default app;