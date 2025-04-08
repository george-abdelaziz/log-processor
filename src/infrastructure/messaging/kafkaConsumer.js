const { Kafka, logLevel } = require('kafkajs');
const config = require('../config');
const { logger } = require('../config');
const LogProcessingService = require('../../application/services/LogProcessingService');
const { LogRepository } = require('../database/mongoRepository');

const logRepository = new LogRepository();
const logProcessingService = new LogProcessingService(logRepository);

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  logLevel: logLevel.WARN, 
});

const consumer = kafka.consumer({ groupId: config.kafka.groupId });
let isRunning = false;

const runConsumer = async () => {
  if (isRunning) {
      logger.warn('Kafka consumer is already running.');
      return;
  }
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: false });
    isRunning = true;
    logger.info(`Kafka consumer connected and subscribed to topic: ${config.kafka.topic}`);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        logger.debug('Received message', { topic, partition, offset: message.offset });
        try {
          const rawLogData = JSON.parse(message.value.toString());
          await logProcessingService.processLog(rawLogData);
          logger.info('Successfully processed message', { offset: message.offset });

        } catch (error) {
          logger.error('Error processing Kafka message:', {
            offset: message.offset,
            error: error.message,
          });
        }
      },
    });

    consumer.on(consumer.events.CRASH, async ({ error, payload }) => {
        logger.error('Kafka consumer crashed', { error, payload });
        isRunning = false;
        await stopConsumer(); 
    });

  } catch (error) {
    logger.error('Error starting Kafka consumer:', error);
    isRunning = false;
    throw error;
  }
};

const stopConsumer = async () => {
  try {
    if (isRunning) {
      await consumer.disconnect();
      isRunning = false;
      logger.info('Kafka consumer disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting Kafka consumer:', error);
  }
};

process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: stopping Kafka consumer.')
    await stopConsumer();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: stopping Kafka consumer.')
    await stopConsumer();
    process.exit(0);
});

module.exports = {
  runConsumer,
  stopConsumer,
}; 