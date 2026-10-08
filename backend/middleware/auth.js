import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        error: 'Invalid or expired authentication token.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      !decoded ||
      typeof decoded !== 'object' ||
      typeof decoded.userId !== 'string' ||
      !mongoose.Types.ObjectId.isValid(decoded.userId)
    ) {
      return res.status(401).json({
        error: 'Invalid or expired authentication token.'
      });
    }

    req.user = {
      userId: decoded.userId
    };

    next();
  } catch (error) {
    console.error('Authentication Error:', error);

    return res.status(401).json({
      error: 'Invalid or expired authentication token.'
    });
  }
};

export default authenticateToken;