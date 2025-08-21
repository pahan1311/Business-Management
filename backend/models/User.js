/**
 * User Model
 */

const bcrypt = require('bcryptjs');
const { USER_ROLES, USER_STATUS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255],
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [10, 20],
      },
    },
    role: {
      type: DataTypes.ENUM(...Object.values(USER_ROLES)),
      allowNull: false,
      defaultValue: USER_ROLES.CUSTOMER,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(USER_STATUS)),
      allowNull: false,
      defaultValue: USER_STATUS.ACTIVE,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    address: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidAddress(value) {
          if (value) {
            const requiredFields = ['street', 'city', 'state', 'zipCode'];
            const hasAllFields = requiredFields.every(field => value[field]);
            if (!hasAllFields) {
              throw new Error('Address must include street, city, state, and zipCode');
            }
          }
        }
      }
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  }, {
    tableName: 'users',
    timestamps: false,
    underscored: false,
    // Removed indexes to avoid sync issues with manually created DB
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
    defaultScope: {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires']
      }
    },
    scopes: {
      withPassword: {
        attributes: {}
      },
      active: {
        where: {
          status: USER_STATUS.ACTIVE
        }
      },
      byRole: (role) => ({
        where: {
          role: role
        }
      })
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  User.prototype.toSafeObject = function() {
    const user = this.toJSON();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    return user;
  };

  User.prototype.isAdmin = function() {
    return this.role === USER_ROLES.ADMIN;
  };

  User.prototype.isStaff = function() {
    return this.role === USER_ROLES.STAFF;
  };

  User.prototype.isCustomer = function() {
    return this.role === USER_ROLES.CUSTOMER;
  };

  User.prototype.isDelivery = function() {
    return this.role === USER_ROLES.DELIVERY;
  };

  User.prototype.isActive = function() {
    return this.status === USER_STATUS.ACTIVE;
  };

  // Class methods
  User.findByEmail = function(email) {
    return this.scope('withPassword').findOne({ where: { email } });
  };

  User.findActiveUsers = function() {
    return this.scope('active').findAll();
  };

  User.findByRole = function(role) {
    return this.scope('byRole', role).findAll();
  };

  // Define associations
  User.associate = function(models) {
    // User has one Customer profile (for customer role)
    User.hasOne(models.Customer, {
      foreignKey: 'userId',
      as: 'customerProfile',
      constraints: false,
      scope: {
        role: USER_ROLES.CUSTOMER
      }
    });

    // User can have many orders (as customer)
    User.hasMany(models.Order, {
      foreignKey: 'customerId',
      as: 'orders',
      constraints: false
    });

    // User can have many deliveries (as delivery person)
    User.hasMany(models.Delivery, {
      foreignKey: 'deliveryPersonId',
      as: 'deliveries',
      constraints: false
    });

    // User can have many inquiries
    User.hasMany(models.Inquiry, {
      foreignKey: 'customerId',
      as: 'inquiries',
      constraints: false
    });

    // User can scan many QR codes
    User.hasMany(models.QRCode, {
      foreignKey: 'scannedBy',
      as: 'scannedQRCodes',
      constraints: false
    });

    // User can receive many notifications
    User.hasMany(models.Notification, {
      foreignKey: 'userId',
      as: 'notifications',
      constraints: false
    });

    // User created by another user (admin creates staff, etc.)
    User.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      constraints: false
    });

    User.hasMany(models.User, {
      foreignKey: 'createdBy',
      as: 'createdUsers',
      constraints: false
    });
  };

  return User;
};
