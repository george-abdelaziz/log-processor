const express = require('express');
const logController = require('../controllers/logController');

const router = express.Router();

router.get('/', logController.getLogs);

const { sendLogMessage, connectProducer } = require('../../../infrastructure/messaging/kafkaProducer');
const { logger } = require('../../../infrastructure/config');

router.post('/', async (req, res, next) => {
    try {
        await connectProducer(); 

        const logData = req.body;
        if (!logData || !logData.userId || !logData.action) {
            return res.status(400).json({ message: 'Missing required fields: userId, action' });
        }
        if (!logData.timestamp) {
            logData.timestamp = new Date().toISOString();
        }

        await sendLogMessage(logData);
        logger.info('Log submitted via API and sent to Kafka', logData);
        res.status(202).json({ message: 'Log accepted for processing.' });
    } catch (error) {
        logger.error('Error submitting log via API:', error);
        next(error);
    }
});

module.exports = router; 