const Order = require('../models/Order');

// @route   GET /api/reports
// @desc    Get detailed sales & performance analytics
// @access  Private (Staff/Admin)
const getReports = async (req, res, next) => {
  try {
    const { period = 'last30days', startDate, endDate } = req.query;
    const now = new Date();
    let start = new Date();
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (period === 'last7days') {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'last30days') {
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default last 30 days
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    const matchFilter = {
      status: { $ne: 'Cancelled' },
      createdAt: { $gte: start, $lte: end }
    };

    // 1. Overall Summary in selected range
    const summaryAgg = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          totalDiscount: { $sum: '$discount' },
          totalTax: { $sum: '$tax' }
        }
      }
    ]);

    const totalRevenue = summaryAgg[0]?.totalRevenue || 0;
    const totalOrders = summaryAgg[0]?.totalOrders || 0;
    const totalDiscount = summaryAgg[0]?.totalDiscount || 0;
    const totalTax = summaryAgg[0]?.totalTax || 0;
    const averageOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

    // 2. Timeline Series for Charts (grouped by date)
    const timelineAgg = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          discount: { $sum: '$discount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const salesTrend = timelineAgg.map(item => ({
      date: item._id,
      label: new Date(item._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: Math.round(item.revenue * 100) / 100,
      orders: item.orders,
      discount: Math.round(item.discount * 100) / 100
    }));

    // 3. Payment Method Breakdown (Cash, UPI, Card)
    const paymentAgg = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    const paymentBreakdown = ['UPI', 'Card', 'Cash'].map(method => {
      const found = paymentAgg.find(p => p._id === method);
      return {
        name: method,
        amount: found ? Math.round(found.amount * 100) / 100 : 0,
        count: found ? found.count : 0
      };
    });

    // 4. Product Sales Performance (unwind items)
    const productAgg = await Order.aggregate([
      { $match: matchFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 }
    ]);

    const topProducts = productAgg.map(p => ({
      name: p._id,
      quantity: p.quantity,
      revenue: Math.round(p.revenue * 100) / 100
    }));

    // 5. Order Status Distribution in range
    const statusAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusBreakdown = statusAgg.map(s => ({
      status: s._id,
      count: s.count
    }));

    res.status(200).json({
      success: true,
      period,
      dateRange: {
        from: start.toISOString(),
        to: end.toISOString()
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        averageOrderValue,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100
      },
      salesTrend,
      paymentBreakdown,
      topProducts,
      statusBreakdown
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReports
};
