const { DeliveryPartnerService } = require('./service');
const { logger } = require('../../config/logger');

class DeliveryPartnerController {
  constructor() {
    this.partnerService = new DeliveryPartnerService();
  }

  async getPartners(req, res, next) {
    try {
      const result = await this.partnerService.getPartners(req.query);
      res.json(result);
    } catch (error) {
      logger.error('Get partners error:', error);
      next(error);
    }
  }

  async getPartnerById(req, res, next) {
    try {
      const { id } = req.params;
      const partner = await this.partnerService.getPartnerById(id);
      res.json(partner);
    } catch (error) {
      logger.error('Get partner by ID error:', error);
      
      if (error.message === 'Delivery partner not found') {
        return res.status(404).json({
          error: {
            code: 'PARTNER_NOT_FOUND',
            message: 'Delivery partner not found'
          }
        });
      }
      
      next(error);
    }
  }

  async createPartner(req, res, next) {
    try {
      const partnerData = req.body;
      const partner = await this.partnerService.createPartner(partnerData);
      res.status(201).json(partner);
    } catch (error) {
      logger.error('Create partner error:', error);
      next(error);
    }
  }

  async updatePartner(req, res, next) {
    try {
      const { id } = req.params;
      const partnerData = req.body;
      const partner = await this.partnerService.updatePartner(id, partnerData);
      res.json(partner);
    } catch (error) {
      logger.error('Update partner error:', error);
      
      if (error.message === 'Delivery partner not found') {
        return res.status(404).json({
          error: {
            code: 'PARTNER_NOT_FOUND',
            message: 'Delivery partner not found'
          }
        });
      }
      
      next(error);
    }
  }

  async deletePartner(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.partnerService.deletePartner(id);
      res.json(result);
    } catch (error) {
      logger.error('Delete partner error:', error);
      
      if (error.message === 'Delivery partner not found') {
        return res.status(404).json({
          error: {
            code: 'PARTNER_NOT_FOUND',
            message: 'Delivery partner not found'
          }
        });
      }
      
      if (error.message === 'Cannot delete partner with active drivers') {
        return res.status(400).json({
          error: {
            code: 'ACTIVE_DRIVERS_EXIST',
            message: 'Cannot delete partner with active drivers'
          }
        });
      }
      
      next(error);
    }
  }

  async getPartnerDrivers(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.partnerService.getPartnerDrivers(id);
      res.json(result);
    } catch (error) {
      logger.error('Get partner drivers error:', error);
      
      if (error.message === 'Delivery partner not found') {
        return res.status(404).json({
          error: {
            code: 'PARTNER_NOT_FOUND',
            message: 'Delivery partner not found'
          }
        });
      }
      
      next(error);
    }
  }

  async assignDriverToPartner(req, res, next) {
    try {
      const { partnerId, userId } = req.params;
      const result = await this.partnerService.assignDriverToPartner(userId, partnerId);
      res.json(result);
    } catch (error) {
      logger.error('Assign driver to partner error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }
      
      if (error.message === 'User is not a delivery person') {
        return res.status(400).json({
          error: {
            code: 'INVALID_USER_ROLE',
            message: 'User is not a delivery person'
          }
        });
      }
      
      if (error.message === 'Delivery partner not found') {
        return res.status(404).json({
          error: {
            code: 'PARTNER_NOT_FOUND',
            message: 'Delivery partner not found'
          }
        });
      }
      
      next(error);
    }
  }

  async removeDriverFromPartner(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await this.partnerService.removeDriverFromPartner(userId);
      res.json(result);
    } catch (error) {
      logger.error('Remove driver from partner error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }
      
      if (error.message === 'User is not assigned to any partner') {
        return res.status(400).json({
          error: {
            code: 'USER_NOT_ASSIGNED',
            message: 'User is not assigned to any partner'
          }
        });
      }
      
      next(error);
    }
  }
}

module.exports = { DeliveryPartnerController };
