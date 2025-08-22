// Logic for inventory management
const Inventory = require('../models/Inventory');

// Get public product listings (for customers)
exports.getPublicProducts = async (req, res) => {
  try {
    const { category, search, sortBy = 'name', sortOrder = 'asc', limit = 12, page = 1 } = req.query;
    
    // Build query
    const query = { 
      isPublished: true, // Only return published products
      stock: { $gt: 0 }  // Only products with stock available
    };
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }
    
    const products = await Inventory.find(query)
      .select('name description price imageUrl category stock') // Only return necessary fields
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
      
    const total = await Inventory.countDocuments(query);
    
    res.status(200).json({
      products,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error('Error in getPublicProducts:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get public product by ID
exports.getPublicProductById = async (req, res) => {
  try {
    const product = await Inventory.findOne({
      _id: req.params.id,
      isPublished: true
    }).select('name description price imageUrl category stock');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json({ product });
  } catch (error) {
    console.error('Error in getPublicProductById:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get product categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Inventory.distinct('category');
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get all inventory items
exports.getInventory = async (req, res) => {
  try {
    const { category, search, sortBy, sortOrder, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by most recent
    }
    
    const items = await Inventory.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
      
    const total = await Inventory.countDocuments(query);
    
    res.status(200).json({
      items,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error('Error in getInventory:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get inventory item by ID
exports.getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json(item);
  } catch (error) {
    console.error('Error in getInventoryById:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get low stock items
exports.getLowStock = async (req, res) => {
  try {
    // Using aggregation to compare fields within the same document
    const lowStockItems = await Inventory.aggregate([
      {
        $match: {
          $expr: {
            $lte: ["$quantity", "$minStock"]
          }
        }
      },
      { $sort: { quantity: 1 } }
    ]);
    
    res.status(200).json(lowStockItems);
  } catch (error) {
    console.error('Error in getLowStock:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create new inventory item
exports.createInventory = async (req, res) => {
  try {
    const { name, sku, category, price, quantity } = req.body;
    
    // Validate required fields
    if (!name || !category || price == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if SKU already exists
    if (sku) {
      const existingItem = await Inventory.findOne({ sku });
      if (existingItem) {
        return res.status(400).json({ message: 'An item with this SKU already exists' });
      }
    }
    
    const newItem = new Inventory(req.body);
    const savedItem = await newItem.save();
    
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error in createInventory:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update inventory item
exports.updateInventory = async (req, res) => {
  try {
    // Check if updating SKU and if it already exists
    if (req.body.sku) {
      const existingItem = await Inventory.findOne({ 
        sku: req.body.sku,
        _id: { $ne: req.params.id }
      });
      
      if (existingItem) {
        return res.status(400).json({ message: 'An item with this SKU already exists' });
      }
    }
    
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error in updateInventory:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update stock quantity
exports.updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity == null) {
      return res.status(400).json({ message: 'Quantity is required' });
    }
    
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    item.quantity = quantity;
    await item.save();
    
    res.status(200).json(item);
  } catch (error) {
    console.error('Error in updateStock:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete inventory item
exports.deleteInventory = async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error in deleteInventory:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
