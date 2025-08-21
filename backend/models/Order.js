/**
 * Order Model
 */

const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } = require('../utils/constants');
const { generateOrderNumber } = require('../utils/helpers');

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
      allowNull: false,
      defaultValue: ORDER_STATUS.PENDING,
    },
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
      allowNull: false,
      defaultValue: PAYMENT_STATUS.PENDING,
    },
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_METHODS)),
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
      },
    },
    shippingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
      },
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidAddress(value) {
          const requiredFields = ['street', 'city', 'state', 'zipCode'];
          const hasAllFields = requiredFields.every(field => value && value[field]);
          if (!hasAllFields) {
            throw new Error('Shipping address must include street, city, state, and zipCode');
          }
        }
      }
    },
    billingAddress: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    specialInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    urgency: {
      type: DataTypes.ENUM('normal', 'urgent'),
      allowNull: false,
      defaultValue: 'normal',
    },
    estimatedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    preparingAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    readyAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancellationReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    processedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  }, {
    tableName: 'orders',
    timestamps: false,
    underscored: false,
    // Removed indexes to avoid sync issues with manually created DB
    hooks: {
      beforeCreate: (order) => {
        if (!order.orderNumber) {
          order.orderNumber = generateOrderNumber();
        }
        // Calculate total amount
        order.totalAmount = (
          parseFloat(order.subtotal || 0) +
          parseFloat(order.taxAmount || 0) +
          parseFloat(order.shippingAmount || 0) -
          parseFloat(order.discountAmount || 0)
        ).toFixed(2);
      },
      beforeUpdate: (order) => {
        // Update status timestamps
        if (order.changed('status')) {
          const now = new Date();
          switch (order.status) {
            case ORDER_STATUS.CONFIRMED:
              if (!order.confirmedAt) order.confirmedAt = now;
              break;
            case ORDER_STATUS.PREPARING:
              if (!order.preparingAt) order.preparingAt = now;
              break;
            case ORDER_STATUS.READY:
              if (!order.readyAt) order.readyAt = now;
              break;
            case ORDER_STATUS.OUT_FOR_DELIVERY:
              if (!order.shippedAt) order.shippedAt = now;
              break;
            case ORDER_STATUS.DELIVERED:
              if (!order.deliveredAt) {
                order.deliveredAt = now;
                order.actualDeliveryDate = now;
              }
              break;
            case ORDER_STATUS.CANCELLED:
              if (!order.cancelledAt) order.cancelledAt = now;
              break;
          }
        }
        
        // Recalculate total if amounts changed
        if (order.changed(['subtotal', 'taxAmount', 'shippingAmount', 'discountAmount'])) {
          order.totalAmount = (
            parseFloat(order.subtotal || 0) +
            parseFloat(order.taxAmount || 0) +
            parseFloat(order.shippingAmount || 0) -
            parseFloat(order.discountAmount || 0)
          ).toFixed(2);
        }
      }
    },
    scopes: {
      withItems: {
        include: [{
          association: 'orderItems',
          include: [{
            association: 'product',
            attributes: ['id', 'name', 'sku', 'images']
          }]
        }]
      },
      withCustomer: {
        include: [{
          association: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }]
      },
      byStatus: (status) => ({
        where: { status }
      }),
      byCustomer: (customerId) => ({
        where: { customerId }
      }),
      recent: {
        order: [['created_at', 'DESC']],
        limit: 50
      },
      pending: {
        where: {
          status: {
            [sequelize.Sequelize.Op.in]: [
              ORDER_STATUS.PENDING,
              ORDER_STATUS.CONFIRMED,
              ORDER_STATUS.PREPARING
            ]
          }
        }
      },
      completed: {
        where: {
          status: ORDER_STATUS.DELIVERED
        }
      }
    }
  });

  // Instance methods
  Order.prototype.canBeCancelled = function() {
    const cancellableStatuses = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];
    return cancellableStatuses.includes(this.status);
  };

  Order.prototype.canBeModified = function() {
    const modifiableStatuses = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];
    return modifiableStatuses.includes(this.status);
  };

  Order.prototype.isDelivered = function() {
    return this.status === ORDER_STATUS.DELIVERED;
  };

  Order.prototype.isCancelled = function() {
    return this.status === ORDER_STATUS.CANCELLED;
  };

  Order.prototype.isPaid = function() {
    return this.paymentStatus === PAYMENT_STATUS.COMPLETED;
  };

  Order.prototype.getFullShippingAddress = function() {
    if (!this.shippingAddress) return '';
    const { street, city, state, zipCode, country } = this.shippingAddress;
    return `${street}, ${city}, ${state} ${zipCode}${country ? ', ' + country : ''}`;
  };

  Order.prototype.getOrderAge = function() {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      return diffHours === 0 ? 'Less than an hour' : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  Order.prototype.updateStatus = async function(newStatus, notes = null, userId = null) {
    this.status = newStatus;
    if (notes) this.notes = notes;
    if (userId) this.processedBy = userId;
    return this.save();
  };

  Order.prototype.cancel = async function(reason, userId = null) {
    if (!this.canBeCancelled()) {
      throw new Error('Order cannot be cancelled in current status');
    }
    
    this.status = ORDER_STATUS.CANCELLED;
    this.cancellationReason = reason;
    this.cancelledAt = new Date();
    if (userId) this.processedBy = userId;
    
    return this.save();
  };

  Order.prototype.calculateDeliveryTime = function() {
    if (!this.deliveredAt || !this.createdAt) return null;
    
    const deliveryTime = new Date(this.deliveredAt) - new Date(this.createdAt);
    return Math.floor(deliveryTime / (1000 * 60 * 60)); // hours
  };

  // Class methods
  Order.findByOrderNumber = function(orderNumber) {
    return this.findOne({ where: { orderNumber } });
  };

  Order.findByCustomer = function(customerId) {
    return this.scope('byCustomer', customerId).findAll({
      order: [['created_at', 'DESC']]
    });
  };

  Order.findByStatus = function(status) {
    return this.scope('byStatus', status).findAll();
  };

  Order.findPendingOrders = function() {
    return this.scope('pending').findAll({
      order: [['created_at', 'ASC']]
    });
  };

  Order.findCompletedOrders = function() {
    return this.scope('completed').findAll({
      order: [['delivered_at', 'DESC']]
    });
  };

  Order.getOrderStats = async function(startDate = null, endDate = null) {
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      };
    }

    const stats = await this.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'averageOrderValue'],
        [
          sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = '${ORDER_STATUS.DELIVERED}' THEN 1 END`)),
          'deliveredOrders'
        ],
        [
          sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = '${ORDER_STATUS.CANCELLED}' THEN 1 END`)),
          'cancelledOrders'
        ]
      ],
      raw: true,
    });
    
    return stats[0];
  };

  // Define associations
  Order.associate = function(models) {
    // Order belongs to Customer
    Order.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });

    // Order has many OrderItems
    Order.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'orderItems'
    });

    // Order has one Delivery
    Order.hasOne(models.Delivery, {
      foreignKey: 'orderId',
      as: 'delivery'
    });

    // Order has many QR codes
    Order.hasMany(models.QRCode, {
      foreignKey: 'referenceId',
      as: 'qrCodes',
      constraints: false,
      scope: {
        type: 'order'
      }
    });

    // Order processed by User
    Order.belongsTo(models.User, {
      foreignKey: 'processedBy',
      as: 'processor'
    });

    // Order has many inquiries
    Order.hasMany(models.Inquiry, {
      foreignKey: 'orderId',
      as: 'inquiries'
    });
  };

  return Order;
};
