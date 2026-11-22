const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const InventoryItem = require('../models/InventoryItem');
const ActivityLog = require('../models/ActivityLog');

// @route   GET /api/dashboard
// @desc    Get comprehensive café metrics & chart feeds
// @access  Private (Staff/Admin)
const getDashboardData = async (req, res, next) => {
  try {
    const now = new Date();

    // Start of today (00:00:00)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Total Metrics
    const nonCancelledMatch = { status: { $ne: 'Cancelled' } };

    const totalSalesAgg = await Order.aggregate([
      { $match: nonCancelledMatch },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalSales = totalSalesAgg[0]?.total || 0;

    const todaySalesAgg = await Order.aggregate([
      {
        $match: {
          ...nonCancelledMatch,
          createdAt: { $gte: startOfToday, $lte: endOfToday }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);
    const todayRevenue = todaySalesAgg[0]?.total || 0;
    const todayOrdersCount = todaySalesAgg[0]?.count || 0;

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: { $in: ['Pending', 'Preparing'] } });
    const completedOrders = await Order.countDocuments({ status: 'Completed' });
    const totalMenuItems = await MenuItem.countDocuments({ isAvailable: true });

    // 2. Low-stock ingredients
    const lowStockItems = await InventoryItem.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    }).limit(6);
    const lowStockCount = await InventoryItem.countDocuments({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    });

    // 3. Best selling items
    const popularItems = await MenuItem.find()
      .sort({ salesCount: -1 })
      .limit(5)
      .select('name price categoryName salesCount image isAvailable');

    // 4. Daily Sales Chart (Last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyOrders = await Order.find({
      ...nonCancelledMatch,
      createdAt: { $gte: sevenDaysAgo }
    }).select('total createdAt');

    const dayMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      dayMap[key] = { key, label, revenue: 0, orders: 0 };
    }

    dailyOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const key = !isNaN(orderDate.getTime()) ? orderDate.toISOString().split('T')[0] : '';
      if (key && dayMap[key]) {
        dayMap[key].revenue = Math.round((dayMap[key].revenue + order.total) * 100) / 100;
        dayMap[key].orders += 1;
      }
    });

    const dailySalesChart = Object.values(dayMap);

    // 5. Weekly Sales Chart (Last 8 weeks)
    const weeklySalesAgg = await Order.aggregate([
      {
        $match: {
          ...nonCancelledMatch,
          createdAt: { $gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $week: '$createdAt' },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const weeklySalesChart = weeklySalesAgg.map(w => ({
      week: `Wk ${w._id}`,
      revenue: Math.round(w.revenue * 100) / 100,
      orders: w.orders
    }));

    // 6. Monthly Sales Chart (Last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlySalesAgg = await Order.aggregate([
      {
        $match: {
          ...nonCancelledMatch,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySalesChart = monthlySalesAgg.map(m => ({
      month: `${monthNames[m._id.month - 1]} ${String(m._id.year).slice(2)}`,
      revenue: Math.round(m.revenue * 100) / 100,
      orders: m.orders
    }));

    // 7. Recent Orders (6 latest)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('orderNumber customer total status paymentMethod paymentStatus createdAt items');

    // 8. Recent Activities (8 latest)
    const recentActivities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      metrics: {
        totalSales: Math.round(totalSales * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        todayOrdersCount,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalMenuItems,
        lowStockCount
      },
      charts: {
        daily: dailySalesChart,
        weekly: weeklySalesChart.length > 0 ? weeklySalesChart : dailySalesChart.map((d, i) => ({ week: `Wk ${i + 1}`, revenue: d.revenue, orders: d.orders })),
        monthly: monthlySalesChart.length > 0 ? monthlySalesChart : [{ month: 'Current', revenue: totalSales, orders: totalOrders }]
      },
      recentOrders,
      popularItems,
      lowStockItems,
      recentActivities
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardData
};
