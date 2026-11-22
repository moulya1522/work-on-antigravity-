const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const { logActivity } = require('../utils/logger');

// @route   GET /api/menu
// @desc    Get all menu items with search and filters
// @access  Public / Private
const getMenuItems = async (req, res, next) => {
  try {
    const { category, search, available, dietary } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.categoryName = new RegExp(`^${category}$`, 'i');
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (available !== undefined && available !== '') {
      query.isAvailable = available === 'true';
    }

    if (dietary && dietary !== 'All') {
      query.dietary = dietary;
    }

    const items = await MenuItem.find(query).sort({ categoryName: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: items.length,
      items
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/menu/:id
// @desc    Get single menu item
// @access  Public / Private
const getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.status(200).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/menu
// @desc    Create menu item (image upload supported)
// @access  Private (Staff/Admin)
const createMenuItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      categoryName,
      isAvailable,
      preparationTime,
      dietary,
      isPopular,
      imageUrl
    } = req.body;

    let image = imageUrl || '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    // Find category ID if exists
    let categoryId = null;
    if (categoryName) {
      const cat = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
      if (cat) categoryId = cat._id;
    }

    const item = await MenuItem.create({
      name,
      description,
      price: Number(price),
      category: categoryId,
      categoryName,
      image,
      isAvailable: isAvailable !== undefined ? String(isAvailable) === 'true' : true,
      preparationTime: preparationTime ? Number(preparationTime) : 5,
      dietary: dietary || 'Veg',
      isPopular: String(isPopular) === 'true'
    });

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Added new menu item: ${item.name} (₹${item.price})`,
      category: 'menu',
      details: { itemId: item._id, name: item.name }
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      item
    });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/menu/:id
// @desc    Update menu item
// @access  Private (Staff/Admin)
const updateMenuItem = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }

    if (updates.price) updates.price = Number(updates.price);
    if (updates.preparationTime) updates.preparationTime = Number(updates.preparationTime);
    if (updates.isAvailable !== undefined) updates.isAvailable = String(updates.isAvailable) === 'true';
    if (updates.isPopular !== undefined) updates.isPopular = String(updates.isPopular) === 'true';

    if (updates.categoryName) {
      const cat = await Category.findOne({ name: new RegExp(`^${updates.categoryName}$`, 'i') });
      if (cat) updates.category = cat._id;
    }

    const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Updated menu item: ${item.name}`,
      category: 'menu',
      details: { itemId: item._id }
    });

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      item
    });
  } catch (err) {
    next(err);
  }
};

// @route   PATCH /api/menu/:id/toggle-availability
// @desc    Toggle item availability (Available / Out of Stock)
// @access  Private (Staff/Admin)
const toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Changed ${item.name} status to ${item.isAvailable ? 'Available' : 'Unavailable'}`,
      category: 'menu'
    });

    res.status(200).json({
      success: true,
      message: `${item.name} is now ${item.isAvailable ? 'Available' : 'Unavailable'}`,
      isAvailable: item.isAvailable,
      item
    });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/menu/:id
// @desc    Delete menu item
// @access  Private (Admin)
const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Deleted menu item: ${item.name}`,
      category: 'menu'
    });

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem
};
