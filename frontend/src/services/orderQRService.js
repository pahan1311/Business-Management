import QRCode from 'qrcode';
import PDFService from './pdfService';
import GoogleDriveService from './googleDriveService';

class OrderQRService {
  constructor() {
    this.pdfService = new PDFService();
    this.googleDriveService = new GoogleDriveService();
  }

  // Generate complete order QR system: PDF with order details -> Upload to Drive -> Generate QR -> Download QR
  async generateCompleteOrderQR(orderData, options = {}) {
    try {
      console.log('🚀 Starting complete order QR generation process...');
      
      // Step 1: Initialize Google Drive service
      await this.googleDriveService.initializeClient();
      const authenticated = await this.googleDriveService.authenticate();
      if (!authenticated) {
        throw new Error('Failed to authenticate with Google Drive');
      }

      // Step 2: Generate PDF with order details
      console.log('📄 Generating order details PDF...');
      await this.pdfService.generateOrderDetailsPDF(orderData, options.additionalInfo);
      const pdfBlob = this.pdfService.getPDFBlob();
      
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF blob');
      }

      // Step 3: Upload PDF to Google Drive
      console.log('☁️ Uploading PDF to Google Drive...');
      const fileName = `Order_${orderData.orderNumber || orderData._id || 'Unknown'}_${Date.now()}.pdf`;
      const uploadResult = await this.googleDriveService.uploadAndShare(pdfBlob, fileName);
      
      console.log('✅ PDF uploaded successfully:', uploadResult);

      // Step 4: Generate QR code that points to the Google Drive file
      console.log('🔲 Generating QR code for Google Drive link...');
      const qrOptions = {
        width: options.qrSize || 300,
        margin: options.qrMargin || 4,
        color: {
          dark: options.qrDarkColor || '#000000',
          light: options.qrLightColor || '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      };

      const qrCodeDataURL = await QRCode.toDataURL(uploadResult.shareableLink, qrOptions);

      // Step 5: Create downloadable QR code with order info
      const qrWithInfo = await this.createQRWithOrderInfo(qrCodeDataURL, orderData, uploadResult.shareableLink);

      console.log('🎉 Complete order QR generation completed successfully');

      return {
        success: true,
        pdfInfo: {
          fileName: uploadResult.fileName,
          fileId: uploadResult.fileId,
          shareableLink: uploadResult.shareableLink
        },
        qrCode: {
          dataURL: qrCodeDataURL,
          downloadableQR: qrWithInfo,
          targetLink: uploadResult.shareableLink
        },
        orderData: {
          orderId: orderData._id || orderData.id,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customer?.name,
          totalAmount: orderData.totalAmount
        }
      };

    } catch (error) {
      console.error('❌ Error in complete order QR generation:', error);
      throw error;
    }
  }

  // Create a QR code image with order information overlay
  async createQRWithOrderInfo(qrCodeDataURL, orderData, targetLink) {
    try {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 400;
        canvas.height = 500;
        
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Load QR code image
        const qrImage = new Image();
        qrImage.onload = () => {
          try {
            // Draw QR code
            const qrSize = 300;
            const qrX = (canvas.width - qrSize) / 2;
            const qrY = 50;
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            
            // Header text
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ORDER QR CODE', canvas.width / 2, 30);
            
            // Order information
            ctx.font = '14px Arial';
            ctx.fillStyle = '#666666';
            
            const infoY = qrY + qrSize + 30;
            const leftX = 50;
            const rightX = canvas.width - 50;
            
            // Order details
            ctx.textAlign = 'left';
            ctx.fillText('Order #:', leftX, infoY);
            ctx.textAlign = 'right';
            ctx.fillText(orderData.orderNumber || 'N/A', rightX, infoY);
            
            ctx.textAlign = 'left';
            ctx.fillText('Customer:', leftX, infoY + 25);
            ctx.textAlign = 'right';
            ctx.fillText(orderData.customer?.name || 'N/A', rightX, infoY + 25);
            
            ctx.textAlign = 'left';
            ctx.fillText('Total:', leftX, infoY + 50);
            ctx.textAlign = 'right';
            ctx.fillText(`$${orderData.totalAmount?.toFixed(2) || '0.00'}`, rightX, infoY + 50);
            
            // Instructions
            ctx.font = 'italic 12px Arial';
            ctx.fillStyle = '#999999';
            ctx.textAlign = 'center';
            ctx.fillText('Scan to view complete order details', canvas.width / 2, infoY + 85);
            
            // Convert to data URL
            const finalDataURL = canvas.toDataURL('image/png');
            resolve(finalDataURL);
            
          } catch (error) {
            reject(error);
          }
        };
        
        qrImage.onerror = () => {
          reject(new Error('Failed to load QR code image'));
        };
        
        qrImage.src = qrCodeDataURL;
      });
      
    } catch (error) {
      console.error('Error creating QR with order info:', error);
      throw error;
    }
  }

  // Download QR code as image
  downloadQRCode(qrDataURL, fileName) {
    try {
      const link = document.createElement('a');
      link.download = fileName || `QR_Order_${Date.now()}.png`;
      link.href = qrDataURL;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ QR code download initiated');
      return true;
    } catch (error) {
      console.error('❌ Error downloading QR code:', error);
      return false;
    }
  }

  // Generate simple QR code for any URL
  async generateSimpleQR(url, options = {}) {
    try {
      const qrOptions = {
        width: options.width || 200,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: options.errorLevel || 'M'
      };

      const qrCodeDataURL = await QRCode.toDataURL(url, qrOptions);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating simple QR code:', error);
      throw error;
    }
  }

  // Validate order data before processing
  validateOrderData(orderData) {
    const errors = [];

    if (!orderData) {
      errors.push('Order data is required');
      return errors;
    }

    if (!orderData._id && !orderData.id) {
      errors.push('Order must have an ID');
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('Order must have at least one item');
    }

    if (typeof orderData.totalAmount !== 'number' || orderData.totalAmount < 0) {
      errors.push('Order must have a valid total amount');
    }

    return errors;
  }

  // Get processing status
  getProcessingSteps() {
    return [
      { id: 1, name: 'Validating Order Data', status: 'pending' },
      { id: 2, name: 'Generating PDF', status: 'pending' },
      { id: 3, name: 'Uploading to Google Drive', status: 'pending' },
      { id: 4, name: 'Creating Shareable Link', status: 'pending' },
      { id: 5, name: 'Generating QR Code', status: 'pending' },
      { id: 6, name: 'Finalizing', status: 'pending' }
    ];
  }
}

export default OrderQRService;
