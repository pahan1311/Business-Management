// Controller for managing users (admin, staff, customer, delivery)
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Get all users with optional filtering
exports.getUsers = async (req, res) => {
  try {
    const { role, search, sort, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    const sortOptions = {};
    if (sort) {
      const [sortField, sortOrder] = sort.split(':');
      sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by most recent
    }
    
    const users = await User.find(query)
      .select('-password') // Exclude password
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
      
    const total = await User.countDocuments(query);
    
    // For simple role filtering, just return the array
    if (role && !search && !sort && page === 1 && limit === 10) {
      return res.status(200).json(users);
    }
    
    // Otherwise return the paginated structure
    res.status(200).json({
      users,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role
    const validRoles = ['admin', 'staff', 'customer', 'delivery'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    const users = await User.find({ role }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error in getUsersByRole:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Create user
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'customer',
      phone,
      address
    });
    
    await newUser.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    
    // Check if email already exists for another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    const updateData = { name, email, role, phone, address };
    
    // Only hash and update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
