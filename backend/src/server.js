require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { logger } = require('./config/logger');
const { prisma } = require('./db/prisma');
const { registerSocketEvents } = require('./sockets/registerEvents');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Register socket events
registerSocketEvents(io);

// Make io available in app context
app.set('io', io);

// Graceful shutdown
const shutdown = async () => {
  logger.info('Starting graceful shutdown...');
  
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
    
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
