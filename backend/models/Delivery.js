/**
 * Delivery Model
 */

const { DELIVERY_STATUS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const Delivery = sequelize.define('Delivery', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    deliveryPersonId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DELIVERY_STATUS)),
      allowNull: false,
      defaultValue: DELIVERY_STATUS.ASSIGNED,
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pickedUpAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    inTransitAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estimatedDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveryAddress: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    specialInstructions: {
      type: DataTypes.TEXT,
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
    distance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
  }, {
    tableName: 'deliveries',
    timestamps: false,
    underscored: false,
    hooks: {
      beforeUpdate: (delivery) => {
        if (delivery.changed('status')) {
          const now = new Date();
          switch (delivery.status) {
            case DELIVERY_STATUS.ASSIGNED:
              if (!delivery.assignedAt) delivery.assignedAt = now;
              break;
            case DELIVERY_STATUS.PICKED_UP:
              if (!delivery.pickedUpAt) delivery.pickedUpAt = now;
              break;
            case DELIVERY_STATUS.IN_TRANSIT:
              if (!delivery.inTransitAt) delivery.inTransitAt = now;
              break;
            case DELIVERY_STATUS.DELIVERED:
              if (!delivery.deliveredAt) {
                delivery.deliveredAt = now;
                delivery.actualDeliveryTime = now;
              }
              break;
          }
        }
      }
    }
  });

  // Define associations
  Delivery.associate = function(models) {
    Delivery.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });

    Delivery.belongsTo(models.User, {
      foreignKey: 'deliveryPersonId',
      as: 'deliveryPerson'
    });

    Delivery.hasMany(models.QRCode, {
      foreignKey: 'referenceId',
      as: 'qrCodes',
      constraints: false,
      scope: {
        type: 'delivery'
      }
    });
  };

  return Delivery;
};
