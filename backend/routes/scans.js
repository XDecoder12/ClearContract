import express from 'express';
import ScanResult from '../models/ScanResult.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const scans = await ScanResult.find({
      userId: req.user.userId
    }).sort({ scannedAt: -1 });

    res.status(200).json({
      success: true,
      scans
    });
  } catch (error) {
    console.error('Scan History Error:', error);

    res.status(500).json({
      error: 'Failed to retrieve scan history.'
    });
  }
});

export default router;