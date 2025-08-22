const jwt = require('jsonwebtoken');
const { prisma } = require('../db/prisma');
const { logger } = require('../config/logger');

const registerSocketEvents = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return next(new Error('Invalid or inactive user'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.user = user;
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.email} (${socket.user.role})`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);
    
    // Join user to role-based room
    socket.join(`role:${socket.userRole}`);

    // Handle joining order rooms
    socket.on('join-order', (orderId) => {
      socket.join(`order:${orderId}`);
      logger.debug(`User ${socket.user.email} joined order room: ${orderId}`);
    });

    // Handle leaving order rooms
    socket.on('leave-order', (orderId) => {
      socket.leave(`order:${orderId}`);
      logger.debug(`User ${socket.user.email} left order room: ${orderId}`);
    });

    // Handle joining delivery rooms
    socket.on('join-delivery', (deliveryId) => {
      socket.join(`delivery:${deliveryId}`);
      logger.debug(`User ${socket.user.email} joined delivery room: ${deliveryId}`);
    });

    // Handle leaving delivery rooms
    socket.on('leave-delivery', (deliveryId) => {
      socket.leave(`delivery:${deliveryId}`);
      logger.debug(`User ${socket.user.email} left delivery room: ${deliveryId}`);
    });
    
    // Handle joining inquiry rooms
    socket.on('join-inquiry', (inquiryId) => {
      socket.join(`inquiry:${inquiryId}`);
      logger.debug(`User ${socket.user.email} joined inquiry room: ${inquiryId}`);
    });

    // Handle leaving inquiry rooms
    socket.on('leave-inquiry', (inquiryId) => {
      socket.leave(`inquiry:${inquiryId}`);
      logger.debug(`User ${socket.user.email} left inquiry room: ${inquiryId}`);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.user.email} (${reason})`);
    });

    // Send initial connection confirmation
    socket.emit('connected', {
      message: 'Successfully connected to CIDMS',
      user: {
        id: socket.user.id,
        name: socket.user.name,
        role: socket.user.role
      }
    });
  });
};

module.exports = { registerSocketEvents };
