const rbacGuard = (allowedRoles = [], options = {}) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      // Check role access
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }
        });
      }

      // Check ownership for certain resources
      if (options.checkOwnership) {
        const resourceId = req.params.id;
        const resourceUserId = req.params.userId || req.body.userId;
        const customerId = req.params.customerId || req.body.customerId;
        
        // Allow admin access to everything
        if (user.role === 'ADMIN') {
          return next();
        }
        
        // Check if user owns the resource
        if (options.ownerField && resourceUserId && resourceUserId !== user.id) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied to this resource'
            }
          });
        }

        // For customer resources, check if customer owns it
        if (user.role === 'CUSTOMER' && customerId && customerId !== user.id) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied to this resource'
            }
          });
        }
      }

      next();
    } catch (error) {
      console.error('RBAC guard error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authorization error'
        }
      });
    }
  };
};

module.exports = { rbacGuard };
