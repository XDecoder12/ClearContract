import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import authenticateToken from '../middleware/auth.js';

const createResponse = () => {
  const response = {};

  response.status = jest.fn(() => response);
  response.json = jest.fn(() => response);

  return response;
};

describe('JWT authentication middleware', () => {
  test('accepts a valid JWT with a valid userId', () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(req.user).toEqual({
      userId
    });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('rejects a request without an Authorization header', () => {
    const req = {
      headers: {}
    };

    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required.'
    });

    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a malformed Bearer header', () => {
    const req = {
      headers: {
        authorization: 'Basic some-token'
      }
    };

    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required.'
    });

    expect(next).not.toHaveBeenCalled();
  });

  test('rejects an invalid JWT', () => {
    const req = {
      headers: {
        authorization: 'Bearer this-is-not-a-valid-jwt'
      }
    };

    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired authentication token.'
    });

    expect(next).not.toHaveBeenCalled();
  });

  test('rejects an expired JWT', () => {
    const token = jwt.sign(
      {
        userId: new mongoose.Types.ObjectId().toString()
      },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired authentication token.'
    });

    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a JWT signed with the wrong secret', () => {
    const token = jwt.sign(
      {
        userId: new mongoose.Types.ObjectId().toString()
      },
      'wrong-secret',
      { expiresIn: '7d' }
    );

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired authentication token.'
    });

    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a JWT without a userId claim', () => {
    const token = jwt.sign(
      {
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired authentication token.'
    });

    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a JWT with an invalid userId', () => {
    const token = jwt.sign(
      {
        userId: 'not-a-valid-object-id'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired authentication token.'
    });

    expect(next).not.toHaveBeenCalled();
  });
});