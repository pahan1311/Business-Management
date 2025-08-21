'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Deliveries table
    await queryInterface.createTable('deliveries', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      deliveryPersonId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      trackingNumber: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned'),
        allowNull: false,
        defaultValue: 'pending',
      },
      scheduledDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      estimatedDelivery: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      dispatchedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      actualDeliveryDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deliveryAddress: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      recipientName: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal',
      },
      proof: {
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
    await queryInterface.addIndex('deliveries', ['orderId']);
    await queryInterface.addIndex('deliveries', ['deliveryPersonId']);
    await queryInterface.addIndex('deliveries', ['trackingNumber']);
    await queryInterface.addIndex('deliveries', ['status']);
    await queryInterface.addIndex('deliveries', ['scheduledDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('deliveries');
  }
};
