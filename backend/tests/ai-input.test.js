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

const mockAnalysis = {
  darkPatternsFound: [],
  aiSummary: 'No meaningful consumer risks were identified.'
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

beforeEach(async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'ai-input@example.com',
      password: 'TestPassword123!'
    })
    .expect(201);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'ai-input@example.com',
      password: 'TestPassword123!'
    })
    .expect(200);

  authToken = loginResponse.body.token;

  mockGenerateContent.mockReset();
  mockGetGenerativeModel.mockClear();

  mockGenerateContent.mockResolvedValue({
    response: {
      text: () => JSON.stringify(mockAnalysis)
    }
  });
});

afterEach(async () => {
  await User.deleteMany({});
  await ScanResult.deleteMany({});

  authToken = null;
});

describe('AI contract input handling', () => {
  test('accepts a contract exactly at the 200,000 character limit', async () => {
    const contractText = 'A'.repeat(200000);

    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.scanId).toBeDefined();

    expect(mockGenerateContent.mock.calls.length)
      .toBeGreaterThan(1);

    const savedScan = await ScanResult.findById(
      response.body.scanId
    ).lean();

    expect(savedScan).not.toBeNull();
    expect(savedScan.originalText).toBe(contractText);
  });

  test('removes null bytes from contract text before analysis and storage', async () => {
    const contractText =
      'First clause\0\r\nSecond clause\0\r\nThird clause';

    const expectedText =
      'First clause\nSecond clause\nThird clause';

    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText
      })
      .expect(200);

    expect(response.body.success).toBe(true);

    const savedScan = await ScanResult.findById(
      response.body.scanId
    ).lean();

    expect(savedScan).not.toBeNull();
    expect(savedScan.originalText).toBe(expectedText);

    const firstGeminiPrompt =
      mockGenerateContent.mock.calls[0][0];

    expect(firstGeminiPrompt).toContain(
      'First clause\nSecond clause\nThird clause'
    );

    expect(firstGeminiPrompt).not.toContain('\0');
    expect(firstGeminiPrompt).not.toContain('\r');
  });

  test('normalizes old-style carriage returns before analysis and storage', async () => {
    const contractText =
      'First clause\rSecond clause\rThird clause';

    const expectedText =
      'First clause\nSecond clause\nThird clause';

    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractText
      })
      .expect(200);

    expect(response.body.success).toBe(true);

    const savedScan = await ScanResult.findById(
      response.body.scanId
    ).lean();

    expect(savedScan).not.toBeNull();
    expect(savedScan.originalText).toBe(expectedText);

    const firstGeminiPrompt =
      mockGenerateContent.mock.calls[0][0];

    expect(firstGeminiPrompt).toContain(
      'First clause\nSecond clause\nThird clause'
    );

    expect(firstGeminiPrompt).not.toContain('\r');
  });
});