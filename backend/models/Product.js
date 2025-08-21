/**
 * Product Model
 */

const { USER_STATUS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [2, 200],
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        notEmpty: true,
      },
    },
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 0,
      },
    },
    maxStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pcs',
    },
    weight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidDimensions(value) {
          if (value) {
            const validFields = ['length', 'width', 'height'];
            const hasValidFields = Object.keys(value).every(key => validFields.includes(key));
            if (!hasValidFields) {
              throw new Error('Dimensions must only include length, width, and height');
            }
          }
        }
      }
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Images must be an array');
          }
        }
      }
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Tags must be an array');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'discontinued'),
      allowNull: false,
      defaultValue: 'active',
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    seoTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    supplier: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    batchNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    totalSold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 5,
      },
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  }, {
    tableName: 'products',
    timestamps: false,
    underscored: false,
    // Removed indexes to avoid sync issues with manually created DB
    hooks: {
      beforeValidate: (product) => {
        // Generate SKU if not provided
        if (!product.sku && product.name) {
          const timestamp = Date.now().toString().slice(-6);
          product.sku = product.name
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 10)
            .toUpperCase() + timestamp;
        }
      },
      afterUpdate: (product) => {
        // Update stock status based on quantity
        if (product.changed('stockQuantity')) {
          if (product.stockQuantity === 0) {
            product.status = 'inactive';
          } else if (product.status === 'inactive' && product.stockQuantity > 0) {
            product.status = 'active';
          }
        }
      }
    },
    scopes: {
      active: {
        where: {
          status: 'active'
        }
      },
      featured: {
        where: {
          featured: true,
          status: 'active'
        }
      },
      inStock: {
        where: {
          stockQuantity: {
            [sequelize.Sequelize.Op.gt]: 0
          }
        }
      },
      lowStock: {
        where: sequelize.where(
          sequelize.col('stock_quantity'),
          '<=',
          sequelize.col('min_stock_level')
        )
      },
      byCategory: (category) => ({
        where: {
          category: category
        }
      }),
      priceRange: (minPrice, maxPrice) => ({
        where: {
          price: {
            [sequelize.Sequelize.Op.between]: [minPrice, maxPrice]
          }
        }
      })
    }
  });

  // Instance methods
  Product.prototype.isInStock = function() {
    return this.stockQuantity > 0;
  };

  Product.prototype.isLowStock = function() {
    return this.stockQuantity <= this.minStockLevel;
  };

  Product.prototype.isOutOfStock = function() {
    return this.stockQuantity === 0;
  };

  Product.prototype.updateStock = function(quantity, type = 'adjustment') {
    this.stockQuantity = quantity;
    return this.save();
  };

  Product.prototype.addStock = function(quantity) {
    this.stockQuantity += quantity;
    return this.save();
  };

  Product.prototype.reduceStock = function(quantity) {
    if (this.stockQuantity < quantity) {
      throw new Error('Insufficient stock');
    }
    this.stockQuantity -= quantity;
    this.totalSold += quantity;
    return this.save();
  };

  Product.prototype.calculateMargin = function() {
    if (!this.cost || this.cost === 0) return null;
    return ((this.price - this.cost) / this.cost * 100).toFixed(2);
  };

  Product.prototype.isOnSale = function() {
    return this.compareAtPrice && this.compareAtPrice > this.price;
  };

  Product.prototype.getDiscountPercentage = function() {
    if (!this.isOnSale()) return 0;
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  };

  Product.prototype.getPrimaryImage = function() {
    return this.images && this.images.length > 0 ? this.images[0] : null;
  };

  Product.prototype.isExpired = function() {
    if (!this.expirationDate) return false;
    return new Date() > new Date(this.expirationDate);
  };

  Product.prototype.isExpiringSoon = function(days = 30) {
    if (!this.expirationDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + days);
    return new Date(this.expirationDate) <= thirtyDaysFromNow;
  };

  // Class methods
  Product.findBySku = function(sku) {
    return this.findOne({ where: { sku } });
  };

  Product.findByBarcode = function(barcode) {
    return this.findOne({ where: { barcode } });
  };

  Product.findActiveProducts = function() {
    return this.scope('active').findAll();
  };

  Product.findFeaturedProducts = function() {
    return this.scope('featured').findAll();
  };

  Product.findLowStockProducts = function() {
    return this.scope('lowStock').findAll();
  };

  Product.findByCategory = function(category) {
    return this.scope('byCategory', category).findAll();
  };

  Product.findByPriceRange = function(minPrice, maxPrice) {
    return this.scope('priceRange', minPrice, maxPrice).findAll();
  };

  Product.searchProducts = function(searchTerm) {
    return this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { name: { [sequelize.Sequelize.Op.like]: `%${searchTerm}%` } },
          { description: { [sequelize.Sequelize.Op.like]: `%${searchTerm}%` } },
          { sku: { [sequelize.Sequelize.Op.like]: `%${searchTerm}%` } },
          { category: { [sequelize.Sequelize.Op.like]: `%${searchTerm}%` } }
        ]
      }
    });
  };

  Product.getInventoryReport = async function() {
    const stats = await this.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalProducts'],
        [sequelize.fn('SUM', sequelize.col('stock_quantity')), 'totalStock'],
        [sequelize.fn('SUM', sequelize.col('total_sold')), 'totalSold'],
        [sequelize.fn('AVG', sequelize.col('price')), 'averagePrice'],
        [
          sequelize.fn('COUNT', sequelize.literal('CASE WHEN stock_quantity <= min_stock_level THEN 1 END')),
          'lowStockCount'
        ],
        [
          sequelize.fn('COUNT', sequelize.literal('CASE WHEN stock_quantity = 0 THEN 1 END')),
          'outOfStockCount'
        ]
      ],
      raw: true,
    });
    
    return stats[0];
  };

  // Define associations
  Product.associate = function(models) {
    // Product has many inventory movements
    Product.hasMany(models.Inventory, {
      foreignKey: 'productId',
      as: 'inventoryMovements'
    });

    // Product has many order items
    Product.hasMany(models.OrderItem, {
      foreignKey: 'productId',
      as: 'orderItems'
    });

    // Product has many QR codes
    Product.hasMany(models.QRCode, {
      foreignKey: 'referenceId',
      as: 'qrCodes',
      constraints: false,
      scope: {
        type: 'product'
      }
    });
  };

  return Product;
};
