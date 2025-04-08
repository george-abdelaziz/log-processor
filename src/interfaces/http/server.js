const express = require('express');
const config = require('../../infrastructure/config');
const { logger } = require('../../infrastructure/config');
const logRoutes = require('./routes/logRoutes');

const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

app.use('/logs', logRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
  });

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const startServer = () => {
  const server = app.listen(config.port, () => {
    logger.info(`HTTP server listening on port ${config.port}`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} signal received: closing HTTP server.`);
    server.close(() => {
      logger.info('HTTP server closed.');
    });
    setTimeout(() => {
        logger.warn('Server shutdown timed out, forcing exit.');
        process.exit(1);
    }, 10000); 
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
};

module.exports = { startServer, app }; 
