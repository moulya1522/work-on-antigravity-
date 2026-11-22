const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
      maxlength: [80, 'Ingredient name cannot exceed 80 characters']
    },
    quantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      trim: true,
      enum: ['kg', 'g', 'L', 'ml', 'pcs', 'packets', 'boxes', 'bottles'],
      default: 'kg'
    },
    minStockLevel: {
      type: Number,
      required: [true, 'Minimum stock level is required'],
      min: [0, 'Minimum stock level cannot be negative'],
      default: 5
    },
    supplier: {
      type: String,
      trim: true,
      default: ''
    },
    supplierContact: {
      type: String,
      trim: true,
      default: ''
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
      default: 0
    },
    lastRestocked: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

inventoryItemSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.minStockLevel;
});

inventoryItemSchema.set('toJSON', { virtuals: true });
inventoryItemSchema.set('toObject', { virtuals: true });

const { createDualModel } = require('./dbAdapter');
module.exports = createDualModel('InventoryItem', 'inventoryitems', mongoose.model('InventoryItem', inventoryItemSchema));
