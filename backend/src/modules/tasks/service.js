const { prisma } = require('../../db/prisma');
const { logger } = require('../../config/logger');
const { SocketEmitter } = require('../../sockets/emitters');

class TaskService {
  constructor() {
    this.socketEmitter = new SocketEmitter();
  }

  async createTask(data, createdById) {
    try {
      // Validate assignee if provided
      if (data.assignedToId) {
        const assignee = await prisma.user.findFirst({
          where: {
            id: data.assignedToId,
            role: { in: ['ADMIN', 'STAFF'] },
            isActive: true
          }
        });

        if (!assignee) {
          throw new Error('Invalid assignee');
        }
      }

      const task = await prisma.task.create({
        data: {
          ...data,
          createdById
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Emit socket event to assignee if assigned
      if (task.assignedToId) {
        this.socketEmitter.emitToUser(task.assignedToId, 'task:assigned', {
          task: {
            id: task.id,
            title: task.title,
            priority: task.priority,
            dueDate: task.dueDate
          }
        });
      }

      return task;
    } catch (error) {
      logger.error('Error creating task:', error);
      throw error;
    }
  }

  async getTasks(filters = {}) {
    const { 
      status, 
      type, 
      priority, 
      assignedToId, 
      createdById,
      search,
      page = 1, 
      pageSize = 10 
    } = filters;
    
    const skip = (page - 1) * pageSize;
    
    try {
      const where = {};
      
      if (status) where.status = status;
      if (type) where.type = type;
      if (priority) where.priority = Number(priority);
      if (assignedToId) where.assignedToId = assignedToId;
      if (createdById) where.createdById = createdById;
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: pageSize
        }),
        prisma.task.count({ where })
      ]);

      return {
        tasks,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error('Error getting tasks:', error);
      throw error;
    }
  }

  async getTaskById(id) {
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      return task;
    } catch (error) {
      logger.error(`Error getting task ${id}:`, error);
      throw error;
    }
  }

  async updateTaskStatus(id, status, userId) {
    try {
      const task = await prisma.task.findUnique({
        where: { id }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Check if the user is assigned to this task or is an admin
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (user.role !== 'ADMIN' && task.assignedToId !== userId) {
        throw new Error('Unauthorized to update this task');
      }

      const updateData = { status };
      
      // If task is being completed, set completedAt
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Notify the task creator if different from updater
      if (task.createdById !== userId) {
        this.socketEmitter.emitToUser(task.createdById, 'task:status-update', {
          task: {
            id: updatedTask.id,
            title: updatedTask.title,
            status: updatedTask.status
          }
        });
      }

      return updatedTask;
    } catch (error) {
      logger.error(`Error updating task status ${id}:`, error);
      throw error;
    }
  }

  async assignTask(id, assignedToId, userId) {
    try {
      const task = await prisma.task.findUnique({
        where: { id }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Verify the assignee exists and is staff or admin
      const assignee = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          role: { in: ['ADMIN', 'STAFF'] },
          isActive: true
        }
      });

      if (!assignee) {
        throw new Error('Invalid assignee');
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: { assignedToId },
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

      // Notify the new assignee
      this.socketEmitter.emitToUser(assignedToId, 'task:assigned', {
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          priority: updatedTask.priority,
          dueDate: updatedTask.dueDate
        }
      });

      return updatedTask;
    } catch (error) {
      logger.error(`Error assigning task ${id}:`, error);
      throw error;
    }
  }
}

module.exports = { TaskService };
