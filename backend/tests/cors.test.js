import request from 'supertest';
import app from '../app.js';

describe('CORS configuration', () => {
  test('allows the configured ClearContract extension origin', async () => {
    const allowedOrigin = process.env.CORS_ALLOWED_ORIGINS;

    const response = await request(app)
      .get('/')
      .set('Origin', allowedOrigin)
      .expect(200);

    expect(
      response.headers['access-control-allow-origin']
    ).toBe(allowedOrigin);
  });

  test('does not allow an unknown origin', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'https://example-attacker.com')
      .expect(200);

    expect(
      response.headers['access-control-allow-origin']
    ).toBeUndefined();
  });
});