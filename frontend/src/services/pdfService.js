import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import 'jspdf-autotable';

class PDFService {
  constructor() {
    this.doc = null;
  }

  async generateDeliveryPDF(deliveryData, orderData) {
    try {
      // Create new PDF document
      this.doc = new jsPDF();
      
      // Set up the document
      this.doc.setFontSize(20);
      this.doc.text('DELIVERY REPORT', 20, 30);
      
      // Add a line separator
      this.doc.setLineWidth(0.5);
      this.doc.line(20, 35, 190, 35);
      
      let yPosition = 50;
      
      // Delivery Information
      this.doc.setFontSize(16);
      this.doc.text('DELIVERY INFORMATION', 20, yPosition);
      yPosition += 10;
      
      this.doc.setFontSize(12);
      this.doc.text(`Delivery ID: ${deliveryData.id || deliveryData._id}`, 20, yPosition);
      yPosition += 8;
      this.doc.text(`Order Number: ${deliveryData.order || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      this.doc.text(`Customer: ${deliveryData.customerName || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      this.doc.text(`Delivery Person: ${deliveryData.deliveryPerson || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      this.doc.text(`Status: ${deliveryData.status || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      this.doc.text(`Created: ${new Date(deliveryData.createdAt).toLocaleString()}`, 20, yPosition);
      yPosition += 15;

      // Customer Address
      this.doc.setFontSize(16);
      this.doc.text('DELIVERY ADDRESS', 20, yPosition);
      yPosition += 10;
      
      this.doc.setFontSize(12);
      const address = typeof deliveryData.address === 'object' 
        ? `${deliveryData.address.street || ''}, ${deliveryData.address.city || ''}, ${deliveryData.address.state || ''} ${deliveryData.address.zip || ''}`
        : deliveryData.address || 'Address not available';
      
      // Split long addresses into multiple lines
      const addressLines = this.doc.splitTextToSize(address, 170);
      addressLines.forEach(line => {
        this.doc.text(line, 20, yPosition);
        yPosition += 8;
      });
      yPosition += 10;

      // Order Items (if available)
      if (orderData && orderData.items && orderData.items.length > 0) {
        this.doc.setFontSize(16);
        this.doc.text('ORDER ITEMS', 20, yPosition);
        yPosition += 15;
        
        // Table headers
        this.doc.setFontSize(12);
        this.doc.text('Item', 20, yPosition);
        this.doc.text('Qty', 80, yPosition);
        this.doc.text('Price', 110, yPosition);
        this.doc.text('Total', 150, yPosition);
        yPosition += 5;
        
        // Draw header line
        this.doc.line(20, yPosition, 190, yPosition);
        yPosition += 10;
        
        // Add items
        let totalAmount = 0;
        orderData.items.forEach(item => {
          if (yPosition > 260) {
            this.doc.addPage();
            yPosition = 20;
          }
          
          const itemTotal = (item.price || 0) * (item.quantity || 0);
          totalAmount += itemTotal;
          
          this.doc.text(item.name || 'Unknown Item', 20, yPosition);
          this.doc.text(String(item.quantity || 0), 80, yPosition);
          this.doc.text(`$${(item.price || 0).toFixed(2)}`, 110, yPosition);
          this.doc.text(`$${itemTotal.toFixed(2)}`, 150, yPosition);
          yPosition += 8;
        });
        
        // Total line
        yPosition += 5;
        this.doc.line(20, yPosition, 190, yPosition);
        yPosition += 10;
        this.doc.setFontSize(14);
        this.doc.text(`TOTAL: $${totalAmount.toFixed(2)}`, 150, yPosition);
        yPosition += 15;
      }

      // Delivery Timeline
      this.doc.setFontSize(16);
      this.doc.text('DELIVERY TIMELINE', 20, yPosition);
      yPosition += 15;
      
      this.doc.setFontSize(12);
      this.doc.text(`• Created: ${new Date(deliveryData.createdAt).toLocaleString()}`, 20, yPosition);
      yPosition += 8;
      
      if (deliveryData.scheduledDate) {
        this.doc.text(`• Scheduled: ${new Date(deliveryData.scheduledDate).toLocaleString()}`, 20, yPosition);
        yPosition += 8;
      }
      
      if (deliveryData.deliveredAt) {
        this.doc.text(`• Delivered: ${new Date(deliveryData.deliveredAt).toLocaleString()}`, 20, yPosition);
        yPosition += 8;
      }

      // Footer
      yPosition += 20;
      this.doc.setFontSize(10);
      this.doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
      this.doc.text(`Business Management System`, 20, yPosition + 5);

      return this.doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async addQRCodeToPDF(qrCodeUrl, yPosition = 200) {
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 100,
        margin: 2
      });

      // Add QR code to PDF
      if (this.doc) {
        this.doc.addImage(qrCodeDataUrl, 'PNG', 20, yPosition, 30, 30);
        this.doc.setFontSize(10);
        this.doc.text('Scan QR Code to access online version', 55, yPosition + 15);
      }
    } catch (error) {
      console.error('Error adding QR code to PDF:', error);
    }
  }

  downloadPDF(filename) {
    if (this.doc) {
      this.doc.save(filename);
    }
  }

  getPDFBlob() {
    if (this.doc) {
      return this.doc.output('blob');
    }
    return null;
  }

  getPDFBase64() {
    if (this.doc) {
      return this.doc.output('datauristring');
    }
    return null;
  }

  // Generate comprehensive order details PDF with table format
  async generateOrderDetailsPDF(orderData, additionalInfo = {}) {
    try {
      this.doc = new jsPDF();
      
      // Header
      this.doc.setFontSize(24);
      this.doc.setTextColor(51, 51, 51);
      this.doc.text('ORDER DETAILS', 20, 30);
      
      // Company info (if provided)
      if (additionalInfo.companyName) {
        this.doc.setFontSize(12);
        this.doc.setTextColor(102, 102, 102);
        this.doc.text(additionalInfo.companyName, 20, 40);
      }
      
      // Order info section
      this.doc.setFontSize(14);
      this.doc.setTextColor(51, 51, 51);
      this.doc.text('Order Information', 20, 60);
      
      // Order details table
      const orderInfoData = [
        ['Order ID', orderData._id || orderData.id || 'N/A'],
        ['Order Number', orderData.orderNumber || 'N/A'],
        ['Customer', orderData.customer?.name || 'N/A'],
        ['Customer Email', orderData.customer?.email || 'N/A'],
        ['Customer Phone', orderData.customer?.phone || 'N/A'],
        ['Status', orderData.status || 'N/A'],
        ['Payment Status', orderData.paymentStatus || 'N/A'],
        ['Payment Method', orderData.paymentMethod || 'N/A'],
        ['Order Date', orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString() : 'N/A'],
        ['Total Amount', orderData.totalAmount ? `$${orderData.totalAmount.toFixed(2)}` : 'N/A']
      ];

      this.doc.autoTable({
        startY: 70,
        head: [['Field', 'Value']],
        body: orderInfoData,
        theme: 'striped',
        headStyles: { fillColor: [63, 127, 191], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 120 }
        }
      });

      // Delivery address section
      let currentY = this.doc.lastAutoTable.finalY + 20;
      if (orderData.deliveryAddress) {
        this.doc.setFontSize(14);
        this.doc.setTextColor(51, 51, 51);
        this.doc.text('Delivery Address', 20, currentY);
        currentY += 10;

        const address = orderData.deliveryAddress;
        const addressData = [
          ['Street', address.street || 'N/A'],
          ['City', address.city || 'N/A'],
          ['State', address.state || 'N/A'],
          ['ZIP Code', address.zip || 'N/A'],
          ['Country', address.country || 'N/A']
        ];

        this.doc.autoTable({
          startY: currentY,
          head: [['Field', 'Value']],
          body: addressData,
          theme: 'striped',
          headStyles: { fillColor: [63, 127, 191], textColor: 255 },
          styles: { fontSize: 10, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 120 }
          }
        });
        currentY = this.doc.lastAutoTable.finalY + 20;
      }

      // Order items section
      if (orderData.items && orderData.items.length > 0) {
        this.doc.setFontSize(14);
        this.doc.setTextColor(51, 51, 51);
        this.doc.text('Order Items', 20, currentY);
        currentY += 10;

        const itemsData = orderData.items.map((item, index) => [
          index + 1,
          item.name || item.product?.name || 'Unknown Item',
          item.quantity || 0,
          item.price ? `$${item.price.toFixed(2)}` : '$0.00',
          item.quantity && item.price ? `$${(item.quantity * item.price).toFixed(2)}` : '$0.00'
        ]);

        this.doc.autoTable({
          startY: currentY,
          head: [['#', 'Item Name', 'Quantity', 'Price', 'Total']],
          body: itemsData,
          theme: 'striped',
          headStyles: { fillColor: [63, 127, 191], textColor: 255 },
          styles: { fontSize: 10, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 80 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
          }
        });

        // Total row
        this.doc.autoTable({
          startY: this.doc.lastAutoTable.finalY + 2,
          body: [['', '', '', 'TOTAL:', `$${orderData.totalAmount?.toFixed(2) || '0.00'}`]],
          theme: 'plain',
          styles: { 
            fontSize: 12, 
            fontStyle: 'bold',
            cellPadding: 3,
            fillColor: [240, 240, 240]
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 80 },
            2: { cellWidth: 25 },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
          }
        });
        currentY = this.doc.lastAutoTable.finalY + 20;
      }

      // Notes section
      if (orderData.notes) {
        this.doc.setFontSize(14);
        this.doc.setTextColor(51, 51, 51);
        this.doc.text('Notes', 20, currentY);
        currentY += 10;

        this.doc.setFontSize(10);
        const noteLines = this.doc.splitTextToSize(orderData.notes, 170);
        noteLines.forEach(line => {
          this.doc.text(line, 20, currentY);
          currentY += 6;
        });
        currentY += 10;
      }

      // Footer
      const pageHeight = this.doc.internal.pageSize.height;
      this.doc.setFontSize(10);
      this.doc.setTextColor(102, 102, 102);
      this.doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 20);
      this.doc.text('Business Management System', 20, pageHeight - 10);

      return this.doc;
    } catch (error) {
      console.error('Error generating order details PDF:', error);
      throw error;
    }
  }
}

export default PDFService;
