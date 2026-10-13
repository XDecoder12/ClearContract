import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';

let mongoServer;

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

describe('GET /health', () => {
  test('reports healthy when MongoDB is connected', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      database: 'connected'
    });
  });

  test('reports unavailable when MongoDB is disconnected', async () => {
    await mongoose.disconnect();

    const response = await request(app)
      .get('/health')
      .expect(503);

    expect(response.body).toEqual({
      status: 'unavailable',
      database: 'disconnected'
    });
  });
});