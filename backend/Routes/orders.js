const express = require('express');
const router = express.Router();
const Order = require('../Models/Order.js');
const Product = require('../Models/Product.js');
const { authenticateAdmin } = require('../middleware/authMiddleware');
const { sendOrderConfirmation, sendOrderShipped, sendOrderDelivered } = require('../services/emailService');
const { generateInvoicePDF } = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

// @route   POST /api/orders
// @desc    Create new order
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { customer, items, paymentMethod } = req.body;

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      // Check stock availability
      if (!product.checkStock(item.color, item.size, item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} - ${item.color} - ${item.size}`
        });
      }

      // Reduce stock
      product.reduceStock(item.color, item.size, item.quantity);
      await product.save();

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        productName: product.name,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: product.price,
        image: product.images[0] || ''
      });
    }

    // Create order
    const order = new Order({
      customer,
      items: orderItems,
      totalAmount,
      paymentMethod: paymentMethod || 'COD'
    });

    await order.save();

    // Populate product details for email
    await order.populate('items.product');

    // Send confirmation email
    try {
      await sendOrderConfirmation(order);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (Admin)
// @access  Private (Admin)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 50 } = req.query;
    
    let query = {};
    
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('items.product')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private (Admin)
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (triggers email)
// @access  Private (Admin)
router.put('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id).populate('items.product');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    if (note) {
      order.notes = note;
    }

    await order.save();

    // Send appropriate email based on status change
    try {
      if (status === 'Shipped' && oldStatus !== 'Shipped') {
        await sendOrderShipped(order);
      } else if (status === 'Delivered' && oldStatus !== 'Delivered') {
        await sendOrderDelivered(order);
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/orders/:id/invoice
// @desc    Generate and download invoice PDF
// @access  Private (Admin)
router.get('/:id/invoice', authenticateAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Create invoices directory if it doesn't exist
    const invoiceDir = path.join(__dirname, '../invoices');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    const fileName = `invoice-${order.orderNumber}.pdf`;
    const filePath = path.join(invoiceDir, fileName);

    // Generate PDF
    await generateInvoicePDF(order, filePath);

    // Send file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading invoice'
        });
      }
      
      // Optionally delete file after download
      // fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/orders/stats/dashboard
// @desc    Get order statistics for dashboard
// @access  Private (Admin)
router.get('/stats/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Order.aggregate([
      {
        $facet: {
          total: [
            { $count: 'count' }
          ],
          pending: [
            { $match: { status: 'Pending' } },
            { $count: 'count' }
          ],
          confirmed: [
            { $match: { status: 'Confirmed' } },
            { $count: 'count' }
          ],
          shipped: [
            { $match: { status: 'Shipped' } },
            { $count: 'count' }
          ],
          delivered: [
            { $match: { status: 'Delivered' } },
            { $count: 'count' }
          ],
          todayOrders: [
            { $match: { createdAt: { $gte: today } } },
            { $count: 'count' }
          ],
          totalRevenue: [
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]
        }
      }
    ]);

    const result = {
      total: stats[0].total[0]?.count || 0,
      pending: stats[0].pending[0]?.count || 0,
      confirmed: stats[0].confirmed[0]?.count || 0,
      shipped: stats[0].shipped[0]?.count || 0,
      delivered: stats[0].delivered[0]?.count || 0,
      todayOrders: stats[0].todayOrders[0]?.count || 0,
      totalRevenue: stats[0].totalRevenue[0]?.total || 0
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;