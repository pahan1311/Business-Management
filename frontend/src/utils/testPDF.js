// Test script for PDF generation functionality
// This can be run in the browser console to test PDF generation

import DeliveryPDFManager from '../services/deliveryPDFManager';

// Test data
const testDeliveryData = {
  id: 'e48158',
  _id: 'e48158',
  order: 'e4804e',
  customerName: 'T Customer Abegunasekara',
  deliveryPerson: 'nithi ja',
  status: 'assigned',
  createdAt: new Date('2025-08-23T09:19:00'),
  address: '123 Main Street, Colombo 07, Western Province, 10350'
};

const testOrderData = {
  _id: 'e4804e',
  id: 'e4804e',
  items: [
    { name: 'Product A', quantity: 2, price: 25.50 },
    { name: 'Product B', quantity: 1, price: 45.00 },
    { name: 'Product C', quantity: 3, price: 15.75 }
  ],
  totalAmount: 143.25,
  status: 'ready'
};

// Function to test PDF generation
async function testPDFGeneration() {
  try {
    console.log('Testing PDF generation...');
    
    const pdfManager = new DeliveryPDFManager();
    const result = await pdfManager.generateAndUploadDeliveryPDF(testDeliveryData, testOrderData);
    
    console.log('PDF generation result:', result);
    
    if (result.success) {
      console.log('✅ PDF generated successfully!');
      console.log('📄 Filename:', result.filename);
      if (result.qrCodeData) {
        console.log('🔗 QR Code generated for:', result.uploadResult.shareableLink);
      }
    } else if (result.fallback) {
      console.log('⚠️ PDF generated with fallback (local download)');
      console.log('📄 Filename:', result.filename);
    } else {
      console.error('❌ PDF generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for manual testing
window.testPDFGeneration = testPDFGeneration;
window.testDeliveryData = testDeliveryData;
window.testOrderData = testOrderData;

console.log('PDF Test utilities loaded. Run testPDFGeneration() to test.');

export { testPDFGeneration, testDeliveryData, testOrderData };
