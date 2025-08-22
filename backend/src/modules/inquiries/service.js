const { prisma } = require('../../db/prisma');
const { SocketEmitter } = require('../../sockets/emitters');
const express = require('express');
const app = express();
const { logger } = require('../../config/logger');

class InquiryService {
  constructor() {
    this.socketEmitter = app.get('io') ? new SocketEmitter(app.get('io')) : null;
  }
  async getInquiries(filters = {}, user) {
    const { 
      status, 
      type,
      priority,
      assignedTo, 
      customer,
      search, 
      page = 1, 
      pageSize = 10 
    } = filters;
    
    const skip = (page - 1) * pageSize;
    
    const where = {};
    
    // Filter by status
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    // Filter by type
    if (type && type !== 'all') {
      where.type = type;
    }
    
    // Filter by priority
    if (priority && priority !== 'all') {
      // Convert priority string to numeric value
      const priorityMap = { 'high': 3, 'normal': 2, 'low': 1 };
      where.priority = priorityMap[priority] || 2;
    }
    
    // Filter by assigned staff member
    if (assignedTo) {
      where.assignedToId = assignedTo;
    }
    
    // Filter by customer
    if (customer) {
      where.customerId = customer;
    }
    
    // Customers can only see their own inquiries
    if (user && user.role === 'CUSTOMER') {
      where.customerId = user.id;
    }
    
    // Search functionality
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          replies: {
            where: user?.role === 'CUSTOMER' ? { isInternal: false } : {},
            orderBy: {
              createdAt: 'asc'
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            take: 5 // Only get the most recent replies
          },
          _count: {
            select: {
              replies: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: Number(pageSize)
      }),
      prisma.inquiry.count({ where })
    ]);

