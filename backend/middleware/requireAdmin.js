import User from '../models/User.js';

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    const user = await User.findById(req.user.userId)
      .select('email role createdAt');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired authentication token.'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Administrator access required.'
      });
    }

    // Expose only the fields needed by admin endpoints.
    req.admin = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    next();
  } catch (error) {
    console.error('Admin Authorization Error:', error);

    return res.status(500).json({
      error: 'Failed to verify administrator permissions.'
    });
  }
};

export default requireAdmin;