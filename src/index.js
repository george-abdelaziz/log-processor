const config = require('./infrastructure/config');
const { logger } = require('./infrastructure/config');
const { connectDB } = require('./infrastructure/database/mongoRepository');
const { connectProducer, disconnectProducer } = require('./infrastructure/messaging/kafkaProducer');
const { runConsumer, stopConsumer } = require('./infrastructure/messaging/kafkaConsumer');
const { startServer } = require('./interfaces/http/server');

async function main() {
  logger.info('Starting User Activity Processor service...');

  let server;

  try {
    await connectDB();
    await connectProducer();
    server = startServer(); 
    await runConsumer();
    logger.info('Service started successfully.');
  } catch (error) {
    logger.error('Failed to start the service:', error);
    await shutdown();
    process.exit(1);
  }
}

async function shutdown() {
    logger.info('Shutting down service...');
    await stopConsumer();
    await disconnectProducer();
    logger.info('Service shutdown complete.');
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  shutdown().then(() => process.exit(1));
});

main(); 