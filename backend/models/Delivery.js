// MongoDB schema for delivery tracking
const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'cancelled'],
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
