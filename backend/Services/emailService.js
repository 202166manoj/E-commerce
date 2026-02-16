 import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Email templates
const emailTemplates = {
  orderConfirmation: (order) => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item { border-bottom: 1px solid #eee; padding: 15px 0; }
          .item:last-child { border-bottom: none; }
          .total { font-size: 20px; font-weight: bold; color: #667eea; text-align: right; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Order Confirmed!</h1>
            <p>Thank you for shopping with us</p>
          </div>
          <div class="content">
            <h2>Hello ${order.customer.name}!</h2>
            <p>Your order has been successfully placed and is being processed.</p>
            
            <div class="order-details">
              <h3>Order #${order.orderNumber}</h3>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              
              <h4>Items Ordered:</h4>
              ${order.items.map(item => `
                <div class="item">
                  <strong>${item.productName}</strong><br>
                  Color: ${item.color} | Size: ${item.size} | Qty: ${item.quantity}<br>
                  Price: ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}
                </div>
              `).join('')}
              
              <div class="total">
                Total Amount: ₹${order.totalAmount}
              </div>
            </div>
            
            <h4>Shipping Address:</h4>
            <p>
              ${order.customer.address.street}<br>
              ${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zipCode}<br>
              ${order.customer.address.country}
            </p>
            
            <p style="margin-top: 30px;">We'll send you another email when your order ships!</p>
          </div>
          <div class="footer">
            <p>Premium T-Shirt Store | Quality You Can Wear</p>
            <p>For any questions, reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  orderShipped: (order) => ({
    subject: `Your Order is On The Way! - ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Your Order Has Shipped!</h1>
            <p>Get ready to receive your premium t-shirts</p>
          </div>
          <div class="content">
            <h2>Hi ${order.customer.name}!</h2>
            <p>Great news! Your order is on its way to you.</p>
            
            <div class="info-box">
              <h3>Order #${order.orderNumber}</h3>
              <p><strong>Shipped On:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Expected Delivery:</strong> 3-5 business days</p>
              
              <h4>Shipping To:</h4>
              <p>
                ${order.customer.address.street}<br>
                ${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zipCode}
              </p>
            </div>
            
            <p style="margin-top: 30px;">Your premium quality t-shirts are carefully packed and on their way!</p>
          </div>
          <div class="footer">
            <p>Premium T-Shirt Store | Quality You Can Wear</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  orderDelivered: (order) => ({
    subject: `Order Delivered Successfully! - ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .celebration { text-align: center; font-size: 60px; margin: 20px 0; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .discount { background: #4facfe; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .discount-code { font-size: 24px; font-weight: bold; background: white; color: #4facfe; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Delivered Successfully!</h1>
            <p>We hope you love your new t-shirts</p>
          </div>
          <div class="content">
            <div class="celebration">🎊</div>
            
            <h2>Hello ${order.customer.name}!</h2>
            <p>Your order has been successfully delivered! We hope you're loving your premium quality t-shirts.</p>
            
            <div class="info-box">
              <h3>Order #${order.orderNumber}</h3>
              <p><strong>Delivered On:</strong> ${new Date(order.deliveredAt || Date.now()).toLocaleDateString()}</p>
              <p><strong>Total Items:</strong> ${order.items.reduce((sum, item) => sum + item.quantity, 0)} pieces</p>
            </div>
            
            <div class="discount">
              <h3>🎁 Special Thank You Gift!</h3>
              <p>As a token of appreciation, here's a discount code for your next purchase:</p>
              <div class="discount-code">THANKYOU10</div>
              <p>Get 10% off on your next order!</p>
              <p style="font-size: 12px; margin-top: 10px;">Valid for 30 days</p>
            </div>
            
            <p><strong>How was your experience?</strong></p>
            <p>We'd love to hear your feedback! Your review helps us serve you better.</p>
            
            <p style="margin-top: 30px;">Thank you for choosing us. We look forward to serving you again!</p>
          </div>
          <div class="footer">
            <p>Premium T-Shirt Store | Quality You Can Wear</p>
            <p>Questions? Reply to this email or contact us anytime</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email
const sendOrderConfirmation = async (order) => {
  const { subject, html } = emailTemplates.orderConfirmation(order);
  return await sendEmail(order.customer.email, subject, html);
};

// Send order shipped email
const sendOrderShipped = async (order) => {
  const { subject, html } = emailTemplates.orderShipped(order);
  return await sendEmail(order.customer.email, subject, html);
};

// Send order delivered email
const sendOrderDelivered = async (order) => {
  const { subject, html } = emailTemplates.orderDelivered(order);
  return await sendEmail(order.customer.email, subject, html);
};

export {
  sendEmail,
  sendOrderConfirmation,
  sendOrderShipped,
  sendOrderDelivered
};