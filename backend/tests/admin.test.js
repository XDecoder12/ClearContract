import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
});