const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Customer = require('../models/Customer');
const CafeSettings = require('../models/CafeSettings');
const { logActivity } = require('../utils/logger');

// Generate unique sequential order number
const generateOrderNumber = async () => {
  const settings = await CafeSettings.findOne() || { orderPrefix: 'NC-' };
  const prefix = settings.orderPrefix || 'NC-';

  // Count total orders to compute sequence
  const latestOrder = await Order.findOne().sort({ createdAt: -1 });
  let seq = 1001;

  if (latestOrder && latestOrder.orderNumber) {
    const parts = latestOrder.orderNumber.replace(prefix, '');
    const num = parseInt(parts, 10);
    if (!isNaN(num)) {
      seq = num + 1;
    }
  }

  return `${prefix}${seq}`;
};

// @route   GET /api/orders
// @desc    Get orders with filters & pagination
// @access  Private (Staff/Admin)
const getOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, paymentMethod, search, date, limit = 100, page = 1 } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('items.menuItem', 'name price image categoryName');

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      orders
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private (Staff/Admin)
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem', 'name price image categoryName')
      .populate('createdBy', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/orders
// @desc    Create a new café order
// @access  Private (Staff/Admin)
const createOrder = async (req, res, next) => {
  try {
    const {
      customer = {},
      items = [],
      discount = 0,
      discountType = 'fixed',
      paymentMethod = 'UPI',
      paymentStatus = 'Paid',
      notes = ''
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item'
      });
    }

    // Get settings for tax rate
    const settings = await CafeSettings.findOne() || { taxRate: 5 };
    const taxRate = settings.taxRate || 5;

    // Calculate subtotal & prepare item lines
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const price = parseFloat(item.price) || 0;
      const lineSubtotal = Math.round(price * qty * 100) / 100;
      subtotal += lineSubtotal;

      processedItems.push({
        menuItem: item.menuItem || item._id,
        name: item.name,
        price,
        quantity: qty,
        subtotal: lineSubtotal,
        notes: item.notes || ''
      });

      // Increment menuItem salesCount
      if (item.menuItem || item._id) {
        await MenuItem.findByIdAndUpdate(item.menuItem || item._id, {
          $inc: { salesCount: qty }
        }).catch(e => console.warn('MenuItem salesCount update failed:', e.message));
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = Math.round(((subtotal * (parseFloat(discount) || 0)) / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const tax = Math.round(((discountedSubtotal * taxRate) / 100) * 100) / 100;
    const total = Math.round((discountedSubtotal + tax) * 100) / 100;

    // Handle Customer record
    let customerDoc = null;
    if (customer.phone && customer.phone.trim()) {
      const cleanPhone = customer.phone.trim();
      customerDoc = await Customer.findOne({ phone: cleanPhone });
      if (!customerDoc) {
        customerDoc = await Customer.create({
          name: customer.name ? customer.name.trim() : 'Guest',
          phone: cleanPhone,
          email: customer.email ? customer.email.trim() : '',
          totalOrders: 1,
          totalSpent: total,
          lastOrderDate: new Date()
        });
      } else {
        customerDoc.totalOrders += 1;
        customerDoc.totalSpent = Math.round((customerDoc.totalSpent + total) * 100) / 100;
        customerDoc.lastOrderDate = new Date();
        if (customer.name && customer.name !== 'Guest') {
          customerDoc.name = customer.name.trim();
        }
        if (customer.email) {
          customerDoc.email = customer.email.trim();
        }
        await customerDoc.save();
      }
    }

    const orderNumber = await generateOrderNumber();

    const newOrder = await Order.create({
      orderNumber,
      customer: {
        customerId: customerDoc ? customerDoc._id : null,
        name: customer.name?.trim() || (customerDoc ? customerDoc.name : 'Walk-in Customer'),
        phone: customer.phone?.trim() || '',
        email: customer.email?.trim() || ''
      },
      items: processedItems,
      subtotal,
      discount: discountAmount,
      discountType,
      tax,
      taxRate,
      total,
      paymentMethod,
      paymentStatus,
      status: 'Pending',
      notes,
      createdBy: req.user?._id,
      createdByName: req.user?.name || 'Staff'
    });

    await logActivity({
      user: req.user?._id,
      userName: req.user?.name || 'Staff',
      action: `Created Order #${newOrder.orderNumber} (₹${newOrder.total})`,
      category: 'order',
      details: { orderId: newOrder._id, orderNumber: newOrder.orderNumber, total: newOrder.total }
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (err) {
    next(err);
  }
};

// @route   PATCH /api/orders/:id/status
// @desc    Update order status (Pending -> Preparing -> Ready -> Completed -> Cancelled)
// @access  Private (Staff/Admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (status === 'Completed') {
      order.completedAt = new Date();
      if (order.paymentStatus === 'Unpaid') {
        order.paymentStatus = 'Paid';
      }
    }

    await order.save();

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Order #${order.orderNumber} status changed to ${status}`,
      category: 'order',
      details: { orderId: order._id, status }
    });

    res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} marked as ${status}`,
      order
    });
  } catch (err) {
    next(err);
  }
};

// @route   PATCH /api/orders/:id/payment
// @desc    Update order payment status (Paid, Unpaid, Refunded)
// @access  Private (Staff/Admin)
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    const validPaymentStatuses = ['Unpaid', 'Paid', 'Refunded'];

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;

    await order.save();

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Order #${order.orderNumber} payment updated to ${order.paymentStatus} (${order.paymentMethod})`,
      category: 'order'
    });

    res.status(200).json({
      success: true,
      message: 'Payment status updated',
      order
    });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/orders/:id/cancel
// @desc    Cancel an order with reason
// @access  Private (Staff/Admin)
const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    order.status = 'Cancelled';
    order.cancellationReason = reason || 'Cancelled by staff/admin';
    order.cancelledAt = new Date();

    if (order.paymentStatus === 'Paid') {
      order.paymentStatus = 'Refunded';
    }

    await order.save();

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Cancelled Order #${order.orderNumber} (Reason: ${order.cancellationReason})`,
      category: 'order'
    });

    res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} has been cancelled`,
      order
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder
};
