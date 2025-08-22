// MongoDB schema for delivery tracking
const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderId: {
    type: String
  },
  customerName: {
    type: String
  },
  contactPhone: {
    type: String
  },
  address: {
    type: mongoose.Schema.Types.Mixed
  },
  orderValue: {
    type: Number
  },
  items: [
    {
      type: mongoose.Schema.Types.Mixed
    }
  ],
  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'rejected', 'failed', 'cancelled'],
    default: 'pending'
  },
  location: {
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  scheduledDate: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', DeliverySchema);
