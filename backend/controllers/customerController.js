// Logic for customer-related operations
const User = require('../models/User');

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password');
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error in getCustomers:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('-password');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    // Ensure role is set to customer
    req.body.role = 'customer';
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' });
    }
    
    const newCustomer = new User(req.body);
    await newCustomer.save();
    
    // Don't return the password
    const customer = newCustomer.toObject();
    delete customer.password;
    
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error in createCustomer:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    // Prevent role change through this endpoint
    if (req.body.role && req.body.role !== 'customer') {
      return res.status(400).json({ message: 'Cannot change role through this endpoint' });
    }
    
    // If password is being updated, it will be automatically hashed by the User model pre-save hook
    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'customer' },
      req.body,
      { new: true }
    ).select('-password');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await User.findOneAndDelete({ _id: req.params.id, role: 'customer' });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
