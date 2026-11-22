const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false
    },
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    image: {
      type: String,
      default: ''
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    preparationTime: {
      type: Number,
      default: 5 // in minutes
    },
    dietary: {
      type: String,
      enum: ['Veg', 'Non-Veg', 'Egg', 'Vegan'],
      default: 'Veg'
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    salesCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ categoryName: 1, isAvailable: 1 });

const { createDualModel } = require('./dbAdapter');
module.exports = createDualModel('MenuItem', 'menuitems', mongoose.model('MenuItem', menuItemSchema));
