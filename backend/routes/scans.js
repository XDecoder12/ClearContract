import mongoose from 'mongoose';
import express from 'express';
import ScanResult from '../models/ScanResult.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const scans = await ScanResult.find({
  userId: req.user.userId
})
  .select(
    '_id sourceUrl aiSummary overallRiskLevel darkPatternsFound scannedAt'
  )
  .sort({ scannedAt: -1 })
  .limit(50)
  .lean();

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

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const scanId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(scanId)) {
      return res.status(400).json({
        error: 'Invalid scan ID.'
      });
    }

    const deletedScan = await ScanResult.findOneAndDelete({
      _id: scanId,
      userId: req.user.userId
    });

    if (!deletedScan) {
      return res.status(404).json({
        error: 'Scan not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Scan deleted successfully.'
    });
  } catch (error) {
    console.error('Delete Scan Error:', error);

    return res.status(500).json({
      error: 'Failed to delete scan.'
    });
  }
});

export default router;