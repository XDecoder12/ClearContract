import request from 'supertest';
import app from '../app.js';

describe('AI analysis rate limiting', () => {
  test('blocks the 21st analysis request from the same IP', async () => {
    const responses = [];

    for (let i = 0; i < 20; i += 1) {
      const response = await request(app)
        .post('/api/ai/analyze')
        .send({
          contractText: 'Test contract'
        });

      responses.push(response);
    }

    // The first 20 requests should reach the authentication
    // middleware and fail there because no token was provided.
    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.body.error).toBe(
        'Authentication required.'
      );
    }

    // The 21st request should be blocked by the rate limiter.
    const limitedResponse = await request(app)
      .post('/api/ai/analyze')
      .send({
        contractText: 'Test contract'
      })
      .expect(429);

    expect(limitedResponse.body.error).toBe(
      'Too many analysis requests. Please try again later.'
    );
  });
});