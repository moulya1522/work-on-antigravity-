const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

// All staff management routes are Admin-only
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
