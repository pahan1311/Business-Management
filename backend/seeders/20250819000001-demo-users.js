'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await queryInterface.bulkInsert('users', [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@customermanagement.com',
        password: hashedPassword,
        phone: '1234567890',
        role: 'admin',
        status: 'active',
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstName: 'Staff',
        lastName: 'Member',
        email: 'staff@customermanagement.com',
        password: hashedPassword,
        phone: '1234567891',
        role: 'staff',
        status: 'active',
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: hashedPassword,
        phone: '1234567892',
        role: 'customer',
        status: 'active',
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstName: 'Delivery',
        lastName: 'Person',
        email: 'delivery@customermanagement.com',
        password: hashedPassword,
        phone: '1234567893',
        role: 'delivery',
        status: 'active',
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
