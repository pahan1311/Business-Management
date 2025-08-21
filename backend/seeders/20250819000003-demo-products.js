'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('products', [
      {
        name: 'Laptop Computer',
        description: 'High-performance laptop for business and gaming',
        sku: 'LAPTOP001',
        category: 'Electronics',
        price: 999.99,
        stock: 50,
        minStockLevel: 10,
        maxStockLevel: 100,
        unit: 'piece',
        status: 'active',
        images: JSON.stringify([
          'laptop1.jpg',
          'laptop2.jpg'
        ]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking',
        sku: 'MOUSE001',
        category: 'Electronics',
        price: 29.99,
        stock: 200,
        minStockLevel: 50,
        maxStockLevel: 500,
        unit: 'piece',
        status: 'active',
        images: JSON.stringify([
          'mouse1.jpg'
        ]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Office Chair',
        description: 'Comfortable ergonomic office chair',
        sku: 'CHAIR001',
        category: 'Furniture',
        price: 199.99,
        stock: 25,
        minStockLevel: 5,
        maxStockLevel: 50,
        unit: 'piece',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Desk Lamp',
        description: 'LED desk lamp with adjustable brightness',
        sku: 'LAMP001',
        category: 'Furniture',
        price: 49.99,
        stock: 75,
        minStockLevel: 15,
        maxStockLevel: 150,
        unit: 'piece',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Water Bottle',
        description: 'Stainless steel water bottle 500ml',
        sku: 'BOTTLE001',
        category: 'Accessories',
        price: 19.99,
        stock: 5, // Low stock for testing
        minStockLevel: 20,
        maxStockLevel: 200,
        unit: 'piece',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
  }
};
