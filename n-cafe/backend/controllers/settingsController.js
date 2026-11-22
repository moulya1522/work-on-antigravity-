const CafeSettings = require('../models/CafeSettings');
const { logActivity } = require('../utils/logger');

// @route   GET /api/settings
// @desc    Get cafe settings
// @access  Public / Private
const getSettings = async (req, res, next) => {
  try {
    let settings = await CafeSettings.findOne();
    if (!settings) {
      settings = await CafeSettings.create({
        cafeName: 'N CAFÉ',
        tagline: 'Brewed to Perfection',
        address: 'Plot 42, Coffee Boulevard, Indiranagar, Bengaluru, Karnataka 560038',
        phone: '+91 98765 43210',
        email: 'contact@ncafe.in',
        currency: 'INR',
        currencySymbol: '₹',
        taxRate: 5,
        orderPrefix: 'NC-'
      });
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/settings
// @desc    Update cafe settings
// @access  Private (Admin only)
const updateSettings = async (req, res, next) => {
  try {
    const {
      cafeName,
      tagline,
      address,
      phone,
      email,
      currency,
      currencySymbol,
      taxRate,
      orderPrefix
    } = req.body;

    let settings = await CafeSettings.findOne();
    if (!settings) {
      settings = new CafeSettings();
    }

    if (cafeName) settings.cafeName = cafeName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (address !== undefined) settings.address = address;
    if (phone !== undefined) settings.phone = phone;
    if (email !== undefined) settings.email = email;
    if (currency) settings.currency = currency;
    if (currencySymbol) settings.currencySymbol = currencySymbol;
    if (taxRate !== undefined) settings.taxRate = Number(taxRate);
    if (orderPrefix) settings.orderPrefix = orderPrefix;

    if (req.file) {
      settings.logo = `/uploads/${req.file.filename}`;
    }

    await settings.save();

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: 'Updated café system settings and configuration',
      category: 'settings'
    });

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
