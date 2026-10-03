import { validateEnvironment } from '../config/env.js';

describe('Environment validation', () => {
  const originalValues = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(originalValues)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  test('rejects missing required environment variables', () => {
    delete process.env.MONGO_URI;
    delete process.env.JWT_SECRET;
    delete process.env.GEMINI_API_KEY;

    expect(() => validateEnvironment()).toThrow(
      'Missing required environment variables: MONGO_URI, JWT_SECRET, GEMINI_API_KEY'
    );
  });

  test('accepts all required environment variables', () => {
    process.env.MONGO_URI = 'mongodb://test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.GEMINI_API_KEY = 'test-key';

    expect(() => validateEnvironment()).not.toThrow();
  });
});