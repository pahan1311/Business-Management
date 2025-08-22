// MongoDB schema for staff
const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  // ...fields...
});

module.exports = mongoose.model('Staff', StaffSchema);
