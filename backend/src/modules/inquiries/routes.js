const express = require('express');
const { prisma } = require('../../db/prisma');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { logger } = require('../../config/logger');

const router = express.Router();

// Get inquiries
router.get('/',
  authGuard,
  rbacGuard(['ADMIN', 'CUSTOMER']),
  async (req, res, next) => {
    try {
      const { status, assignedTo, page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
      
      const where = {};
      if (status) where.status = status;
      if (assignedTo) where.assignedToId = assignedTo;
      
      // Customers can only see their own inquiries
      if (req.user.role === 'CUSTOMER') {
        where.customerId = req.user.id;
      }

      const [inquiries, total] = await Promise.all([
        prisma.inquiry.findMany({
          where,
          include: {
            customer: true,
            assignedTo: true
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: pageSize
        }),
        prisma.inquiry.count({ where })
      ]);

      res.json({
        inquiries,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      logger.error('Get inquiries error:', error);
      next(error);
    }
  }
);

// Create inquiry
router.post('/',
  authGuard,
  rbacGuard(['ADMIN', 'CUSTOMER']),
  async (req, res, next) => {
    try {
      const inquiry = await prisma.inquiry.create({
        data: {
          ...req.body,
          customerId: req.user.role === 'CUSTOMER' ? req.user.id : req.body.customerId
        },
        include: {
          customer: true
        }
      });

      logger.info(`Inquiry created: ${inquiry.subject} by ${req.user.email}`);
      res.status(201).json({ inquiry });
    } catch (error) {
      logger.error('Create inquiry error:', error);
      next(error);
    }
  }
);

module.exports = router;
