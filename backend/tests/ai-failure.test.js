import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import User from '../models/User.js';
import ScanResult from '../models/ScanResult.js';

const mockGenerateContent = jest.fn();

const mockModel = {
  generateContent: mockGenerateContent
};

const mockGetGenerativeModel = jest.fn(() => mockModel);

jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel
  }))
}));

const { default: app } = await import('../app.js');

let mongoServer;
let authToken;

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

beforeEach(async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'ai-failure@example.com',
      password: 'TestPassword123!'
    })
    .expect(201);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'ai-failure@example.com',
      password: 'TestPassword123!'
    })
    .expect(200);

  authToken = loginResponse.body.token;

  mockGenerateContent.mockReset();
  mockGetGenerativeModel.mockClear();
});

afterEach(async () => {
  await User.deleteMany({});
  await ScanResult.deleteMany({});

  authToken = null;
});

describe('AI failure handling', () => {
  test('returns 500 when Gemini returns malformed analysis JSON', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'this is not valid JSON'
      }
    });

    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText: 'This is a test contract.'
      })
      .expect(500);

    expect(response.body.error).toBe(
      'Failed to analyze the contract.'
    );

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    const scanCount = await ScanResult.countDocuments();

    expect(scanCount).toBe(0);
  });

  test('retries a temporary Gemini failure and succeeds', async () => {
    const chunkAnalysis = {
      darkPatternsFound: [
        {
          category: 'Automatic Renewal',
          explanation:
            'The subscription renews automatically.'
        }
      ],
      aiSummary:
        'The contract contains automatic renewal.'
    };

    const synthesis = {
      darkPatternsFound: [
        {
          category: 'Automatic Renewal',
          explanation:
            'The subscription renews automatically.'
        }
      ],
      aiSummary:
        'The contract contains automatic renewal.'
    };

    const temporaryError = Object.assign(
      new Error('Gemini temporarily unavailable'),
      { status: 503 }
    );

    mockGenerateContent
      .mockRejectedValueOnce(temporaryError)
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(chunkAnalysis)
        }
      })
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(synthesis)
        }
      });

    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText: 'This is a test contract.'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.analysis).toEqual(
      synthesis
    );

    expect(mockGenerateContent).toHaveBeenCalledTimes(3);

    const scanCount = await ScanResult.countDocuments();

    expect(scanCount).toBe(1);
  });

  test('does not retry a non-retryable Gemini failure', async () => {
    const permanentError = Object.assign(
      new Error('Gemini request rejected'),
      { status: 400 }
    );

    mockGenerateContent.mockRejectedValueOnce(
      permanentError
    );

    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText: 'This is a test contract.'
      })
      .expect(500);

    expect(response.body.error).toBe(
      'Failed to analyze the contract.'
    );

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    const scanCount = await ScanResult.countDocuments();

    expect(scanCount).toBe(0);
  });
});