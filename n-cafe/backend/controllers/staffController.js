const User = require('../models/User');
const { logActivity } = require('../utils/logger');

// @route   GET /api/staff
// @desc    Get all staff members (Admins and Staff)
// @access  Private (Admin only)
const getAllStaff = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    let query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { jobRole: { $regex: search, $options: 'i' } }
      ];
    }

    const staffMembers = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staffMembers.length,
      staff: staffMembers
    });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/staff
// @desc    Add a new staff member
// @access  Private (Admin only)
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role = 'staff', jobRole = 'Barista', phone = '', status = 'active' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const newStaff = await User.create({
      name,
      email,
      password,
      role,
      jobRole,
      phone,
      status
    });

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Created new ${newStaff.role} account: ${newStaff.name} (${newStaff.jobRole})`,
      category: 'staff'
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff: newStaff
    });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/staff/:id
// @desc    Update staff details
// @access  Private (Admin only)
const updateStaff = async (req, res, next) => {
  try {
    const { name, phone, jobRole, role, status, password } = req.body;

    const staff = await User.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Prevent modifying the main admin's role to staff if it's the only admin
    if (staff.role === 'admin' && role === 'staff') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the only administrator account'
        });
      }
    }

    if (name) staff.name = name;
    if (phone !== undefined) staff.phone = phone;
    if (jobRole) staff.jobRole = jobRole;
    if (role) staff.role = role;
    if (status) staff.status = status;
    if (password && password.trim().length >= 6) {
      staff.password = password; // pre-save hook will hash it
    }

    await staff.save();

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Updated details for staff: ${staff.name}`,
      category: 'staff'
    });

    res.status(200).json({
      success: true,
      message: 'Staff details updated successfully',
      staff
    });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/staff/:id
// @desc    Delete a staff member
// @access  Private (Admin only)
const deleteStaff = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const staff = await User.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    if (staff.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only administrator account'
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Removed staff member: ${staff.name}`,
      category: 'staff'
    });

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff
};
