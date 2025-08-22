const { logger } = require('../config/logger');

class SocketEmitter {
  constructor(io) {
    this.io = io;
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data);
    logger.debug(`Emitted ${event} to user:${userId}`, data);
  }

  // Emit to all users with specific role
  emitToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
    logger.debug(`Emitted ${event} to role:${role}`, data);
  }

  // Emit to order room (users following specific order)
  emitToOrder(orderId, event, data) {
    this.io.to(`order:${orderId}`).emit(event, data);
    logger.debug(`Emitted ${event} to order:${orderId}`, data);
  }

  // Emit to delivery room (users following specific delivery)
  emitToDelivery(deliveryId, event, data) {
    this.io.to(`delivery:${deliveryId}`).emit(event, data);
    logger.debug(`Emitted ${event} to delivery:${deliveryId}`, data);
  }
  
  // Emit to inquiry room (users following specific inquiry)
  emitToInquiry(inquiryId, event, data) {
    this.io.to(`inquiry:${inquiryId}`).emit(event, data);
    logger.debug(`Emitted ${event} to inquiry:${inquiryId}`, data);
  }

  // Emit to all connected users
  emitToAll(event, data) {
    this.io.emit(event, data);
    logger.debug(`Emitted ${event} to all users`, data);
  }

  // Order status change events
  orderStatusChanged(orderId, status, customerId = null) {
    const data = { orderId, status, timestamp: new Date().toISOString() };
    
    // Notify order room
    this.emitToOrder(orderId, 'order.status.changed', data);
    
    // Notify customer if provided
    if (customerId) {
      this.emitToUser(customerId, 'order.status.changed', data);
    }
    
    // Notify admins and staff
    this.emitToRole('ADMIN', 'order.status.changed', data);
    this.emitToRole('STAFF', 'order.status.changed', data);
  }

  // Delivery status change events
  deliveryStatusChanged(deliveryId, status, orderId = null, assignedToId = null) {
    const data = { deliveryId, status, orderId, timestamp: new Date().toISOString() };
    
    // Notify delivery room
    this.emitToDelivery(deliveryId, 'delivery.status.changed', data);
    
    // Notify assigned delivery person
    if (assignedToId) {
      this.emitToUser(assignedToId, 'delivery.status.changed', data);
    }
    
    // Notify order room if orderId provided
    if (orderId) {
      this.emitToOrder(orderId, 'delivery.status.changed', data);
    }
    
    // Notify admins
    this.emitToRole('ADMIN', 'delivery.status.changed', data);
  }

  // Inventory low stock alert
  inventoryLowStock(productId, productName, onHand, reorderPoint) {
    const data = { 
      productId, 
      productName, 
      onHand, 
      reorderPoint,
      timestamp: new Date().toISOString() 
    };
    
    // Notify admins and staff
    this.emitToRole('ADMIN', 'inventory.low_stock', data);
    this.emitToRole('STAFF', 'inventory.low_stock', data);
  }

  // New task assignment
  taskAssigned(taskId, assignedToId, taskTitle, priority) {
    const data = { 
      taskId, 
      taskTitle, 
      priority,
      timestamp: new Date().toISOString() 
    };
    
    // Notify assigned user
    this.emitToUser(assignedToId, 'task.assigned', data);
    
    // Notify admins
    this.emitToRole('ADMIN', 'task.assigned', data);
  }

  // New inquiry received
  inquiryReceived(inquiryId, customerId, subject, priority) {
    const data = { 
      inquiryId, 
      customerId, 
      subject, 
      priority,
      timestamp: new Date().toISOString() 
    };
    
    // Notify inquiry room
    this.emitToInquiry(inquiryId, 'inquiry.received', data);
    
    // Notify admins and available staff
    this.emitToRole('ADMIN', 'inquiry.received', data);
    this.emitToRole('STAFF', 'inquiry.received', data);
  }
  
  // Inquiry status changed
  inquiryStatusChanged(inquiryId, status, customerId = null) {
    const data = { 
      inquiryId, 
      status,
      timestamp: new Date().toISOString() 
    };
    
    // Notify inquiry room
    this.emitToInquiry(inquiryId, 'inquiry.status.changed', data);
    
    // Notify admins and staff
    this.emitToRole('ADMIN', 'inquiry.status.changed', data);
    this.emitToRole('STAFF', 'inquiry.status.changed', data);
    
    // Notify customer if provided
    if (customerId) {
      this.emitToUser(customerId, 'inquiry.status.changed', data);
    }
  }
  
  // New reply added to an inquiry
  inquiryReplyAdded(inquiryId, replyId, authorId, customerId = null, isInternal = false) {
    const data = { 
      inquiryId, 
      replyId,
      isInternal,
      timestamp: new Date().toISOString() 
    };
    
    // Notify inquiry room
    this.emitToInquiry(inquiryId, 'inquiry.reply.added', data);
    
    // Notify admins and staff
    this.emitToRole('ADMIN', 'inquiry.reply.added', data);
    this.emitToRole('STAFF', 'inquiry.reply.added', data);
    
    // Notify customer if not an internal reply and customerId is provided
    if (!isInternal && customerId) {
      this.emitToUser(customerId, 'inquiry.reply.added', data);
    }
  }
  
  // Inquiry assigned
  inquiryAssigned(inquiryId, assignedToId) {
    const data = { 
      inquiryId,
      assignedToId,
      timestamp: new Date().toISOString() 
    };
    
    // Notify inquiry room
    this.emitToInquiry(inquiryId, 'inquiry.assigned', data);
    
    // Notify the assigned staff member
    this.emitToUser(assignedToId, 'inquiry.assigned', data);
    
    // Notify admins
    this.emitToRole('ADMIN', 'inquiry.assigned', data);
  }
}

module.exports = { SocketEmitter };
