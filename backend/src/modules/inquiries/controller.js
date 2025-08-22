const { InquiryService } = require('./service');
const { logger } = require('../../config/logger');

class InquiryController {
  constructor() {
    this.inquiryService = new InquiryService();
  }

  async getInquiries(req, res, next) {
    try {
      const result = await this.inquiryService.getInquiries(req.query, req.user);
      res.json(result);
    } catch (error) {
      logger.error('Get inquiries error:', error);
      next(error);
    }
  }

  async getInquiryById(req, res, next) {
    try {
      const { id } = req.params;
      const inquiry = await this.inquiryService.getInquiryById(id, req.user);
      res.json(inquiry);
    } catch (error) {
      logger.error('Get inquiry by ID error:', error);
      
      if (error.message === 'Inquiry not found') {
        return res.status(404).json({
          error: {
            code: 'INQUIRY_NOT_FOUND',
            message: 'Inquiry not found'
          }
        });
      }
      
      next(error);
    }
  }

  async createInquiry(req, res, next) {
    try {
      const inquiryData = req.body;
      const inquiry = await this.inquiryService.createInquiry(inquiryData, req.user);
      res.status(201).json(inquiry);
    } catch (error) {
      logger.error('Create inquiry error:', error);
      
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }
      
      if (error.message === 'Customer ID is required') {
        return res.status(400).json({
          error: {
            code: 'MISSING_CUSTOMER_ID',
            message: 'Customer ID is required'
          }
        });
      }
      
      next(error);
    }
  }

  async updateInquiry(req, res, next) {
    try {
      const { id } = req.params;
      const inquiryData = req.body;
      const inquiry = await this.inquiryService.updateInquiry(id, inquiryData, req.user);
      res.json(inquiry);
    } catch (error) {
      logger.error('Update inquiry error:', error);
      
      if (error.message === 'Inquiry not found') {
        return res.status(404).json({
          error: {
            code: 'INQUIRY_NOT_FOUND',
            message: 'Inquiry not found'
          }
        });
      }
      
      if (error.message === 'Unauthorized') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this inquiry'
          }
        });
      }
      
      next(error);
    }
  }

  async deleteInquiry(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.inquiryService.deleteInquiry(id, req.user);
      res.json(result);
    } catch (error) {
      logger.error('Delete inquiry error:', error);
      
      if (error.message === 'Inquiry not found') {
        return res.status(404).json({
          error: {
            code: 'INQUIRY_NOT_FOUND',
            message: 'Inquiry not found'
          }
        });
      }
      
      if (error.message === 'Unauthorized') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this inquiry'
          }
        });
      }
      
      next(error);
    }
  }

  async addReply(req, res, next) {
    try {
      const { id } = req.params;
      const replyData = req.body;
      const reply = await this.inquiryService.addReply(id, replyData, req.user);
      res.status(201).json(reply);
    } catch (error) {
      logger.error('Add reply error:', error);
      
      if (error.message === 'Inquiry not found') {
        return res.status(404).json({
          error: {
            code: 'INQUIRY_NOT_FOUND',
            message: 'Inquiry not found'
          }
        });
      }
      
      if (error.message === 'Unauthorized') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to reply to this inquiry'
          }
        });
      }
      
      next(error);
    }
  }

  async getReplies(req, res, next) {
    try {
      const { id } = req.params;
      const replies = await this.inquiryService.getReplies(id, req.user);
      res.json(replies);
    } catch (error) {
      logger.error('Get replies error:', error);
      
      if (error.message === 'Inquiry not found') {
        return res.status(404).json({
          error: {
            code: 'INQUIRY_NOT_FOUND',
            message: 'Inquiry not found'
          }
        });
      }
      
      if (error.message === 'Unauthorized') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view replies to this inquiry'
          }
        });
      }
      
      next(error);
    }
  }
}

module.exports = { InquiryController };
