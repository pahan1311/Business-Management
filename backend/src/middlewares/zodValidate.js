const { z } = require('zod');
const { logger } = require('../config/logger');

const zodValidate = (schema) => {
  return (req, res, next) => {
    try {
      const validationTarget = {
        body: req.body,
        query: req.query,
        params: req.params
      };

      schema.parse(validationTarget);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: formattedErrors
          }
        });
      }

      logger.error('Validation middleware error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Validation error'
        }
      });
    }
  };
};

module.exports = { zodValidate };
