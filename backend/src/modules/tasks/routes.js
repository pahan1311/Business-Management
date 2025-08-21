const express = require('express');
const { prisma } = require('../../db/prisma');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { logger } = require('../../config/logger');

const router = express.Router();

// Get tasks
router.get('/',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      const { assignedTo, status, page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
      
      const where = {};
      if (assignedTo) where.assignedToId = assignedTo;
      if (status) where.status = status;
      
      // Staff can only see their own tasks
      if (req.user.role === 'STAFF') {
        where.assignedToId = req.user.id;
      }

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            assignedTo: true,
            createdBy: true
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: pageSize
        }),
        prisma.task.count({ where })
      ]);

      res.json({
        tasks,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      logger.error('Get tasks error:', error);
      next(error);
    }
  }
);

// Create task
router.post('/',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      const task = await prisma.task.create({
        data: {
          ...req.body,
          createdById: req.user.id
        },
        include: {
          assignedTo: true,
          createdBy: true
        }
      });

      logger.info(`Task created: ${task.title} by ${req.user.email}`);
      res.status(201).json({ task });
    } catch (error) {
      logger.error('Create task error:', error);
      next(error);
    }
  }
);

// Update task
router.patch('/:id',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: req.params.id }
      });

      if (!task) {
        return res.status(404).json({
          error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
        });
      }

      // Staff can only update tasks assigned to them
      if (req.user.role === 'STAFF' && task.assignedToId !== req.user.id) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Cannot update this task' }
        });
      }

      const updatedTask = await prisma.task.update({
        where: { id: req.params.id },
        data: {
          ...req.body,
          ...(req.body.status === 'COMPLETED' && { completedAt: new Date() })
        },
        include: {
          assignedTo: true,
          createdBy: true
        }
      });

      res.json({ task: updatedTask });
    } catch (error) {
      logger.error('Update task error:', error);
      next(error);
    }
  }
);

module.exports = router;
