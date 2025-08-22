const QRCodeGenerator = require('../utils/qrCodeGenerator');
const Order = require('../models/Order');
const Delivery = require('../models/Delivery');

// Generate QR code for delivery
exports.generateQRCode = async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required for QR code generation' });
    }

    // Generate QR code
    const qrCodeDataURL = await QRCodeGenerator.generate(JSON.stringify(data));
    
    res.json({
      success: true,
      qrCode: qrCodeDataURL,
      data: data
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ 
      error: 'Failed to generate QR code',
      details: error.message 
    });
  }
};

// Lookup delivery/order information from QR code data
exports.lookupQRCode = async (req, res) => {
  try {
    const { data } = req.params;
    
    if (!data) {
      return res.status(400).json({ error: 'QR code data is required' });
    }

    let decodedData;
    try {
      decodedData = JSON.parse(decodeURIComponent(data));
    } catch (parseError) {
      // If it's not JSON, treat it as a simple string (maybe order ID or delivery ID)
      decodedData = { id: decodeURIComponent(data) };
    }

    let result = null;

    // Handle comprehensive QR data structure
    if (decodedData.delivery && decodedData.order) {
      // This is the new comprehensive format
      const deliveryId = decodedData.delivery.id;
      const orderId = decodedData.order.id;
      
      // Fetch fresh data from database
      const delivery = await Delivery.findById(deliveryId)
        .populate('order')
        .populate('deliveryPerson', 'name phone email');
        
      const order = await Order.findById(orderId)
        .populate('customer', 'name email phone')
        .populate('items.product');
      
      if (delivery && order) {
        result = {
          type: 'comprehensive',
          qrData: decodedData,
          freshData: {
            delivery: delivery,
            order: order
          },
          verificationStatus: {
            deliveryExists: true,
            orderExists: true,
            dataConsistent: delivery.order.toString() === orderId
          }
        };
      }
    }

    // Try to find by delivery ID (legacy and new format)
    if (!result && (decodedData.deliveryId || decodedData.delivery?.id)) {
      const deliveryId = decodedData.deliveryId || decodedData.delivery?.id;
      const delivery = await Delivery.findById(deliveryId)
        .populate('order')
        .populate('deliveryPerson', 'name phone email');
      if (delivery) {
        result = {
          type: 'delivery',
          data: delivery,
          qrData: decodedData
        };
      }
    }

    // Try to find by order ID (legacy and new format)
    if (!result && (decodedData.orderId || decodedData.order?.id)) {
      const orderId = decodedData.orderId || decodedData.order?.id;
      
      let order;
      if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(orderId).populate('customer', 'name phone address');
      } else {
        order = await Order.findOne({
          $or: [
            { orderNumber: orderId },
            { _id: orderId }
          ]
        }).populate('customer', 'name phone address');
      }
      
      if (order) {
        result = {
          type: 'order',
          data: order,
          qrData: decodedData
        };
      }
    }

    // Try to find by simple ID lookup
    if (!result && decodedData.id) {
      // Try delivery first
      const delivery = await Delivery.findOne({
        $or: [
          { _id: decodedData.id },
          { 'orderNumber': decodedData.id }
        ]
      }).populate('order').populate('deliveryPerson', 'name phone email');
      
      if (delivery) {
        result = {
          type: 'delivery',
          data: delivery,
          qrData: decodedData
        };
      } else {
        // Try order
        const order = await Order.findOne({
          $or: [
            { _id: decodedData.id },
            { orderNumber: decodedData.id }
          ]
        }).populate('customer', 'name phone address');
        
        if (order) {
          result = {
            type: 'order',
            data: order,
            qrData: decodedData
          };
        }
      }
    }

    if (!result) {
      return res.status(404).json({ 
        error: 'No delivery or order found for this QR code',
        searchData: decodedData,
        searchedFields: {
          deliveryId: decodedData.deliveryId || decodedData.delivery?.id,
          orderId: decodedData.orderId || decodedData.order?.id,
          simpleId: decodedData.id
        }
      });
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error('Error looking up QR code:', error);
    res.status(500).json({ 
      error: 'Failed to lookup QR code data',
      details: error.message 
    });
  }
};
