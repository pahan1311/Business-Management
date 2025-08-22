// Logic for staff management
const User = require('../models/User');

// Get all staff members (staff and delivery roles)
exports.getStaff = async (req, res) => {
  try {
    const staff = await User.find({ 
      role: { $in: ['staff', 'delivery'] } 
    }).select('-password');
    
    res.status(200).json(staff);
  } catch (error) {
    console.error('Error in getStaff:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get staff member by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await User.findOne({ 
      _id: req.params.id,
      role: { $in: ['staff', 'delivery'] } 
    }).select('-password');
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    res.status(200).json(staff);
  } catch (error) {
    console.error('Error in getStaffById:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create new staff member
exports.createStaff = async (req, res) => {
  try {
    // Check role is valid
    if (!['staff', 'delivery'].includes(req.body.role)) {
      return res.status(400).json({ message: 'Invalid role. Must be staff or delivery' });
    }
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' });
    }
    
    const newStaff = new User(req.body);
    await newStaff.save();
    
    // Don't return the password
    const staff = newStaff.toObject();
    delete staff.password;
    
    res.status(201).json(staff);
  } catch (error) {
    console.error('Error in createStaff:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update staff member
exports.updateStaff = async (req, res) => {
  try {
    // Check role is valid if being updated
    if (req.body.role && !['staff', 'delivery'].includes(req.body.role)) {
      return res.status(400).json({ message: 'Invalid role. Must be staff or delivery' });
    }
    
    const staff = await User.findOneAndUpdate(
      { 
        _id: req.params.id,
        role: { $in: ['staff', 'delivery'] } 
      },
      req.body,
      { new: true }
    ).select('-password');
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    res.status(200).json(staff);
  } catch (error) {
    console.error('Error in updateStaff:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete staff member
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndDelete({
      _id: req.params.id,
      role: { $in: ['staff', 'delivery'] }
    });
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    res.status(200).json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error in deleteStaff:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get available staff members (not assigned to active orders)
exports.getAvailableStaff = async (req, res) => {
  try {
    const Order = require('../models/Order');
    
    // Get all staff IDs who are currently assigned to active orders
    const activeOrders = await Order.find({ 
      status: { $in: ['confirmed', 'processing', 'ready', 'out_for_delivery'] },
      assignedStaff: { $ne: null }
    }).select('assignedStaff');
    
    const busyStaffIds = activeOrders.map(order => order.assignedStaff);
    
    // Get all staff members who are not in the busy list
    const availableStaff = await User.find({ 
      role: { $in: ['staff', 'delivery'] },
      _id: { $nin: busyStaffIds }
    }).select('-password');
    
    res.status(200).json(availableStaff);
  } catch (error) {
    console.error('Error in getAvailableStaff:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
