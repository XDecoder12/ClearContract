
import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import User from '../models/User.js';
import ScanResult from '../models/ScanResult.js';

// Mock Gemini API calls.
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
  // Register a test user.
  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'ai-success@example.com',
      password: 'TestPassword123!'
    })
    .expect(201);

  // Authenticate the test user.
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
  // TEST 1: Existing multi-chunk analysis behavior.
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

    // Two contract chunks followed by one synthesis response.
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

    // Legacy response format remains supported.
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

  // TEST 2: Enhanced risk classification and evidence persistence.
  test('saves and returns risk levels with supporting evidence', async () => {
    const contractText =
      'The membership automatically renews unless cancelled.';

    const analysis = {
      overallRiskLevel: 'MEDIUM',
      aiSummary:
        'The contract contains an automatic renewal clause.',
      darkPatternsFound: [
        {
          category: 'Automatic Renewal',
          severity: 'MEDIUM',
          explanation:
            'The membership continues unless the customer cancels.',
          evidence:
            'The membership automatically renews unless cancelled.'
        }
      ]
    };

    // One chunk analysis followed by synthesis.
    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(analysis)
        }
      })
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(analysis)
        }
      });

    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ contractText })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.scanId).toBeDefined();

    expect(response.body.analysis).toEqual(analysis);

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);

    const savedScan = await ScanResult.findById(
      response.body.scanId
    ).lean();

    expect(savedScan).not.toBeNull();

    expect(savedScan.overallRiskLevel).toBe('MEDIUM');

    expect(savedScan.aiSummary).toBe(
      analysis.aiSummary
    );

    expect(savedScan.darkPatternsFound).toHaveLength(1);

    expect(savedScan.darkPatternsFound[0].category).toBe(
      'Automatic Renewal'
    );

    expect(savedScan.darkPatternsFound[0].severity).toBe(
      'MEDIUM'
    );

    expect(savedScan.darkPatternsFound[0].explanation).toBe(
      analysis.darkPatternsFound[0].explanation
    );

    expect(savedScan.darkPatternsFound[0].evidence).toBe(
      analysis.darkPatternsFound[0].evidence
    );

    expect(savedScan.originalText).toBe(contractText);
  });

  // TEST 3: Accept evidence when only whitespace differs.
  test('accepts supporting evidence with normalized whitespace', async () => {
    const contractText =
      'The subscription automatically renews\n' +
      'on a monthly basis unless cancelled.';

    const analysis = {
      overallRiskLevel: 'MEDIUM',
      aiSummary:
        'The subscription renews automatically.',
      darkPatternsFound: [
        {
          category: 'Automatic Renewal',
          severity: 'MEDIUM',
          explanation:
            'The customer must cancel to prevent renewal.',
          evidence:
            'The subscription automatically renews on a monthly basis unless cancelled.'
        }
      ]
    };

    // Gemini may replace a newline with a space in its quotation.
    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(analysis)
        }
      })
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(analysis)
        }
      });

    const response = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ contractText })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.scanId).toBeDefined();

    expect(response.body.analysis.overallRiskLevel).toBe(
      'MEDIUM'
    );

    expect(
      response.body.analysis.darkPatternsFound[0].evidence
    ).toBe(analysis.darkPatternsFound[0].evidence);

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);

    const savedScan = await ScanResult.findById(
      response.body.scanId
    ).lean();

    expect(savedScan).not.toBeNull();

    expect(savedScan.overallRiskLevel).toBe('MEDIUM');

    // Save Gemini's evidence as returned.
    // Do not compare it directly with the original multiline text.
    expect(savedScan.darkPatternsFound[0].evidence).toBe(
      analysis.darkPatternsFound[0].evidence
    );

    // Preserve the original contract separately.
    expect(savedScan.originalText).toBe(contractText);
  });
});
