const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { logActivity } = require('../utils/logger');

// @route   GET /api/customers
// @desc    Get all customers with search and pagination
// @access  Private (Staff/Admin)
const getCustomers = async (req, res, next) => {
  try {
    const { search, limit = 50, page = 1 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      customers
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/customers/:id
// @desc    Get single customer and their order history
// @access  Private (Staff/Admin)
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orders = await Order.find({
      $or: [
        { 'customer.customerId': customer._id },
        { 'customer.phone': customer.phone }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    res.status(200).json({
      success: true,
      customer,
      orders
    });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/customers
// @desc    Add customer manually
// @access  Private (Staff/Admin)
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required'
      });
    }

    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this phone number already exists'
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      notes: notes || ''
    });

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Added new customer: ${customer.name} (${customer.phone})`,
      category: 'order'
    });

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      customer
    });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/customers/:id
// @desc    Update customer details
// @access  Private (Staff/Admin)
const updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, notes } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (phone && phone !== customer.phone) {
      const existing = await Customer.findOne({ phone: phone.trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Another customer is already registered with this phone number'
        });
      }
      customer.phone = phone.trim();
    }

    if (name) customer.name = name.trim();
    if (email !== undefined) customer.email = email.trim();
    if (notes !== undefined) customer.notes = notes;

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer
    });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private (Admin only)
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
