import { jest } from '@jest/globals';
import { createShutdownHandler } from '../config/shutdown.js';

const createExitMock = () => {
  let resolveExit;

  const exitPromise = new Promise((resolve) => {
    resolveExit = resolve;
  });

  const exit = jest.fn((code) => {
    resolveExit(code);
  });

  return { exit, exitPromise };
};

const createLogger = () => ({
  info: jest.fn(),
  error: jest.fn()
});

describe('Graceful shutdown', () => {
  test('closes the server and database before exiting successfully', async () => {
    const server = {
      close: jest.fn((callback) => callback())
    };

    const disconnectDatabase = jest.fn().mockResolvedValue(undefined);
    const logger = createLogger();
    const { exit, exitPromise } = createExitMock();

    const shutdown = createShutdownHandler({
      server,
      disconnectDatabase,
      logger,
      exit
    });

    shutdown('SIGTERM');

    await expect(exitPromise).resolves.toBe(0);

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(disconnectDatabase).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
    expect(logger.info).toHaveBeenCalledWith(
      'MongoDB connection closed.'
    );
  });

  test('exits with an error if the HTTP server fails to close', async () => {
    const closeError = new Error('Server close failed');

    const server = {
      close: jest.fn((callback) => callback(closeError))
    };

    const disconnectDatabase = jest.fn();
    const logger = createLogger();
    const { exit, exitPromise } = createExitMock();

    const shutdown = createShutdownHandler({
      server,
      disconnectDatabase,
      logger,
      exit
    });

    shutdown('SIGTERM');

    await expect(exitPromise).resolves.toBe(1);

    expect(disconnectDatabase).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'HTTP server shutdown failed:',
      closeError
    );
  });

  test('exits with an error if MongoDB disconnect fails', async () => {
    const databaseError = new Error('Database disconnect failed');

    const server = {
      close: jest.fn((callback) => callback())
    };

    const disconnectDatabase = jest.fn().mockRejectedValue(
      databaseError
    );

    const logger = createLogger();
    const { exit, exitPromise } = createExitMock();

    const shutdown = createShutdownHandler({
      server,
      disconnectDatabase,
      logger,
      exit
    });

    shutdown('SIGTERM');

    await expect(exitPromise).resolves.toBe(1);

    expect(logger.error).toHaveBeenCalledWith(
      'MongoDB shutdown failed:',
      databaseError
    );
  });

  test('does not run shutdown twice for repeated signals', async () => {
    const server = {
      close: jest.fn((callback) => callback())
    };

    const disconnectDatabase = jest.fn().mockResolvedValue(undefined);
    const logger = createLogger();
    const { exit, exitPromise } = createExitMock();

    const shutdown = createShutdownHandler({
      server,
      disconnectDatabase,
      logger,
      exit
    });

    shutdown('SIGINT');
    shutdown('SIGTERM');

    await expect(exitPromise).resolves.toBe(0);

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(disconnectDatabase).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });
});