    return {
      inquiries,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async getInquiryById(id, user) {
    const where = { id };
    
    // Customers can only see their own inquiries
    if (user && user.role === 'CUSTOMER') {
      where.customerId = user.id;
    }

    const inquiry = await prisma.inquiry.findFirst({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        replies: {
          where: user?.role === 'CUSTOMER' ? { isInternal: false } : {},
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // If a staff member is viewing, mark as in-progress if it's currently open
    if (user && (user.role === 'ADMIN' || user.role === 'STAFF') && inquiry.status === 'OPEN') {
      await prisma.inquiry.update({
        where: { id },
        data: { 
          status: 'IN_PROGRESS',
          assignedToId: inquiry.assignedToId || user.id // Auto-assign if not already assigned
        }
      });
    }

    return inquiry;
  }

  async createInquiry(data, user) {
    const { customerId, ...inquiryData } = data;
    
    // If customer is creating inquiry, use their ID
    const actualCustomerId = user?.role === 'CUSTOMER' ? user.id : customerId;
    
    if (!actualCustomerId) {
      throw new Error('Customer ID is required');
    }

    // Check if customer exists
    const customerExists = await prisma.customer.findUnique({ 
      where: { id: actualCustomerId } 
    });

    if (!customerExists) {
      throw new Error('Customer not found');
    }

    // Convert priority string to numeric value
    const priorityMap = { 'high': 3, 'normal': 2, 'low': 1 };
    const priorityValue = priorityMap[inquiryData.priority] || 2;

    // Create the inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        ...inquiryData,
        priority: priorityValue,
        customerId: actualCustomerId,
        // Auto-assign to admin for high priority inquiries
        ...(priorityValue === 3 && {
          assignedToId: await this.getRandomAdminId()
        })
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Add system message as first reply
    await prisma.inquiryReply.create({
      data: {
        inquiryId: inquiry.id,
        content: `Inquiry received. Reference number: ${inquiry.id}`,
        isInternal: false
      }
    });

    // Emit socket event for new inquiry
    if (this.socketEmitter) {
      try {
        this.socketEmitter.inquiryReceived(
          inquiry.id, 
          inquiry.customerId, 
          inquiry.subject, 
          inquiryData.priority || 'normal'
        );
        logger.info(`Socket event 'inquiry.received' emitted for inquiry ${inquiry.id}`);
      } catch (error) {
        logger.error('Error emitting socket event for new inquiry:', error);
      }
    }

    return inquiry;
  }

  async updateInquiry(id, data, user) {
    const inquiry = await prisma.inquiry.findUnique({ 
      where: { id },
      include: {
        customer: true
      }
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // Customers can only update their own inquiries
    if (user?.role === 'CUSTOMER' && inquiry.customerId !== user.id) {
      throw new Error('Unauthorized');
    }

    // Convert priority string to numeric value if provided
    let updatedData = { ...data };
    if (data.priority) {
      const priorityMap = { 'high': 3, 'normal': 2, 'low': 1 };
      updatedData.priority = priorityMap[data.priority] || 2;
    }

    // Status changes should be logged as replies
    let statusChanged = false;
    if (data.status && data.status.toUpperCase() !== inquiry.status) {
      statusChanged = true;
      const statusMessage = `Status changed from ${inquiry.status} to ${data.status.toUpperCase()}`;
      
      // Create a system message for status change
      await prisma.inquiryReply.create({
        data: {
          inquiryId: id,
          userId: user?.id,
          content: statusMessage,
          isInternal: true
        }
      });
    }

    // Assignment changes should be logged
    if (data.assignedToId && data.assignedToId !== inquiry.assignedToId) {
      const newAssignee = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { name: true }
      });
      
      if (newAssignee) {
        const assignMessage = `Inquiry assigned to ${newAssignee.name}`;
        await prisma.inquiryReply.create({
          data: {
            inquiryId: id,
            userId: user?.id,
            content: assignMessage,
            isInternal: true
          }
        });
      }
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        ...updatedData,
        status: data.status ? data.status.toUpperCase() : undefined,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Emit socket events
    if (this.socketEmitter) {
      try {
        // Status change event
        if (statusChanged) {
          this.socketEmitter.inquiryStatusChanged(
            id,
            updatedInquiry.status,
            updatedInquiry.customer.id
          );
          logger.info(`Socket event 'inquiry.status.changed' emitted for inquiry ${id}`);
        }
        
        // Assignment change event
        if (data.assignedToId && data.assignedToId !== inquiry.assignedToId) {
          this.socketEmitter.inquiryAssigned(
            id,
            data.assignedToId
          );
          logger.info(`Socket event 'inquiry.assigned' emitted for inquiry ${id}`);
        }
      } catch (error) {
        logger.error('Error emitting socket event for inquiry update:', error);
      }
    }

    return updatedInquiry;
  }

  async deleteInquiry(id, user) {
    const inquiry = await prisma.inquiry.findUnique({ 
      where: { id } 
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // Only admins can delete inquiries, or customers their own
    if (user.role === 'CUSTOMER' && inquiry.customerId !== user.id) {
      throw new Error('Unauthorized');
    }

    await prisma.inquiry.delete({ where: { id } });
    
    return { success: true };
  }

  async addReply(inquiryId, replyData, user) {
    const inquiry = await prisma.inquiry.findUnique({ 
      where: { id: inquiryId } 
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // Customers can only reply to their own inquiries
    if (user.role === 'CUSTOMER' && inquiry.customerId !== user.id) {
      throw new Error('Unauthorized');
    }

    // Customers cannot create internal replies
    if (user.role === 'CUSTOMER' && replyData.isInternal) {
      replyData.isInternal = false;
    }

    const reply = await prisma.inquiryReply.create({
      data: {
        inquiryId,
        userId: user.id,
        content: replyData.content,
        isInternal: replyData.isInternal || false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    let statusChanged = false;
    let newStatus = null;

    // Update the inquiry status when a staff member replies
    if (user.role !== 'CUSTOMER' && inquiry.status === 'OPEN') {
      statusChanged = true;
      newStatus = 'IN_PROGRESS';
      
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { 
          status: newStatus,
          assignedToId: inquiry.assignedToId || user.id // Auto-assign if not already assigned
        }
      });
    }

    // Update the inquiry when a customer replies to a resolved inquiry
    if (user.role === 'CUSTOMER' && inquiry.status === 'RESOLVED') {
      statusChanged = true;
      newStatus = 'IN_PROGRESS';
      
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { status: newStatus }
      });
    }

    // Emit socket events
    if (this.socketEmitter) {
      try {
        // New reply added event
        this.socketEmitter.inquiryReplyAdded(
          inquiryId,
          reply.id,
          user.id,
          inquiry.customerId,
          replyData.isInternal || false
        );
        logger.info(`Socket event 'inquiry.reply.added' emitted for inquiry ${inquiryId}`);
        
        // Status changed event, if applicable
        if (statusChanged && newStatus) {
          this.socketEmitter.inquiryStatusChanged(
            inquiryId,
            newStatus,
            inquiry.customerId
          );
          logger.info(`Socket event 'inquiry.status.changed' emitted for inquiry ${inquiryId}`);
        }
      } catch (error) {
        logger.error('Error emitting socket event for inquiry reply:', error);
      }
    }

    return reply;
  }

  async getReplies(inquiryId, user) {
    const inquiry = await prisma.inquiry.findUnique({ 
      where: { id: inquiryId } 
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // Customers can only see replies to their own inquiries
    if (user.role === 'CUSTOMER' && inquiry.customerId !== user.id) {
      throw new Error('Unauthorized');
    }

    const where = { inquiryId };
    
    // Customers cannot see internal replies
    if (user.role === 'CUSTOMER') {
      where.isInternal = false;
    }

    const replies = await prisma.inquiryReply.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return replies;
  }

  // Helper to get a random admin for auto-assignment of high priority inquiries
  async getRandomAdminId() {
    const admins = await prisma.user.findMany({
      where: { 
        role: 'ADMIN',
        isActive: true 
      },
      select: { id: true }
    });
    
    if (admins.length === 0) return null;
    
    // Pick a random admin
    const randomIndex = Math.floor(Math.random() * admins.length);
    return admins[randomIndex].id;
  }
}

module.exports = { InquiryService };
