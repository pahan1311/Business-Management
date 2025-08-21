'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Products table
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      minStockLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      maxStockLevel: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'piece',
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'discontinued'),
        allowNull: false,
        defaultValue: 'active',
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('products', ['sku']);
    await queryInterface.addIndex('products', ['category']);
    await queryInterface.addIndex('products', ['status']);
    await queryInterface.addIndex('products', ['stock']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('products');
  }
};
