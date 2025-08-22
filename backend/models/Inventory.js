// MongoDB schema for inventory
const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  minStock: {
    type: Number,
    default: 5
  },
  images: [{
    type: String
  }],
  vendor: {
    name: String,
    contact: String,
    email: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Static method to find low stock items
InventorySchema.statics.findLowStock = function() {
  return this.find({
    quantity: { $lte: '$minStock' }
  });
};

module.exports = mongoose.model('Inventory', InventorySchema);
