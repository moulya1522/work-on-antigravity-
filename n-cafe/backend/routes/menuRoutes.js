const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getMenuItems);
router.get('/:id', getMenuItemById);
router.post('/', protect, upload.single('image'), createMenuItem);
router.put('/:id', protect, upload.single('image'), updateMenuItem);
router.patch('/:id/toggle-availability', protect, toggleAvailability);
router.delete('/:id', protect, authorize('admin'), deleteMenuItem);

module.exports = router;
