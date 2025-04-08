class UserActivityLog {
  constructor({ userId, action, timestamp, details, ipAddress }) {
    if (!userId || !action || !timestamp) {
      throw new Error('Missing required fields: userId, action, timestamp');
    }
    this.userId = userId;
    this.action = action;
    this.timestamp = new Date(timestamp);
    this.details = details || {}; 
    this.ipAddress = ipAddress; 
    this.processedAt = null; 
  }

  markAsProcessed() {
    this.processedAt = new Date();
  }
}

module.exports = UserActivityLog; 