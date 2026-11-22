const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ user, userName, action, category = 'order', details = {} }) => {
  try {
    await ActivityLog.create({
      user: user?._id || user || null,
      userName: userName || user?.name || 'System',
      action,
      category,
      details
    });
  } catch (err) {
    console.error('[ActivityLog Error]:', err.message);
  }
};

module.exports = { logActivity };
