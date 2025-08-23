import PDFService from './pdfService';
import GoogleDriveService from './googleDriveService';
import QRCode from 'qrcode';

class DeliveryPDFManager {
  constructor() {
    this.pdfService = new PDFService();
    this.driveService = new GoogleDriveService();
  }

  async generateAndUploadDeliveryPDF(deliveryData, orderData) {
    try {
      console.log('🔄 Starting PDF generation process...');
      console.log('📊 Delivery data:', deliveryData);
      console.log('🛒 Order data:', orderData);
      
      let pdf;
      
      // Check if we have valid order data
      if (orderData && (orderData._id || orderData.id)) {
        // Step 1: Generate PDF with all order details
        pdf = await this.pdfService.generateOrderDetailsPDF(orderData, {
          companyName: "Business Management System",
          deliveryInfo: deliveryData
        });
        console.log('✅ PDF generated successfully with all order details');
      } else {
        // If no order data, use delivery data to generate a simple PDF
        pdf = await this.pdfService.generateDeliveryPDF(deliveryData, {
          // Create a minimal order object from delivery data
          items: deliveryData.items || [],
          totalAmount: deliveryData.totalAmount || 0
        });
        console.log('✅ PDF generated with delivery data only (no order details)')
      }

      // Step 2: Get PDF as blob
      const pdfBlob = this.pdfService.getPDFBlob();
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF blob');
      }

      // Step 3: Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const deliveryId = (deliveryData.id || deliveryData._id || 'unknown').toString().substring(0, 8);
      const customerName = (deliveryData.customerName || 'customer').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `delivery_report_${deliveryId}_${customerName}_${timestamp}.pdf`;
      
      let uploadResult;
      let qrCodeData;
      let usedFallback = false;
      
      try {
        console.log('Uploading PDF to Google Drive...');
        // First try uploading to Google Drive to the specified folder
        uploadResult = await this.realGoogleDriveUpload(pdfBlob, filename);
        
        // Generate QR code that points to the Google Drive file (just the link, not all data)
        qrCodeData = await this.generateQRCodeForFile(uploadResult.shareableLink);
        
        // Also add QR code to the PDF itself
        await this.pdfService.addQRCodeToPDF(uploadResult.shareableLink);
        
        // Get updated PDF blob with QR code
        const updatedPdfBlob = this.pdfService.getPDFBlob();
        
        // Re-upload the updated PDF with QR code
        const updatedFilename = `${filename.replace('.pdf', '_with_qr.pdf')}`;
        uploadResult = await this.realGoogleDriveUpload(updatedPdfBlob, updatedFilename);
      } catch (uploadError) {
        console.log('⚠️ Google Drive upload failed, using fallback...', uploadError);
        usedFallback = true;
        
        // Generate a simple web URL that can be used to access delivery info
        const deliveryId = deliveryData.id || deliveryData._id;
        const webUrl = `${window.location.origin}/delivery/${deliveryId}`;
        
        // Generate a QR code that points to this web URL (much smaller data)
        uploadResult = {
          fileName: filename,
          fileId: 'local_' + Math.random().toString(36).substr(2, 9),
          shareableLink: webUrl,
          isLocalFile: true,
          note: 'PDF generated locally (Google Drive unavailable)'
        };
        
        qrCodeData = await this.generateQRCodeForFile(webUrl);
        
        // Also download the PDF since we couldn't upload it
        try {
          this.pdfService.downloadPDF(filename);
        } catch (downloadError) {
          console.error('💥 Local download also failed:', downloadError);
        }
      }

      return {
        success: true,
        pdfGenerated: true,
        uploadResult: uploadResult,
        qrCodeData: qrCodeData,
        downloadableQRCode: await this.createDownloadableQRCode(qrCodeData, 
          orderData || {
            id: deliveryData.id || deliveryData._id,
            orderNumber: deliveryData.orderId,
            customerName: deliveryData.customerName
          }, 
          uploadResult.shareableLink
        ),
        filename: filename,
        usedFallback: usedFallback,
        orderDetails: orderData ? {
          orderId: orderData.id || orderData._id,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerName || (orderData.customer ? orderData.customer.name : 'Unknown'),
          totalItems: orderData.items ? orderData.items.length : 0,
          totalAmount: orderData.totalAmount || 0
        } : {
          deliveryId: deliveryData.id || deliveryData._id,
          orderId: deliveryData.orderId || (deliveryData.order ? deliveryData.order.id : null),
          customerName: deliveryData.customerName,
          totalItems: deliveryData.items ? deliveryData.items.length : 0
        }
      };

    } catch (error) {
      console.error('💥 Error in PDF generation process:', error);
      
      // Ultimate fallback: just generate and download PDF locally
      const timestamp = new Date().toISOString().split('T')[0];
      const deliveryId = (deliveryData.id || deliveryData._id || 'unknown').toString().substring(0, 8);
      const customerName = (deliveryData.customerName || 'customer').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `delivery_report_${deliveryId}_${customerName}_${timestamp}.pdf`;
      
      try {
        // Try to generate a simple delivery PDF without requiring order details
        await this.pdfService.generateDeliveryPDF(deliveryData, {
          items: deliveryData.items || [],
          totalAmount: deliveryData.totalAmount || 0
        });
        
        this.pdfService.downloadPDF(filename);
        
        // Generate a simple QR code with web URL for delivery info (avoiding data size issues)
        const deliveryId = deliveryData.id || deliveryData._id;
        const webUrl = `${window.location.origin}/delivery/${deliveryId}`;
        
        const qrCodeData = await this.generateQRCodeForFile(webUrl);
        
        return {
          success: false,
          error: error.message,
          fallback: true,
          filename: filename,
          qrCodeData: qrCodeData,
          downloadableQRCode: await this.createDownloadableQRCode(qrCodeData, {
            id: deliveryData.id || deliveryData._id,
            orderNumber: deliveryData.orderId,
            customerName: deliveryData.customerName
          }, webUrl)
        };
      } catch (downloadError) {
        console.error('💥 Even local download failed:', downloadError);
        
        return {
          success: false,
          error: error.message,
          fallbackFailed: true,
          filename: filename
        };
      }
    }
  }

  // Simulate Google Drive upload for demo purposes
  async simulateGoogleDriveUpload(pdfBlob, filename) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a mock file ID and shareable link
        const mockFileId = 'demo_' + Math.random().toString(36).substr(2, 9);
        const mockShareableLink = `https://drive.google.com/file/d/${mockFileId}/view?usp=sharing`;
        
        console.log(`📤 Simulated upload of ${filename} (${(pdfBlob.size / 1024).toFixed(2)} KB)`);
        console.log(`🔗 Mock shareable link: ${mockShareableLink}`);
        
        resolve({
          fileId: mockFileId,
          fileName: filename,
          shareableLink: mockShareableLink,
          note: '⚠️ DEMO MODE: This is a simulated upload. The PDF was not actually uploaded to Google Drive. To enable real uploads, ensure your Google API credentials are properly configured.',
          uploadedSize: pdfBlob.size,
          uploadTime: new Date().toISOString()
        });
      }, 2000); // Simulate upload time
    });
  }

  // Real Google Drive upload implementation (requires API setup)
  async realGoogleDriveUpload(pdfBlob, filename) {
    try {
      console.log('🔧 Initializing Google Drive client...');
      // Initialize Google Drive client
      await this.driveService.initializeClient();
      
      console.log('🔐 Authenticating with Google Drive...');
      // Authenticate user
      const authenticated = await this.driveService.authenticate();
      if (!authenticated) {
        throw new Error('Google Drive authentication failed');
      }

      console.log('📤 Uploading file to Google Drive...');
      console.log(`📁 Target folder: ${this.driveService.folderId}`);
      console.log(`📄 File: ${filename} (${(pdfBlob.size / 1024).toFixed(2)} KB)`);
      
      // Upload file and get shareable link
      const uploadResult = await this.driveService.uploadAndShare(pdfBlob, filename);
      
      console.log('✅ File uploaded successfully:', uploadResult);
      console.log('🔗 Shareable link:', uploadResult.shareableLink);
      
      // Verify the link format
      if (!uploadResult.shareableLink.includes('drive.google.com')) {
        console.warn('⚠️ Warning: Link does not appear to be a Google Drive link');
      }
      
      return uploadResult;
    } catch (error) {
      console.error('❌ Real Google Drive upload failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Google Drive upload failed: ${error.message}`);
    }
  }

  async generateQRCodeForFile(fileUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(fileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // Higher error correction for better scanning
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  // Method to create a downloadable QR code with order information
  async createDownloadableQRCode(qrCodeDataUrl, orderData, fileUrl) {
    try {
      // Create a canvas to combine QR code with order info
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 300;
      canvas.height = 400;
      
      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Load QR code image
      const qrImage = new Image();
      
      return new Promise((resolve, reject) => {
        qrImage.onload = () => {
          // Draw QR code centered at the top
          const qrSize = 200;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 30;
          ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
          
          // Add title
          ctx.fillStyle = '#333333';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          
          // Check if we have order data or delivery data
          if (orderData && (orderData.orderNumber || orderData._id || orderData.id)) {
            ctx.fillText('Order Details', canvas.width / 2, qrY + qrSize + 30);
            
            // Add order details
            ctx.font = '12px Arial';
            const infoY = qrY + qrSize + 60;
            ctx.fillText(`Order #: ${orderData.orderNumber || orderData.id || orderData._id || 'N/A'}`, canvas.width / 2, infoY);
            ctx.fillText(`Customer: ${orderData.customerName || (orderData.customer ? orderData.customer.name : 'N/A')}`, canvas.width / 2, infoY + 20);
            ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, canvas.width / 2, infoY + 40);
            
            // Add scanning instructions
            ctx.font = 'italic 10px Arial';
            ctx.fillStyle = '#666666';
            ctx.fillText('Scan QR code to access complete order details', canvas.width / 2, infoY + 70);
          } else {
            ctx.fillText('Delivery Details', canvas.width / 2, qrY + qrSize + 30);
            
            // Add delivery details
            ctx.font = '12px Arial';
            const infoY = qrY + qrSize + 60;
            ctx.fillText(`Delivery ID: ${orderData.id || 'N/A'}`, canvas.width / 2, infoY);
            ctx.fillText(`Customer: ${orderData.customerName || 'N/A'}`, canvas.width / 2, infoY + 20);
            ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, canvas.width / 2, infoY + 40);
            
            // Add scanning instructions
            ctx.font = 'italic 10px Arial';
            ctx.fillStyle = '#666666';
            ctx.fillText('Scan QR code to access delivery information', canvas.width / 2, infoY + 70);
          }
          
          // Convert to data URL
          const finalDataURL = canvas.toDataURL('image/png');
          resolve(finalDataURL);
        };
        
        qrImage.onerror = () => {
          reject(new Error('Failed to load QR code image'));
        };
        
        qrImage.src = qrCodeDataUrl;
      });
    } catch (error) {
      console.error('Error creating downloadable QR code:', error);
      throw error;
    }
  }

  // Method to just generate and download PDF locally
  async generateAndDownloadPDF(deliveryData, orderData) {
    try {
      let pdf;
      
      if (orderData && (orderData._id || orderData.id)) {
        // If we have valid order data
        pdf = await this.pdfService.generateOrderDetailsPDF(orderData, {
          companyName: "Business Management System",
          deliveryInfo: deliveryData
        });
      } else {
        // If no order data, use delivery data to generate a simple PDF
        pdf = await this.pdfService.generateDeliveryPDF(deliveryData, {
          // Create a minimal order object from delivery data
          items: deliveryData.items || [],
          totalAmount: deliveryData.totalAmount || 0
        });
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      const deliveryId = (deliveryData.id || deliveryData._id || 'unknown').toString().substring(0, 8);
      const customerName = (deliveryData.customerName || 'customer').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `delivery_report_${deliveryId}_${customerName}_${timestamp}.pdf`;
      
      this.pdfService.downloadPDF(filename);
      
      return {
        success: true,
        filename: filename,
        downloaded: true
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // Method to download QR code
  downloadQRCode(qrCodeData, orderData) {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const orderId = (orderData.id || orderData._id || 'unknown').toString().substring(0, 8);
      const customerName = (orderData.customerName || orderData.customer?.name || 'customer').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `order_qr_${orderId}_${customerName}_${timestamp}.png`;
      
      const link = document.createElement('a');
      link.href = qrCodeData;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return {
        success: true,
        message: 'QR code downloaded successfully',
        filename: filename
      };
    } catch (error) {
      console.error('Error downloading QR code:', error);
      throw error;
    }
  }

  // Main method to create PDF with order data and assigned person, upload to Drive, and generate QR
  async createOrderPDFWithQR(orderData, assignedPersonData) {
    try {
      console.log('🚀 Starting complete order PDF with QR generation...');
      console.log('📊 Order data:', orderData);
      console.log('👤 Assigned person data:', assignedPersonData);

      // Prepare comprehensive delivery info
      const deliveryInfo = {
        deliveryPerson: assignedPersonData?.name || assignedPersonData?.displayName || 'Not Assigned',
        contactPhone: assignedPersonData?.phone || assignedPersonData?.contactPhone || 'N/A',
        email: assignedPersonData?.email || 'N/A',
        status: orderData.status || 'Pending',
        scheduledDate: orderData.scheduledDate || new Date().toISOString(),
        assignedStaff: assignedPersonData?.name || 'Not Assigned'
      };

      // Generate comprehensive PDF with order details and assigned person
      const pdf = await this.pdfService.generateOrderDetailsPDF(orderData, {
        companyName: "Business Management System",
        deliveryInfo: deliveryInfo
      });

      console.log('✅ PDF generated with order and assigned person details');

      // Get PDF as blob
      const pdfBlob = this.pdfService.getPDFBlob();
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF blob');
      }

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const orderId = (orderData.id || orderData._id || 'unknown').toString().substring(0, 8);
      const customerName = (orderData.customer?.name || 'customer').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `order_${orderId}_${customerName}_${timestamp}.pdf`;

      let uploadResult;
      let qrCodeData;

      try {
        console.log('📤 Uploading PDF to Google Drive...');
        // Upload to Google Drive
        uploadResult = await this.realGoogleDriveUpload(pdfBlob, filename);
        
        // Generate QR code with just the Google Drive link
        qrCodeData = await this.generateQRCodeForFile(uploadResult.shareableLink);
        
        console.log('✅ PDF uploaded and QR code generated successfully');

        return {
          success: true,
          pdfInfo: {
            fileName: uploadResult.fileName,
            fileId: uploadResult.fileId,
            shareableLink: uploadResult.shareableLink
          },
          qrCode: {
            dataURL: qrCodeData,
            downloadableQR: await this.createDownloadableQRCode(qrCodeData, orderData, uploadResult.shareableLink),
            targetLink: uploadResult.shareableLink
          },
          orderDetails: {
            orderId: orderData._id || orderData.id,
            orderNumber: orderData.orderNumber,
            customerName: orderData.customer?.name,
            assignedPerson: assignedPersonData?.name,
            totalAmount: orderData.totalAmount
          }
        };

      } catch (uploadError) {
        console.log('⚠️ Google Drive upload failed, using local fallback...', uploadError);
        
        // Fallback: Download PDF locally and create web URL for QR
        this.pdfService.downloadPDF(filename);
        
        const orderId = orderData.id || orderData._id;
        const webUrl = `${window.location.origin}/order/${orderId}`;
        qrCodeData = await this.generateQRCodeForFile(webUrl);

        return {
          success: true,
          fallback: true,
          localFile: filename,
          qrCode: {
            dataURL: qrCodeData,
            downloadableQR: await this.createDownloadableQRCode(qrCodeData, orderData, webUrl),
            targetLink: webUrl
          },
          orderDetails: {
            orderId: orderData._id || orderData.id,
            orderNumber: orderData.orderNumber,
            customerName: orderData.customer?.name,
            assignedPerson: assignedPersonData?.name,
            totalAmount: orderData.totalAmount
          }
        };
      }

    } catch (error) {
      console.error('❌ Error in order PDF generation:', error);
      throw error;
    }
  }

  // Test method to verify Google Drive connectivity
  async testGoogleDriveConnection() {
    try {
      console.log('🧪 Testing Google Drive connection...');
      
      // Initialize and authenticate
      await this.driveService.initializeClient();
      const authenticated = await this.driveService.authenticate();
      
      if (!authenticated) {
        return {
          success: false,
          error: 'Authentication failed'
        };
      }

      // Create a simple test file
      const testContent = 'This is a test file for Google Drive connectivity.';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFilename = `test_${Date.now()}.txt`;

      // Try to upload
      const uploadResult = await this.driveService.uploadAndShare(testBlob, testFilename);
      
      console.log('✅ Google Drive test successful:', uploadResult);
      
      return {
        success: true,
        fileId: uploadResult.fileId,
        shareableLink: uploadResult.shareableLink,
        message: 'Google Drive connection working properly'
      };
      
    } catch (error) {
      console.error('❌ Google Drive test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default DeliveryPDFManager;
