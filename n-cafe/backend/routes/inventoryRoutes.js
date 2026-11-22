const express = require('express');
const router = express.Router();
const {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  deleteInventoryItem
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getInventoryItems);
router.get('/:id', protect, getInventoryItemById);
router.post('/', protect, createInventoryItem);
router.put('/:id', protect, updateInventoryItem);
router.post('/:id/adjust', protect, adjustStock);
router.delete('/:id', protect, authorize('admin'), deleteInventoryItem);

module.exports = router;
