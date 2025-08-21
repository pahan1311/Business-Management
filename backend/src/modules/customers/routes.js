const express = require('express');
const { prisma } = require('../../db/prisma');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { zodValidate } = require('../../middlewares/zodValidate');
const { logger } = require('../../config/logger');
const { z } = require('zod');

const router = express.Router();

// Schemas
const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required')
  })
});

const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    zipCode: z.string().min(1).optional(),
    isActive: z.boolean().optional()
  })
});

const getCustomersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    pageSize: z.string().regex(/^\d+$/).transform(Number).optional()
  })
});

// Get all customers
router.get('/', 
  authGuard, 
  rbacGuard(['ADMIN']), 
  zodValidate(getCustomersSchema),
  async (req, res, next) => {
    try {
      const { search, page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
      
      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.customer.count({ where })
      ]);

      res.json({
        customers,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      logger.error('Get customers error:', error);
      next(error);
    }
  }
);

// Create customer
router.post('/',
  authGuard,
  rbacGuard(['ADMIN']),
  zodValidate(createCustomerSchema),
  async (req, res, next) => {
    try {
      // Check if customer already exists
      const existing = await prisma.customer.findUnique({
        where: { email: req.body.email }
      });

      if (existing) {
        return res.status(409).json({
          error: {
            code: 'CUSTOMER_EXISTS',
            message: 'Customer with this email already exists'
          }
        });
      }

      const customer = await prisma.customer.create({
        data: req.body
      });

      logger.info(`Customer created: ${customer.email} by ${req.user.email}`);
      res.status(201).json({ customer });
    } catch (error) {
      logger.error('Create customer error:', error);
      next(error);
    }
  }
);

// Get customer by ID
router.get('/:id',
  authGuard,
  rbacGuard(['ADMIN']),
  async (req, res, next) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: req.params.id },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: { orders: true, inquiries: true }
          }
        }
      });

      if (!customer) {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      res.json({ customer });
    } catch (error) {
      logger.error('Get customer error:', error);
      next(error);
    }
  }
);

// Update customer
router.patch('/:id',
  authGuard,
  rbacGuard(['ADMIN']),
  zodValidate(updateCustomerSchema),
  async (req, res, next) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: req.params.id }
      });

      if (!customer) {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      // Check email uniqueness if email is being updated
      if (req.body.email && req.body.email !== customer.email) {
        const existing = await prisma.customer.findUnique({
          where: { email: req.body.email }
        });

        if (existing) {
          return res.status(409).json({
            error: {
              code: 'EMAIL_EXISTS',
              message: 'Customer with this email already exists'
            }
          });
        }
      }

      const updatedCustomer = await prisma.customer.update({
        where: { id: req.params.id },
        data: req.body
      });

      logger.info(`Customer updated: ${updatedCustomer.email} by ${req.user.email}`);
      res.json({ customer: updatedCustomer });
    } catch (error) {
      logger.error('Update customer error:', error);
      next(error);
    }
  }
);

// Get customer orders
router.get('/:id/orders',
  authGuard,
  rbacGuard(['ADMIN']),
  async (req, res, next) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;

      const customer = await prisma.customer.findUnique({
        where: { id: req.params.id }
      });

      if (!customer) {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { customerId: req.params.id },
          include: {
            items: {
              include: { product: true }
            },
            delivery: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.order.count({
          where: { customerId: req.params.id }
        })
      ]);

      res.json({
        orders,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      logger.error('Get customer orders error:', error);
      next(error);
    }
  }
);

module.exports = router;
