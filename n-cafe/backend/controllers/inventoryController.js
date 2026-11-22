const InventoryItem = require('../models/InventoryItem');
const { logActivity } = require('../utils/logger');

// @route   GET /api/inventory
// @desc    Get inventory items, optional low-stock filter
// @access  Private (Staff/Admin)
const getInventoryItems = async (req, res, next) => {
  try {
    const { lowStockOnly, search } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let items = await InventoryItem.find(query).sort({ name: 1 });

    if (lowStockOnly === 'true') {
      items = items.filter(item => item.quantity <= item.minStockLevel);
    }

    const lowStockCount = await InventoryItem.countDocuments({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    });

    res.status(200).json({
      success: true,
      count: items.length,
      lowStockCount,
      items
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/inventory/:id
// @desc    Get single inventory item
// @access  Private (Staff/Admin)
const getInventoryItemById = async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }
    res.status(200).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/inventory
// @desc    Add new inventory item
// @access  Private (Staff/Admin)
const createInventoryItem = async (req, res, next) => {
  try {
    const { name, quantity, unit, minStockLevel, supplier, supplierContact, purchasePrice } = req.body;

    const item = await InventoryItem.create({
      name,
      quantity: Number(quantity) || 0,
      unit: unit || 'kg',
      minStockLevel: Number(minStockLevel) || 5,
      supplier: supplier || '',
      supplierContact: supplierContact || '',
      purchasePrice: Number(purchasePrice) || 0
    });

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Added ingredient: ${item.name} (${item.quantity} ${item.unit})`,
      category: 'inventory'
    });

    res.status(201).json({
      success: true,
      message: 'Ingredient added successfully',
      item
    });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private (Staff/Admin)
const updateInventoryItem = async (req, res, next) => {
  try {
    const { name, quantity, unit, minStockLevel, supplier, supplierContact, purchasePrice } = req.body;

    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      {
        name,
        quantity: Number(quantity),
        unit,
        minStockLevel: Number(minStockLevel),
        supplier,
        supplierContact,
        purchasePrice: Number(purchasePrice)
      },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Updated ingredient: ${item.name}`,
      category: 'inventory'
    });

    res.status(200).json({
      success: true,
      message: 'Ingredient updated successfully',
      item
    });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/inventory/:id/adjust
// @desc    Quick stock adjustment (Restock add / waste deduct)
// @access  Private (Staff/Admin)
const adjustStock = async (req, res, next) => {
  try {
    const { adjustmentAmount, type = 'add', note = '' } = req.body;
    const amount = Number(adjustmentAmount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive adjustment amount'
      });
    }

    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }

    const previousQty = item.quantity;
    if (type === 'add') {
      item.quantity += amount;
      item.lastRestocked = new Date();
    } else if (type === 'deduct') {
      if (item.quantity < amount) {
        return res.status(400).json({
          success: false,
          message: `Cannot deduct ${amount} ${item.unit}. Available quantity is only ${item.quantity} ${item.unit}`
        });
      }
      item.quantity -= amount;
    }

    await item.save();

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `${type === 'add' ? 'Restocked' : 'Deducted'} ${amount} ${item.unit} of ${item.name} (${note || 'Stock adjustment'})`,
      category: 'inventory',
      details: { previousQty, newQty: item.quantity, type, note }
    });

    res.status(200).json({
      success: true,
      message: `Stock updated for ${item.name}. Current quantity: ${item.quantity} ${item.unit}`,
      item
    });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private (Admin)
const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }

    await logActivity({
      user: req.user._id,
      userName: req.user.name,
      action: `Deleted ingredient: ${item.name}`,
      category: 'inventory'
    });

    res.status(200).json({
      success: true,
      message: 'Ingredient removed from inventory'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  deleteInventoryItem
};
