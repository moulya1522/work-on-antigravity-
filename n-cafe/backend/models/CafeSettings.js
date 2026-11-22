const mongoose = require('mongoose');

const cafeSettingsSchema = new mongoose.Schema(
  {
    cafeName: {
      type: String,
      required: true,
      default: 'N CAFÉ'
    },
    tagline: {
      type: String,
      default: 'Brewed to Perfection'
    },
    logo: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: 'Plot 42, Coffee Boulevard, Indiranagar, Bengaluru, Karnataka 560038'
    },
    phone: {
      type: String,
      default: '+91 98765 43210'
    },
    email: {
      type: String,
      default: 'contact@ncafe.in'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    currencySymbol: {
      type: String,
      default: '₹'
    },
    taxRate: {
      type: Number,
      default: 5
    },
    orderPrefix: {
      type: String,
      default: 'NC-'
    }
  },
  {
    timestamps: true
  }
);

const { createDualModel } = require('./dbAdapter');
module.exports = createDualModel('CafeSettings', 'cafesettings', mongoose.model('CafeSettings', cafeSettingsSchema));
