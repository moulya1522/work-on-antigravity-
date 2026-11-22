const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    customer: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      },
      name: {
        type: String,
        default: 'Walk-in Customer'
      },
      phone: {
        type: String,
        default: ''
      },
      email: {
        type: String,
        default: ''
      }
    },
    items: {
      type: [orderItemSchema],
      validate: [val => val.length > 0, 'Order must contain at least one item']
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed'
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    taxRate: {
      type: Number,
      default: 5 // percent
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card'],
      required: true,
      default: 'UPI'
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Refunded'],
      default: 'Paid'
    },
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    notes: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    cancelledAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdByName: {
      type: String,
      default: 'Staff'
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

const { createDualModel } = require('./dbAdapter');
module.exports = createDualModel('Order', 'orders', mongoose.model('Order', orderSchema));
