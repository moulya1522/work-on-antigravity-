const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.post('/', protect, createOrder);
router.patch('/:id/status', protect, updateOrderStatus);
router.patch('/:id/payment', protect, updatePaymentStatus);
router.post('/:id/cancel', protect, cancelOrder);

module.exports = router;
