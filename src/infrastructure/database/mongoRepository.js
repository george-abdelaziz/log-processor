const mongoose = require('mongoose');
const UserActivityLog = require('../../domain/model/UserActivityLog');
const config = require('../config');
const { logger } = require('../config');

const userActivityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  processedAt: { type: Date, index: true },
});

userActivityLogSchema.index({ userId: 1, timestamp: -1 });
userActivityLogSchema.index({ action: 1, timestamp: -1 });

const MongoLogModel = mongoose.model('UserActivityLog', userActivityLogSchema);

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1); 
  }
};

class MongoLogRepository {
  async save(logData) {
    try {
      const logDocument = new MongoLogModel({
          ...logData,
          processedAt: new Date() 
      });
      await logDocument.save();
      logger.debug('Log saved to MongoDB', { logId: logDocument._id });
      return logDocument.toObject(); 
    } catch (error) {
      logger.error('Error saving log to MongoDB:', error);
      throw error; 
    }
  }

  async find({ filters = {}, page = 1, limit = 10, sort = { timestamp: -1 } }) {
    try {
      const skip = (page - 1) * limit;
      const query = MongoLogModel.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const logs = await query.exec();
      const total = await MongoLogModel.countDocuments(filters);

      logger.debug('Logs fetched from MongoDB', { count: logs.length, total, page, limit });

      return {
        data: logs.map(log => log.toObject()),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching logs from MongoDB:', error);
      throw error;
    }
  }
}

module.exports = {
    connectDB,
    LogRepository: MongoLogRepository,
    MongoLogModel 
}; 