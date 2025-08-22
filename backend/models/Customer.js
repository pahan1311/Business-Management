// MongoDB schema for customers
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  // ...fields...
});

module.exports = mongoose.model('Customer', CustomerSchema);
