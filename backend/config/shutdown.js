export const createShutdownHandler = ({
  server,
  disconnectDatabase,
  logger = console,
  exit = (code) => process.exit(code)
}) => {
  let isShuttingDown = false;

  return (signal) => {
    // Prevent multiple signals from triggering shutdown twice.
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    logger.info(
      `Received ${signal}. Starting graceful shutdown.`
    );

    // Stop accepting new connections and allow active requests
    // to finish before closing the database connection.
    server.close(async (serverError) => {
      if (serverError) {
        logger.error(
          'HTTP server shutdown failed:',
          serverError
        );

        exit(1);
        return;
      }

      try {
        await disconnectDatabase();

        logger.info('MongoDB connection closed.');
        exit(0);
      } catch (error) {
        logger.error(
          'MongoDB shutdown failed:',
          error
        );

        exit(1);
      }
    });
  };
};