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
    trim: true,
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
  imageUrl: {
    type: String,
    default: ''
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

// Create a sparse unique index on sku field - allows null/undefined values
InventorySchema.index({ sku: 1 }, { unique: true, sparse: true });

// Generate a unique SKU if none is provided
InventorySchema.pre('save', async function(next) {
  try {
    // Only generate SKU if it's not provided
    if (!this.sku) {
      // Generate a SKU based on category and name
      const prefix = this.category ? this.category.substring(0, 3).toUpperCase() : 'ITM';
      const timestamp = Date.now().toString().slice(-6);
      const nameInitials = this.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 3);
      
      // Combine parts to create unique SKU
      const generatedSku = `${prefix}-${nameInitials}-${timestamp}`;
      this.sku = generatedSku;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find low stock items
InventorySchema.statics.findLowStock = function() {
  return this.find({
    quantity: { $lte: '$minStock' }
  });
};

module.exports = mongoose.model('Inventory', InventorySchema);
