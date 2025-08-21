'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the user ID for John Doe (customer)
    const [users] = await queryInterface.sequelize.query(
      "SELECT id from users WHERE email = 'john.doe@example.com' LIMIT 1;"
    );
    
    if (users.length > 0) {
      const userId = users[0].id;
      
      await queryInterface.bulkInsert('customers', [
        {
          userId: userId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567892',
          dateOfBirth: '1990-01-15',
          address: JSON.stringify({
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
            country: 'USA'
          }),
          emergencyContact: JSON.stringify({
            name: 'Jane Doe',
            phone: '1234567899',
            relationship: 'Spouse'
          }),
          status: 'active',
          loyaltyPoints: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('customers', null, {});
  }
};
