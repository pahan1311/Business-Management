/**
 * Inquiry Model
 */

const { INQUIRY_STATUS, INQUIRY_TYPES, PRIORITY_LEVELS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const Inquiry = sequelize.define('Inquiry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM(...Object.values(INQUIRY_TYPES)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(INQUIRY_STATUS)),
      allowNull: false,
      defaultValue: INQUIRY_STATUS.OPEN,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(PRIORITY_LEVELS)),
      allowNull: false,
      defaultValue: PRIORITY_LEVELS.MEDIUM,
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  }, {
    tableName: 'inquiries',
    timestamps: false,
    underscored: false,
    hooks: {
      beforeUpdate: (inquiry) => {
        if (inquiry.changed('status')) {
          const now = new Date();
          if (inquiry.status === INQUIRY_STATUS.RESOLVED && !inquiry.resolvedAt) {
            inquiry.resolvedAt = now;
          }
          if (inquiry.status === INQUIRY_STATUS.CLOSED && !inquiry.closedAt) {
            inquiry.closedAt = now;
          }
        }
      }
    }
  });

  // Define associations
  Inquiry.associate = function(models) {
    Inquiry.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });

    Inquiry.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });

    Inquiry.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignee'
    });
  };

  return Inquiry;
};
