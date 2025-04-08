const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

module.exports = {
  port: process.env.PORT || 3000,
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'user-activity-processor',
    groupId: process.env.KAFKA_GROUP_ID || 'user-activity-group',
    topic: process.env.KAFKA_TOPIC || 'user-activity-logs',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/user-activity',
  },
  logger,
}; 