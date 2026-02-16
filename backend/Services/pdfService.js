 import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const generateInvoicePDF = async (order, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50 
      });

      // Pipe to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add company header
      doc
        .fontSize(24)
        .fillColor('#667eea')
        .text('PREMIUM T-SHIRT STORE', 50, 50, { align: 'center' })
        .fontSize(10)
        .fillColor('#666')
        .text('Quality You Can Wear', { align: 'center' })
        .moveDown();

      // Add horizontal line
      doc
        .strokeColor('#667eea')
        .lineWidth(2)
        .moveTo(50, 120)
        .lineTo(550, 120)
        .stroke();

      // Invoice title and order number
      doc
        .fontSize(20)
        .fillColor('#333')
        .text('INVOICE', 50, 140)
        .fontSize(12)
        .text(`Order #${order.orderNumber}`, 50, 170)
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 190);

      // Status badge
      const statusColor = {
        'Pending': '#FFA500',
        'Confirmed': '#4169E1',
        'Shipped': '#9370DB',
        'Delivered': '#32CD32',
        'Cancelled': '#DC143C'
      };
      
      doc
        .fontSize(10)
        .fillColor(statusColor[order.status] || '#666')
        .text(`Status: ${order.status}`, 400, 170);

      // Customer information
      doc
        .fontSize(12)
        .fillColor('#333')
        .text('Bill To:', 50, 230)
        .fontSize(10)
        .text(order.customer.name, 50, 250)
        .text(order.customer.email, 50, 265)
        .text(order.customer.phone, 50, 280)
        .text(order.customer.address.street, 50, 300)
        .text(`${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zipCode}`, 50, 315)
        .text(order.customer.address.country, 50, 330);

      // Table header
      const tableTop = 380;
      doc
        .fontSize(10)
        .fillColor('#fff')
        .rect(50, tableTop, 500, 25)
        .fill('#667eea');

      doc
        .fillColor('#fff')
        .text('Item', 60, tableTop + 8)
        .text('Color', 230, tableTop + 8)
        .text('Size', 310, tableTop + 8)
        .text('Qty', 370, tableTop + 8)
        .text('Price', 420, tableTop + 8)
        .text('Total', 490, tableTop + 8);

      // Table rows
      let yPosition = tableTop + 35;
      let subtotal = 0;

      order.items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        // Alternate row colors
        if (index % 2 === 0) {
          doc
            .fillColor('#f9f9f9')
            .rect(50, yPosition - 5, 500, 25)
            .fill();
        }

        doc
          .fillColor('#333')
          .fontSize(9)
          .text(item.productName.substring(0, 25), 60, yPosition)
          .text(item.color, 230, yPosition)
          .text(item.size, 310, yPosition)
          .text(item.quantity.toString(), 370, yPosition)
          .text(`₹${item.price}`, 420, yPosition)
          .text(`₹${itemTotal}`, 490, yPosition);

        yPosition += 30;
      });

      // Add line after items
      doc
        .strokeColor('#ddd')
        .lineWidth(1)
        .moveTo(50, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      // Totals
      yPosition += 20;
      doc
        .fontSize(10)
        .fillColor('#333')
        .text('Subtotal:', 380, yPosition)
        .text(`₹${subtotal}`, 490, yPosition);

      yPosition += 20;
      const tax = 0; // You can add tax calculation here
      doc
        .text('Tax (0%):', 380, yPosition)
        .text(`₹${tax}`, 490, yPosition);

      yPosition += 20;
      doc
        .strokeColor('#667eea')
        .lineWidth(1)
        .moveTo(380, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      yPosition += 15;
      doc
        .fontSize(14)
        .fillColor('#667eea')
        .text('Total:', 380, yPosition)
        .text(`₹${order.totalAmount}`, 490, yPosition);

      // Payment information
      yPosition += 40;
      doc
        .fontSize(10)
        .fillColor('#666')
        .text(`Payment Method: ${order.paymentMethod}`, 50, yPosition)
        .text(`Payment Status: ${order.paymentStatus}`, 50, yPosition + 15);

      // Footer
      const footerY = 720;
      doc
        .fontSize(9)
        .fillColor('#999')
        .text('Thank you for your business!', 50, footerY, { align: 'center' })
        .text('For support, contact: support@premiumtshirts.com', { align: 'center' })
        .text('www.premiumtshirts.com', { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

export {
  generateInvoicePDF
};