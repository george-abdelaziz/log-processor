const { Kafka } = require('kafkajs');
const config = require('../config');
const { logger } = require('../config');

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
});

const producer = kafka.producer();
let isConnected = false;

const connectProducer = async () => {
  try {
    await producer.connect();
    isConnected = true;
    logger.info('Kafka producer connected successfully');
  } catch (error) {
    logger.error('Error connecting Kafka producer:', error);
    isConnected = false;
    throw error;
  }
};

const disconnectProducer = async () => {
  try {
    if (isConnected) {
      await producer.disconnect();
      isConnected = false;
      logger.info('Kafka producer disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting Kafka producer:', error);
  }
};

const sendLogMessage = async (logData) => {
  if (!isConnected) {
    logger.warn('Kafka producer is not connected. Attempting to connect...');
    await connectProducer(); 
    if (!isConnected) {
        throw new Error('Kafka producer is not connected. Cannot send message.');
    }
  }

  try {
    const message = {
      value: JSON.stringify(logData),
    };
    await producer.send({
      topic: config.kafka.topic,
      messages: [message],
    });
    logger.debug('Log message sent to Kafka topic', { topic: config.kafka.topic });
  } catch (error) {
    logger.error('Error sending message to Kafka:', error);
    throw error;
  }
};

process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: disconnecting Kafka producer.')
    await disconnectProducer();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: disconnecting Kafka producer.')
    await disconnectProducer();
    process.exit(0);
});

module.exports = {
  connectProducer,
  disconnectProducer,
  sendLogMessage,
}; 