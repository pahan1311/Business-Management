// Input validation middleware

module.exports = (req, res, next) => {
  try {
    // Validate signup request
    if (req.path === '/signup') {
      console.log("Signup request body:", JSON.stringify(req.body));
      
      const { name, email, password, role } = req.body;
      
      // Check for required fields
      if (!name || !email || !password) {
        console.log("Missing required fields:", { name, email, password });
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }
      
      // Validate email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }
      
      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      
      // Validate role (if provided)
      if (role && !['admin', 'staff', 'customer', 'delivery'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Role must be one of: admin, staff, customer, or delivery'
        });
      }
    }
    
    // Validate login request
    if (req.path === '/login') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error(`Validation error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: error.message
    });
  }
};
