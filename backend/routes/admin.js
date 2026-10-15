import express from 'express';

import authenticateToken from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';

import User from '../models/User.js';
import ScanResult from '../models/ScanResult.js';

const router = express.Router();

const MAX_PAGE_SIZE = 100;

// All routes in this file require authentication and admin authorization.
router.use(authenticateToken, requireAdmin);

const parsePagination = (req, res) => {
  const pageValue = req.query.page ?? '1';
  const limitValue = req.query.limit ?? '20';

  const isIntegerString = (value) =>
    typeof value === 'string' && /^\d+$/.test(value);

  if (
    !isIntegerString(pageValue) ||
    !isIntegerString(limitValue)
  ) {
    res.status(400).json({
      error: 'Page and limit must be valid positive integers.'
    });

    return null;
  }

  const page = Number(pageValue);
  const limit = Number(limitValue);

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > MAX_PAGE_SIZE
  ) {
    res.status(400).json({
      error: 'Page must be positive and limit must be between 1 and 100.'
    });

    return null;
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

// Escape user search text so it is treated as literal text, not a regex.
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/me
router.get('/me', (req, res) => {
  res.status(200).json({
    success: true,
    admin: req.admin
  });
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const [
      totalUsers,
      totalScans,
      scansLast7Days,
      commonRiskCategories
    ] = await Promise.all([
      User.countDocuments({}),

      ScanResult.countDocuments({}),

      ScanResult.countDocuments({
        scannedAt: { $gte: sevenDaysAgo }
      }),

      ScanResult.aggregate([
        { $unwind: '$darkPatternsFound' },
        {
          $match: {
            'darkPatternsFound.category': {
              $type: 'string',
              $ne: ''
            }
          }
        },
        {
          $group: {
            _id: '$darkPatternsFound.category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            count: -1,
            _id: 1
          }
        },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            category: '$_id',
            count: 1
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalScans,
        scansLast7Days
      },
      commonRiskCategories
    });
  } catch (error) {
    console.error('Admin Statistics Error:', error);

    res.status(500).json({
      error: 'Failed to retrieve dashboard statistics.'
    });
  }
});

// GET /api/admin/users?q=alice&page=1&limit=20
router.get('/users', async (req, res) => {
  try {
    const pagination = parsePagination(req, res);

    if (!pagination) {
      return;
    }

    const rawSearch = req.query.q ?? '';

    if (
      typeof rawSearch !== 'string' ||
      rawSearch.length > 100
    ) {
      return res.status(400).json({
        error: 'Search query must be a string of at most 100 characters.'
      });
    }

    const search = rawSearch.trim();

    const filter = search
      ? {
          email: {
            $regex: escapeRegex(search),
            $options: 'i'
          }
        }
      : {};

    const [total, users] = await Promise.all([
      User.countDocuments(filter),

      User.find(filter)
        .select('_id email role createdAt')
        .sort({ createdAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
    ]);

    let scanCounts = [];

    if (users.length > 0) {
      scanCounts = await ScanResult.aggregate([
        {
          $match: {
            userId: {
              $in: users.map((user) => user._id)
            }
          }
        },
        {
          $group: {
            _id: '$userId',
            scanCount: { $sum: 1 }
          }
        }
      ]);
    }

    const scanCountByUserId = new Map(
      scanCounts.map((item) => [
        item._id.toString(),
        item.scanCount
      ])
    );

    res.status(200).json({
      success: true,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      },
      users: users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        role: user.role ?? 'user',
        createdAt: user.createdAt,
        scanCount: scanCountByUserId.get(
          user._id.toString()
        ) ?? 0
      }))
    });
  } catch (error) {
    console.error('Admin User List Error:', error);

    res.status(500).json({
      error: 'Failed to retrieve users.'
    });
  }
});

// GET /api/admin/scans?page=1&limit=20
router.get('/scans', async (req, res) => {
  try {
    const pagination = parsePagination(req, res);

    if (!pagination) {
      return;
    }

    const [total, scans] = await Promise.all([
      ScanResult.countDocuments({}),

      ScanResult.find({})
        .select(
          '_id userId sourceUrl aiSummary darkPatternsFound scannedAt'
        )
        .populate({
          path: 'userId',
          select: 'email'
        })
        .sort({ scannedAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
    ]);

    const safeScans = scans.map((scan) => ({
      id: scan._id.toString(),

      user: scan.userId
        ? {
            id: scan.userId._id.toString(),
            email: scan.userId.email
          }
        : null,

      sourceUrl: scan.sourceUrl,
      aiSummary: scan.aiSummary,
      darkPatternsFound: scan.darkPatternsFound,
      scannedAt: scan.scannedAt
    }));

    res.status(200).json({
      success: true,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      },
      scans: safeScans
    });
  } catch (error) {
    console.error('Admin Scan List Error:', error);

    res.status(500).json({
      error: 'Failed to retrieve scan activity.'
    });
  }
});

export default router;