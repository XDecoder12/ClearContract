import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import ScanResult from '../models/ScanResult.js';

import app from '../app.js';
import User from '../models/User.js';

let mongoServer;

const TEST_PASSWORD = 'TestPassword123!';

const registerUser = async (email, requestedRole) => {
  const payload = {
    email,
    password: TEST_PASSWORD
  };

  // Used by a test to check that public role escalation fails.
  if (requestedRole !== undefined) {
    payload.role = requestedRole;
  }

  await request(app)
    .post('/api/auth/register')
    .send(payload)
    .expect(201);

  return User.findOne({ email });
};

const loginUser = async (email) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password: TEST_PASSWORD
    })
    .expect(200);

  return response.body.token;
};

const createAdminSession = async (
  email = 'admin@example.com'
) => {
  const admin = await registerUser(email);

  admin.role = 'admin';
  await admin.save();

  const token = await loginUser(email);

  return { admin, token };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  await User.deleteMany({});
  await ScanResult.deleteMany({});
});

describe('Admin authorization', () => {
  test('rejects access without authentication', async () => {
    const response = await request(app)
      .get('/api/admin/me')
      .expect(401);

    expect(response.body.error).toBe(
      'Authentication required.'
    );
  });

  test('rejects an authenticated ordinary user', async () => {
    const email = 'regular@example.com';

    const user = await registerUser(email);
    expect(user.role).toBe('user');

    const token = await loginUser(email);

    const response = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.error).toBe(
      'Administrator access required.'
    );
  });

  test('does not allow public registration to grant admin role', async () => {
    const email = 'attempted-admin@example.com';

    const user = await registerUser(email, 'admin');

    expect(user.role).toBe('user');

    const token = await loginUser(email);

    const response = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.error).toBe(
      'Administrator access required.'
    );
  });

  test('allows a database-promoted admin to access the endpoint', async () => {
    const email = 'admin@example.com';

    const user = await registerUser(email);
    user.role = 'admin';
    await user.save();

    const token = await loginUser(email);

    const response = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(response.body.admin).toMatchObject({
      id: user._id.toString(),
      email,
      role: 'admin'
    });

    expect(response.body.admin.password).toBeUndefined();
  });

  test('revokes admin access when the database role changes', async () => {
    const email = 'demoted-admin@example.com';

    const user = await registerUser(email);
    user.role = 'admin';
    await user.save();

    const token = await loginUser(email);

    // Demote the account after its JWT has already been issued.
    user.role = 'user';
    await user.save();

    const response = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.error).toBe(
      'Administrator access required.'
    );
  });

    test('returns dashboard statistics and common risk categories', async () => {
    const { token } = await createAdminSession();

    const member = await registerUser('member@example.com');

    await ScanResult.create([
      {
        userId: member._id,
        sourceUrl: 'https://example.com/terms',
        originalText: 'Example contract one',
        darkPatternsFound: [
          {
            category: 'Automatic Renewal',
            explanation: 'The subscription renews automatically.'
          }
        ],
        aiSummary: 'Automatic renewal detected.'
      },
      {
        userId: member._id,
        sourceUrl: 'https://example.com/privacy',
        originalText: 'Example contract two',
        darkPatternsFound: [
          {
            category: 'Automatic Renewal',
            explanation: 'The subscription renews automatically.'
          },
          {
            category: 'Cancellation Barrier',
            explanation: 'Cancellation requires an extra step.'
          }
        ],
        aiSummary: 'Renewal and cancellation risks detected.'
      }
    ]);

    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(response.body.stats).toMatchObject({
      totalUsers: 2,
      totalScans: 2,
      scansLast7Days: 2
    });

    expect(response.body.commonRiskCategories).toEqual([
      {
        category: 'Automatic Renewal',
        count: 2
      },
      {
        category: 'Cancellation Barrier',
        count: 1
      }
    ]);
  });

  test('searches users and returns scan counts without sensitive fields', async () => {
    const { token } = await createAdminSession();

    const alice = await registerUser('alice@example.com');
    await registerUser('bob@example.com');

    await ScanResult.create([
      {
        userId: alice._id,
        originalText: 'Private contract text one',
        darkPatternsFound: [],
        aiSummary: 'First scan'
      },
      {
        userId: alice._id,
        originalText: 'Private contract text two',
        darkPatternsFound: [],
        aiSummary: 'Second scan'
      }
    ]);

    const response = await request(app)
      .get('/api/admin/users?q=alice&page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.users).toHaveLength(1);

    expect(response.body.users[0]).toMatchObject({
      email: 'alice@example.com',
      role: 'user',
      scanCount: 2
    });

    expect(response.body.users[0]).not.toHaveProperty('password');
    expect(JSON.stringify(response.body)).not.toContain(
      'Private contract text one'
    );
  });

  test('returns recent scan metadata without original contract text', async () => {
    const { token } = await createAdminSession();

    const member = await registerUser('scan-owner@example.com');

    await ScanResult.create({
      userId: member._id,
      sourceUrl: 'https://example.com/terms',
      originalText: 'Sensitive raw contract text',
      darkPatternsFound: [
        {
          category: 'Hidden Fee',
          explanation: 'An additional fee may apply.'
        }
      ],
      aiSummary: 'A hidden fee risk was detected.'
    });

    const response = await request(app)
      .get('/api/admin/scans?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.scans).toHaveLength(1);

    expect(response.body.scans[0].user.email).toBe(
      'scan-owner@example.com'
    );

    expect(response.body.scans[0].sourceUrl).toBe(
      'https://example.com/terms'
    );

    expect(response.body.scans[0].darkPatternsFound[0].category)
      .toBe('Hidden Fee');

    expect(response.body.scans[0]).not.toHaveProperty(
      'originalText'
    );

    expect(JSON.stringify(response.body)).not.toContain(
      'Sensitive raw contract text'
    );
  });

  test('rejects invalid pagination parameters', async () => {
    const { token } = await createAdminSession();

    const response = await request(app)
      .get('/api/admin/users?page=0&limit=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body.error).toContain(
      'Page must be positive'
    );
  });

  test('does not allow a regular user to retrieve admin statistics', async () => {
    await registerUser('regular-stats@example.com');

    const token = await loginUser('regular-stats@example.com');

    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.error).toBe(
      'Administrator access required.'
    );
  });
});