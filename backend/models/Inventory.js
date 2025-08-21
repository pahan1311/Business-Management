/**
 * Inventory Model
 */

const { INVENTORY_ACTIONS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define('Inventory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.ENUM(...Object.values(INVENTORY_ACTIONS)),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previousStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    newStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    performedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    batchNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    supplier: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  }, {
    tableName: 'inventory_movements',
    timestamps: false,
    underscored: false,
    // Removed indexes to avoid sync issues with manually created DB
  });

  // Define associations
  Inventory.associate = function(models) {
    Inventory.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });

    Inventory.belongsTo(models.User, {
      foreignKey: 'performedBy',
      as: 'performer'
    });
  };

  return Inventory;
};
