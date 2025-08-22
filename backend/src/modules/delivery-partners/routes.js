const express = require('express');
const { DeliveryPartnerController } = require('./controller');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { zodValidate } = require('../../middlewares/zodValidate');
const { 
  createPartnerSchema, 
  updatePartnerSchema, 
  getPartnersSchema 
} = require('./schemas');

const router = express.Router();
const partnerController = new DeliveryPartnerController();

// All routes require authentication
router.use(authGuard);

// Most routes require admin role
router.get('/', zodValidate(getPartnersSchema), rbacGuard(['ADMIN']), partnerController.getPartners.bind(partnerController));
router.get('/:id', rbacGuard(['ADMIN']), partnerController.getPartnerById.bind(partnerController));
router.post('/', zodValidate(createPartnerSchema), rbacGuard(['ADMIN']), partnerController.createPartner.bind(partnerController));
router.patch('/:id', zodValidate(updatePartnerSchema), rbacGuard(['ADMIN']), partnerController.updatePartner.bind(partnerController));
router.delete('/:id', rbacGuard(['ADMIN']), partnerController.deletePartner.bind(partnerController));

// Driver management
router.get('/:id/drivers', rbacGuard(['ADMIN']), partnerController.getPartnerDrivers.bind(partnerController));
router.post('/:partnerId/drivers/:userId', rbacGuard(['ADMIN']), partnerController.assignDriverToPartner.bind(partnerController));
router.delete('/drivers/:userId', rbacGuard(['ADMIN']), partnerController.removeDriverFromPartner.bind(partnerController));

module.exports = router;
