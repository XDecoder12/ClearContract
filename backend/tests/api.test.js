import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import User from '../models/User.js';
import ScanResult from '../models/ScanResult.js';

let mongoServer;
let authToken;
let userId;

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

  authToken = null;
  userId = null;
});

describe('GET /', () => {
  test('returns the ClearContract API message', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.text).toBe(
      'ClearContract AI Guardian API is running.'
    );
  });
});

describe('Authentication', () => {
  test('registers a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
      .expect(201);

    expect(response.body.message).toBe(
      'User registered successfully!'
    );

    const user = await User.findOne({
      email: 'test@example.com'
    });

    expect(user).not.toBeNull();
    expect(user.password).not.toBe('TestPassword123!');
  });

  test('rejects duplicate registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'duplicate@example.com',
        password: 'TestPassword123!'
      })
      .expect(201);

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'duplicate@example.com',
        password: 'TestPassword123!'
      })
      .expect(400);

    expect(response.body.error).toBe(
      'User already exists with this email.'
    );
  });

  test('logs in a registered user and returns a token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login@example.com',
        password: 'TestPassword123!'
      })
      .expect(201);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'TestPassword123!'
      })
      .expect(200);

    expect(response.body.message).toBe('Login successful!');
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.length).toBeGreaterThan(0);
    expect(response.body.userId).toBeDefined();
  });

  test('rejects invalid login credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-login@example.com',
        password: 'TestPassword123!'
      })
      .expect(201);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid-login@example.com',
        password: 'WrongPassword123!'
      })
      .expect(400);

    expect(response.body.error).toBe(
      'Invalid email or password.'
    );
  });

    test('rejects registration with missing credentials', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com'
      })
      .expect(400);

    expect(response.body.error).toBe(
      'Email and password are required.'
    );
  });

  test('rejects registration with an invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'not-an-email',
        password: 'TestPassword123!'
      })
      .expect(400);

    expect(response.body.error).toBe(
      'Invalid email format.'
    );
  });

  test('rejects registration with a short password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'short-password@example.com',
        password: '1234567'
      })
      .expect(400);

    expect(response.body.error).toBe(
      'Password must be at least 8 characters.'
    );
  });

  test('normalizes email addresses during registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: '  Test@Example.COM  ',
        password: 'TestPassword123!'
      })
      .expect(201);

    const user = await User.findOne({
      email: 'test@example.com'
    });

    expect(user).not.toBeNull();
    expect(user.email).toBe('test@example.com');
  });

  test('allows login with normalized email casing', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'normalized@example.com',
        password: 'TestPassword123!'
      })
      .expect(201);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: '  NORMALIZED@EXAMPLE.COM  ',
        password: 'TestPassword123!'
      })
      .expect(200);

    expect(response.body.message).toBe('Login successful!');
    expect(typeof response.body.token).toBe('string');
  });

  test('rejects login with missing credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com'
      })
      .expect(400);

    expect(response.body.error).toBe(
      'Email and password are required.'
    );
  });
});

describe('Protected routes', () => {
  test('rejects scan history without authentication', async () => {
    const response = await request(app)
      .get('/api/scans')
      .expect(401);

    expect(response.body.error).toBe(
      'Authentication required.'
    );
  });

  test('rejects AI analysis without authentication', async () => {
    const response = await request(app)
      .post('/api/ai/analyze')
      .send({
        contractText: 'Test contract'
      })
      .expect(401);

    expect(response.body.error).toBe(
      'Authentication required.'
    );
  });
});

describe('Scan history', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'history@example.com',
        password: 'TestPassword123!'
      })
      .expect(201);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'history@example.com',
        password: 'TestPassword123!'
      })
      .expect(200);

    authToken = loginResponse.body.token;
    userId = loginResponse.body.userId;
  });

  test('returns an empty history for a new user', async () => {
    const response = await request(app)
      .get('/api/scans')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.scans).toEqual([]);
  });

  test('returns only scans belonging to the authenticated user', async () => {
    await ScanResult.create({
      userId,
      sourceUrl: 'https://example.com/terms',
      originalText: 'Example terms',
      darkPatternsFound: [
        {
          category: 'Automatic Renewal',
          explanation: 'The subscription renews automatically.'
        }
      ],
      aiSummary: 'The contract contains an automatic renewal clause.'
    });

    const otherUser = await User.create({
      email: 'other@example.com',
      password: 'hashed-password'
    });

    await ScanResult.create({
      userId: otherUser._id,
      sourceUrl: 'https://other.example.com',
      originalText: 'Other terms',
      darkPatternsFound: [],
      aiSummary: 'Other scan'
    });

    const response = await request(app)
      .get('/api/scans')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.scans).toHaveLength(1);
    expect(response.body.scans[0].sourceUrl).toBe(
      'https://example.com/terms'
    );

    expect(response.body.scans[0].originalText).toBeUndefined();
  });
});

describe('POST /api/ai/analyze validation', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'ai-validation@example.com',
        password: 'TestPassword123!'
      })
      .expect(201);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ai-validation@example.com',
        password: 'TestPassword123!'
      })
      .expect(200);

    authToken = loginResponse.body.token;
  });

  test('rejects a non-string contract', async () => {
    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText: 12345
      })
      .expect(400);

    expect(response.body.error).toBe(
      'Contract text must be a string.'
    );
  });

  test('rejects an empty contract', async () => {
    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText: '   '
      })
      .expect(400);

    expect(response.body.error).toBe(
      'Contract text cannot be empty.'
    );
  });

  test('rejects an oversized contract', async () => {
    const oversizedText = 'A'.repeat(200001);

    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText: oversizedText
      })
      .expect(413);

    expect(response.body.error).toContain(
      '200,000 character limit'
    );
  });

  test('rejects an invalid source URL', async () => {
    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText: 'This is a valid contract.',
        sourceUrl: 'javascript:alert(1)'
      })
      .expect(400);

    expect(response.body.error).toBe(
      'Invalid source URL.'
    );
  });
});