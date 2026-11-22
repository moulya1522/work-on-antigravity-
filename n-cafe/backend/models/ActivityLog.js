const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: {
      type: String,
      default: 'System'
    },
    action: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['order', 'menu', 'inventory', 'staff', 'settings', 'auth'],
      default: 'order'
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ createdAt: -1 });

const { createDualModel } = require('./dbAdapter');
module.exports = createDualModel('ActivityLog', 'activitylogs', mongoose.model('ActivityLog', activityLogSchema));
