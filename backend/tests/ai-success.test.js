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

beforeEach(async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'ai-success@example.com',
      password: 'TestPassword123!'
    })
    .expect(201);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'ai-success@example.com',
      password: 'TestPassword123!'
    })
    .expect(200);

  authToken = loginResponse.body.token;
  userId = loginResponse.body.userId;

  mockGenerateContent.mockReset();
  mockGetGenerativeModel.mockClear();
});

afterEach(async () => {
  await User.deleteMany({});
  await ScanResult.deleteMany({});

  authToken = null;
  userId = null;
});

describe('Successful AI analysis', () => {
  test('analyzes a multi-chunk contract and saves one scan result', async () => {
    const chunkAnalysis = {
      darkPatternsFound: [
        {
          category: 'Automatic Renewal',
          explanation:
            'The contract automatically renews unless the user cancels before the renewal date.'
        }
      ],
      aiSummary:
        'The contract contains an automatic renewal condition.'
    };

    const secondChunkAnalysis = {
      darkPatternsFound: [
        {
          category: 'Cancellation Barrier',
          explanation:
            'The cancellation process requires the user to take an additional step before the subscription can end.'
        }
      ],
      aiSummary:
        'The cancellation process may make ending the subscription less straightforward.'
    };

    const synthesis = {
      darkPatternsFound: [
        {
          category: 'Automatic Renewal',
          explanation:
            'The subscription renews automatically unless cancelled before the renewal date.'
        },
        {
          category: 'Cancellation Barrier',
          explanation:
            'The cancellation process includes an additional step that may make ending the subscription less straightforward.'
        }
      ],
      aiSummary:
        'The contract includes automatic renewal and a potentially difficult cancellation process.'
    };

    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(chunkAnalysis)
        }
      })
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(secondChunkAnalysis)
        }
      })
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(synthesis)
        }
      });

    const contractText =
      'Automatic renewal clause. '.repeat(460) +
      '\n' +
      'Cancellation procedure clause. '.repeat(100);

    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText,
        sourceUrl: 'https://example.com/terms'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.scanId).toBeDefined();

    expect(response.body.analysis).toEqual(synthesis);

    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1);
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-3.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: expect.any(Object)
      }
    });

    expect(mockGenerateContent).toHaveBeenCalledTimes(3);

    const savedScan = await ScanResult.findById(
      response.body.scanId
    ).lean();

    expect(savedScan).not.toBeNull();

    expect(savedScan.userId.toString()).toBe(
      userId.toString()
    );

    expect(savedScan.sourceUrl).toBe(
      'https://example.com/terms'
    );

    expect(savedScan.originalText).toBe(
      contractText.trim()
    );

    expect(
    savedScan.darkPatternsFound.map(
        ({ category, explanation }) => ({
        category,
        explanation
        })
    )
    ).toEqual(synthesis.darkPatternsFound);

    expect(savedScan.aiSummary).toBe(
      synthesis.aiSummary
    );
  });
});