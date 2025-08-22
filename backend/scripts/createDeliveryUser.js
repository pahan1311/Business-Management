// Script to create a test delivery user
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
// Hardcode the MongoDB URI since there's an issue with .env
mongoose.connect('mongodb://localhost:27017/business-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for script'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Create a test delivery person
const createDeliveryPerson = async () => {
  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email: 'delivery@test.com' });
    
    if (existingUser) {
      console.log('Delivery person already exists');
      process.exit(0);
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create the delivery person
    const deliveryPerson = await User.create({
      name: 'Test Delivery Person',
      email: 'delivery@test.com',
      password: hashedPassword,
      role: 'delivery',
      phone: '1234567890',
      address: {
        street: '123 Delivery St',
        city: 'Delivery City',
        state: 'DC',
        zip: '12345',
        country: 'USA'
      }
    });
    
    console.log('Delivery person created:', deliveryPerson);
    process.exit(0);
  } catch (err) {
    console.error('Error creating delivery person:', err);
    process.exit(1);
  }
};

// Run the function
createDeliveryPerson();
