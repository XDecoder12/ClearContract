import request from 'supertest';
import app from '../app.js';

describe('HTTP security headers', () => {
  test('sets X-Content-Type-Options to nosniff', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(
      response.headers['x-content-type-options']
    ).toBe('nosniff');
  });

  test('does not expose the Express X-Powered-By header', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(
      response.headers['x-powered-by']
    ).toBeUndefined();
  });
});