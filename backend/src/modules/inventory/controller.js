const { InventoryService } = require('./service');
const { logger } = require('../../config/logger');

const inventoryService = new InventoryService();

class InventoryController {
  async getProducts(req, res, next) {
    try {
      // This is a basic implementation already in routes.js,
      // but would be moved here in a proper controller implementation
      const { search, page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
      
      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: pageSize
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        products,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      logger.error('Get products error:', error);
      next(error);
    }
  }

  async updateProductStock(req, res, next) {
    try {
      const { id } = req.params;
      const movement = req.body;

      const updatedProduct = await inventoryService.updateProductStock(id, movement);
      
      res.json({ product: updatedProduct });
    } catch (error) {
      logger.error('Update product stock error:', error);
      
      if (error.message === 'Product not found') {
        return res.status(404).json({
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found'
          }
        });
      }
      
      if (error.message === 'Insufficient stock' || 
          error.message === 'Insufficient stock to reserve' || 
          error.message === 'Insufficient reserved stock to release') {
        return res.status(400).json({
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: error.message
          }
        });
      }
      
      next(error);
    }
  }

  async getStockMovements(req, res, next) {
    try {
      const { productId } = req.params;
      const filters = req.query;

      const result = await inventoryService.getStockMovements(productId, filters);
      
      res.json(result);
    } catch (error) {
      logger.error('Get stock movements error:', error);
      next(error);
    }
  }

  async checkLowStock(req, res, next) {
    try {
      const lowStockProducts = await inventoryService.checkLowStockLevels();
      
      res.json({ 
        lowStock: lowStockProducts,
        count: lowStockProducts.length
      });
    } catch (error) {
      logger.error('Check low stock error:', error);
      next(error);
    }
  }
}

module.exports = { InventoryController };
