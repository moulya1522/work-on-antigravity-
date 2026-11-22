const Category = require('../models/Category');
const { logActivity } = require('../utils/logger');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public / Private
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/categories
// @desc    Create a category
// @access  Private (Admin)
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, displayOrder } = req.body;

    const existing = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }

    const category = await Category.create({
      name,
      description,
      icon: icon || 'Coffee',
      displayOrder: displayOrder || 0
    });

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Created category: ${category.name}`,
      category: 'menu'
    });

    res.status(201).json({
      success: true,
      category
    });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin)
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Updated category: ${category.name}`,
      category: 'menu'
    });

    res.status(200).json({
      success: true,
      category
    });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Deleted category: ${category.name}`,
      category: 'menu'
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
