const { LogRepository } = require('../../../infrastructure/database/mongoRepository');
const { logger } = require('../../../infrastructure/config');

const logRepository = new LogRepository();

const getLogs = async (req, res, next) => {
  try {
    const { userId, action, startDate, endDate, ipAddress, page, limit, sortBy, sortOrder } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    if (pageNum <= 0) return res.status(400).json({ message: 'Page number must be positive.' });
    if (limitNum <= 0 || limitNum > 100) return res.status(400).json({ message: 'Limit must be between 1 and 100.' });

    const filters = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (ipAddress) filters.ipAddress = ipAddress; 
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) {
          const start = new Date(startDate);
          if (isNaN(start)) return res.status(400).json({ message: 'Invalid startDate format.'});
          filters.timestamp.$gte = start;
      }
      if (endDate) {
          const end = new Date(endDate);
          if (isNaN(end)) return res.status(400).json({ message: 'Invalid endDate format.'});
          filters.timestamp.$lte = end;
      }
    }

    const sort = {};
    const validSortFields = ['timestamp', 'userId', 'action', 'processedAt'];
    if (sortBy && validSortFields.includes(sortBy)) {
        sort[sortBy] = (sortOrder === 'asc' || sortOrder === '1') ? 1 : -1;
    } else {
        sort.timestamp = -1; 
    }

    logger.debug('Fetching logs with parameters', { filters, page: pageNum, limit: limitNum, sort });
    const result = await logRepository.find({
      filters,
      page: pageNum,
      limit: limitNum,
      sort,
    });

    res.status(200).json(result);

  } catch (error) {
    logger.error('Error fetching logs via API:', error);
    next(error);
  }
};

module.exports = {
  getLogs,
}; 