const { prisma } = require('../../db/prisma');
const { logger } = require('../../config/logger');
const { SocketEmitter } = require('../../sockets/emitters');

class DeliveryService {
  constructor() {
    this.socketEmitter = new SocketEmitter();
  }

  async getDeliveryById(id, options = {}) {
    try {
      const { includeHistory = false } = options;
      
      const delivery = await prisma.delivery.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              },
              items: {
                include: {
                  product: {
                    select: {
                      name: true,
                      sku: true
                    }
                  }
                }
              }
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          issues: true,
          ...(includeHistory ? {
            statusEvents: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          } : {})
        }
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      return delivery;
    } catch (error) {
      logger.error(`Error getting delivery ${id}:`, error);
      throw error;
    }
  }

  async updateDeliveryStatus(id, data, user) {
    const { status, notes, location } = data;

    try {
      return await prisma.$transaction(async (tx) => {
        // Get current delivery
        const delivery = await tx.delivery.findUnique({
          where: { id },
          include: {
            order: true
          }
        });

        if (!delivery) {
          throw new Error('Delivery not found');
        }

        // Update timestamps based on status
        const updateData = { status };
        
        if (status === 'PICKED_UP') {
          updateData.pickedUpAt = new Date();
        } else if (status === 'DELIVERED') {
          updateData.deliveredAt = new Date();
        }

        // Update delivery status
        const updatedDelivery = await tx.delivery.update({
          where: { id },
          data: updateData,
          include: {
            order: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        // Record status event
        await tx.deliveryStatusEvent.create({
          data: {
            deliveryId: id,
            status,
            notes,
            location
          }
        });

        // Update order status if needed
        if (status === 'DELIVERED' && delivery.order) {
          await tx.order.update({
            where: { id: delivery.order.id },
            data: { status: 'DELIVERED' }
          });

          // Record order status event
          await tx.orderStatusEvent.create({
            data: {
              orderId: delivery.order.id,
              status: 'DELIVERED',
              notes: `Delivered by ${user.name}`
            }
          });
        }

        // Emit socket events
        this.socketEmitter.emitToAdmins('delivery:status-update', {
          delivery: {
            id: updatedDelivery.id,
            status: updatedDelivery.status,
            orderId: updatedDelivery.orderId
          }
        });

        if (updatedDelivery.order?.customer) {
          this.socketEmitter.emitToUser(updatedDelivery.order.customer.id, 'delivery:status-update', {
            delivery: {
              id: updatedDelivery.id,
              status: updatedDelivery.status,
              orderId: updatedDelivery.orderId
            }
          });
        }

        return updatedDelivery;
      });
    } catch (error) {
      logger.error(`Error updating delivery status ${id}:`, error);
      throw error;
    }
  }

  async reportDeliveryIssue(id, data) {
    const { description } = data;

    try {
      const delivery = await prisma.delivery.findUnique({
        where: { id }
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      const issue = await prisma.deliveryIssue.create({
        data: {
          deliveryId: id,
          description,
          isResolved: false
        }
      });

      // Emit socket event
      this.socketEmitter.emitToAdmins('delivery:issue-reported', {
        deliveryId: id,
        issue
      });

      return issue;
    } catch (error) {
      logger.error(`Error reporting delivery issue ${id}:`, error);
      throw error;
    }
  }

  async resolveDeliveryIssue(issueId) {
    try {
      const issue = await prisma.deliveryIssue.update({
        where: { id: issueId },
        data: { isResolved: true },
        include: { delivery: true }
      });

      // Emit socket event
      this.socketEmitter.emitToAdmins('delivery:issue-resolved', {
        issueId,
        deliveryId: issue.delivery.id
      });

      return issue;
    } catch (error) {
      logger.error(`Error resolving delivery issue ${issueId}:`, error);
      throw error;
    }
  }

  async assignDelivery(id, assignedToId) {
    try {
      // Verify the delivery exists
      const delivery = await prisma.delivery.findUnique({
        where: { id }
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      // Verify the user exists and is a delivery person
      const user = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          role: 'DELIVERY',
          isActive: true
        }
      });

      if (!user) {
        throw new Error('Invalid delivery personnel');
      }

      const updatedDelivery = await prisma.delivery.update({
        where: { id },
        data: { 
          assignedToId,
          status: 'ASSIGNED' 
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Record status event
      await prisma.deliveryStatusEvent.create({
        data: {
          deliveryId: id,
          status: 'ASSIGNED',
          notes: `Assigned to ${user.name}`
        }
      });

      // Emit socket event to the assigned delivery person
      this.socketEmitter.emitToUser(assignedToId, 'delivery:assigned', {
        delivery: {
          id: updatedDelivery.id,
          orderId: updatedDelivery.orderId,
          status: updatedDelivery.status
        }
      });

      return updatedDelivery;
    } catch (error) {
      logger.error(`Error assigning delivery ${id}:`, error);
      throw error;
    }
  }
}

module.exports = { DeliveryService };
