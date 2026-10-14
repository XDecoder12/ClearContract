import express from 'express';

import authenticateToken from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';

const router = express.Router();

// Verify an admin session and return safe account details.
router.get(
  '/me',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    res.status(200).json({
      success: true,
      admin: req.admin
    });
  }
);

export default router;