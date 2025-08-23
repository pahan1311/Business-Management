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
      
      // Step 1: Generate PDF
      const pdf = await this.pdfService.generateDeliveryPDF(deliveryData, orderData);
      console.log('✅ PDF generated successfully');

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

      console.log('Uploading PDF to Google Drive...');

      // For demo purposes, we'll simulate the Google Drive upload
      // In a real implementation, you would need to set up Google Drive API credentials
      const mockUploadResult = await this.simulateGoogleDriveUpload(pdfBlob, filename);
      
      // Step 4: Generate QR code for the file
      const qrCodeData = await this.generateQRCodeForFile(mockUploadResult.shareableLink);

      return {
        success: true,
        pdfGenerated: true,
        uploadResult: mockUploadResult,
        qrCodeData: qrCodeData,
        filename: filename
      };

    } catch (error) {
      console.error('💥 Error in PDF generation process:', error);
      
      // Fallback: just generate and download PDF locally
      const timestamp = new Date().toISOString().split('T')[0];
      const deliveryId = (deliveryData.id || deliveryData._id || 'unknown').toString().substring(0, 8);
      const customerName = (deliveryData.customerName || 'customer').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `delivery_report_${deliveryId}_${customerName}_${timestamp}.pdf`;
      
      try {
        this.pdfService.downloadPDF(filename);
      } catch (downloadError) {
        console.error('💥 Even local download failed:', downloadError);
      }
      
      return {
        success: false,
        error: error.message,
        fallback: true,
        filename: filename
      };
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
      // Upload file and get shareable link
      const uploadResult = await this.driveService.uploadAndShare(pdfBlob, filename);
      
      console.log('✅ File uploaded successfully:', uploadResult);
      return uploadResult;
    } catch (error) {
      console.error('❌ Real Google Drive upload failed:', error);
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
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  // Method to just generate and download PDF locally
  async generateAndDownloadPDF(deliveryData, orderData) {
    try {
      const pdf = await this.pdfService.generateDeliveryPDF(deliveryData, orderData);
      
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
}

export default DeliveryPDFManager;
