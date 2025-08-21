/**
 * Customer Model
 */

const { USER_STATUS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: [5, 255],
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        len: [10, 20],
      },
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString().split('T')[0], // Must be before today
      },
    },
    address: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidAddress(value) {
          const requiredFields = ['street', 'city', 'state', 'zipCode'];
          const hasAllFields = requiredFields.every(field => value && value[field]);
          if (!hasAllFields) {
            throw new Error('Address must include street, city, state, and zipCode');
          }
        }
      }
    },
    emergencyContact: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidEmergencyContact(value) {
          if (value) {
            if (!value.name || !value.phone) {
              throw new Error('Emergency contact must include name and phone');
            }
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(USER_STATUS)),
      allowNull: false,
      defaultValue: USER_STATUS.ACTIVE,
    },
    loyaltyPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        preferredDeliveryTime: 'any',
      },
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    lastOrderDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    registrationSource: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'website',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  }, {
    tableName: 'customers',
    timestamps: false,
    underscored: false,
    // Removed indexes to avoid sync issues with manually created DB
    hooks: {
      beforeCreate: (customer) => {
        // Generate initial loyalty points if first order
        if (customer.totalOrders === 0) {
          customer.loyaltyPoints = 100; // Welcome bonus
        }
      },
      afterUpdate: (customer) => {
        // Update loyalty points based on total spent
        if (customer.changed('totalSpent')) {
          const pointsRatio = 0.01; // 1 point per $1 spent
          customer.loyaltyPoints = Math.floor(customer.totalSpent * pointsRatio);
        }
      }
    },
    scopes: {
      active: {
        where: {
          status: USER_STATUS.ACTIVE
        }
      },
      withOrders: {
        include: [{
          association: 'orders',
          attributes: ['id', 'orderNumber', 'status', 'totalAmount', 'createdAt']
        }]
      },
      byLocation: (city, state) => ({
        where: {
          address: {
            city: city,
            ...(state && { state: state })
          }
        }
      }),
      highValue: {
        where: {
          totalSpent: {
            [sequelize.Sequelize.Op.gte]: 1000
          }
        }
      }
    }
  });

  // Instance methods
  Customer.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  Customer.prototype.getAge = function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  Customer.prototype.getFullAddress = function() {
    if (!this.address) return '';
    const { street, city, state, zipCode, country } = this.address;
    return `${street}, ${city}, ${state} ${zipCode}${country ? ', ' + country : ''}`;
  };

  Customer.prototype.addLoyaltyPoints = function(points) {
    this.loyaltyPoints += points;
    return this.save();
  };

  Customer.prototype.redeemLoyaltyPoints = function(points) {
    if (this.loyaltyPoints < points) {
      throw new Error('Insufficient loyalty points');
    }
    this.loyaltyPoints -= points;
    return this.save();
  };

  Customer.prototype.updateOrderStats = async function(orderAmount) {
    this.totalOrders += 1;
    this.totalSpent += orderAmount;
    this.lastOrderDate = new Date();
    return this.save();
  };

  Customer.prototype.isActive = function() {
    return this.status === USER_STATUS.ACTIVE;
  };

  Customer.prototype.isHighValueCustomer = function() {
    return this.totalSpent >= 1000;
  };

  Customer.prototype.getCustomerTier = function() {
    if (this.totalSpent >= 5000) return 'platinum';
    if (this.totalSpent >= 2000) return 'gold';
    if (this.totalSpent >= 500) return 'silver';
    return 'bronze';
  };

  // Class methods
  Customer.findByEmail = function(email) {
    return this.findOne({ where: { email } });
  };

  Customer.findActiveCustomers = function() {
    return this.scope('active').findAll();
  };

  Customer.findByLocation = function(city, state) {
    return this.scope('byLocation', city, state).findAll();
  };

  Customer.findHighValueCustomers = function() {
    return this.scope('highValue').findAll();
  };

  Customer.getCustomerStats = async function() {
    const stats = await this.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCustomers'],
        [sequelize.fn('SUM', sequelize.col('total_spent')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('total_spent')), 'averageSpent'],
        [sequelize.fn('SUM', sequelize.col('total_orders')), 'totalOrders'],
      ],
      raw: true,
    });
    
    return stats[0];
  };

  // Define associations
  Customer.associate = function(models) {
    // Customer belongs to User
    Customer.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    // Customer has many orders
    Customer.hasMany(models.Order, {
      foreignKey: 'customerId',
      as: 'orders'
    });

    // Customer has many inquiries
    Customer.hasMany(models.Inquiry, {
      foreignKey: 'customerId',
      as: 'inquiries'
    });

    // Customer has many QR code scans
    Customer.hasMany(models.QRCode, {
      foreignKey: 'scannedBy',
      as: 'scannedQRCodes',
      constraints: false
    });

    // Customer has many notifications
    Customer.hasMany(models.Notification, {
      foreignKey: 'userId',
      as: 'notifications',
      constraints: false
    });
  };

  return Customer;
};
