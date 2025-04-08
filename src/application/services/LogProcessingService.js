const UserActivityLog = require('../../domain/model/UserActivityLog');
const { logger } = require('../../infrastructure/config');

class LogProcessingService {
  constructor(logRepository) {
    if (!logRepository) {
      throw new Error('LogRepository is required for LogProcessingService');
    }
    this.logRepository = logRepository;
  }

  async processLog(rawLogData) {
    try {
      if (!rawLogData || typeof rawLogData !== 'object') {
          throw new Error('Invalid log data format: expected an object.');
      }

      const log = new UserActivityLog(rawLogData);

      const savedLog = await this.logRepository.save(log); 

      logger.info('Log processed and saved successfully', { logId: savedLog._id });
      return savedLog;

    } catch (error) {
      logger.error('Error processing log:', {
          rawData: rawLogData, 
          error: error.message,
      });
      throw error;
    }
  }
}

module.exports = LogProcessingService; 