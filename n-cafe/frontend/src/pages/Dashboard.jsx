import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Plus,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Receipt
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { ReceiptModal } from '../components/ReceiptModal';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const { formatCurrency, settings } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('Could not load dashboard data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const currentChartData = charts[chartView] || [];

  return (
    <div className="cafe-page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Café Overview & Intelligence</h1>
          <p className="page-subtitle">Real-time revenue, order telemetry, and stock alerts</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchDashboard}
            disabled={loading}
            title="Refresh metrics"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button className="btn btn-amber" onClick={() => navigate('/pos')}>
            <Plus size={18} />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem'
        }}
      >
        {/* Today's Revenue */}
        <div className="cafe-card-elevated" style={{ borderLeft: '4px solid #D97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Today's Revenue
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--cafe-dark)', marginTop: '0.35rem' }}>
                {formatCurrency(metrics.todayRevenue || 0)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <TrendingUp size={14} />
                <span>{metrics.todayOrdersCount || 0} orders today</span>
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="#D97706" />
            </div>
          </div>
        </div>

        {/* Total Lifetime Sales */}
        <div className="cafe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Sales
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--cafe-dark)', marginTop: '0.35rem' }}>
                {formatCurrency(metrics.totalSales || 0)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Across {metrics.totalOrders || 0} lifetime orders
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} color="#2563EB" />
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="cafe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Queue
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', marginTop: '0.35rem' }}>
                {metrics.pendingOrders || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Pending or preparing in kitchen
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#D97706" />
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          className="cafe-card"
          style={{
            borderLeft: metrics.lowStockCount > 0 ? '4px solid #E11D48' : '1px solid var(--cafe-border)',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/inventory')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Stock Alerts
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: metrics.lowStockCount > 0 ? '#E11D48' : '#059669', marginTop: '0.35rem' }}>
                {metrics.lowStockCount || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: metrics.lowStockCount > 0 ? '#BE123C' : '#059669', marginTop: '0.35rem', fontWeight: 500 }}>
                {metrics.lowStockCount > 0 ? 'Ingredients below minimum' : 'All stock healthy'}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '12px', background: metrics.lowStockCount > 0 ? '#FFF1F2' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color={metrics.lowStockCount > 0 ? '#E11D48' : '#059669'} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Sales Performance Chart */}
        <div className="cafe-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--cafe-dark)' }}>
                Sales Trajectory
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Revenue performance across timeframe</div>
            </div>

            <div style={{ display: 'flex', background: '#FAF7F2', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--cafe-border)' }}>
              {['daily', 'weekly', 'monthly'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setChartView(tab)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    borderRadius: '8px',
                    color: chartView === tab ? '#FAF7F2' : 'var(--text-secondary)',
                    background: chartView === tab ? 'var(--cafe-espresso)' : 'transparent',
                    transition: 'var(--transition)'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 280, width: '100%', marginTop: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cafeRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFD5" />
                <XAxis
                  dataKey={chartView === 'daily' ? 'label' : chartView === 'weekly' ? 'week' : 'month'}
                  stroke="#9C8E83"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9C8E83"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A0F08',
                    borderRadius: '8px',
                    border: '1px solid #3D2314',
                    color: '#FCFAF7',
                    fontSize: '0.82rem'
                  }}
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cafeRevenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Menu Items */}
        <div className="cafe-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--cafe-dark)' }}>
                Bestsellers
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Most ordered items</div>
            </div>
            <button
              onClick={() => navigate('/menu')}
              style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <span>Menu</span> <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
            {data?.popularItems?.map((item, idx) => (
              <div
                key={item._id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.75rem',
                  background: '#FAF7F2',
                  borderRadius: '10px',
                  border: '1px solid var(--cafe-border)'
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#EDE4D8',
                    flexShrink: 0
                  }}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Coffee size={18} color="#8C532E" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cafe-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {item.categoryName} • {formatCurrency(item.price)}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D97706' }}>
                    {item.salesCount || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>orders</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders & Recent Activities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Recent Orders Table */}
        <div className="cafe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--cafe-dark)' }}>
                Recent Café Orders
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live customer orders placed</div>
            </div>
            <button
              onClick={() => navigate('/orders')}
              style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <span>View All</span> <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="cafe-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders?.map((ord) => (
                  <tr key={ord._id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--cafe-dark)', fontFamily: 'var(--font-mono)' }}>
                        #{ord.orderNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ord.customer?.name || 'Walk-in'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ord.paymentMethod}</div>
                    </td>
                    <td>{ord.items?.length || 1} items</td>
                    <td>
                      <strong style={{ color: 'var(--cafe-dark)' }}>{formatCurrency(ord.total)}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${ord.status?.toLowerCase()}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedReceiptOrder(ord)}
                        title="View Receipt"
                      >
                        <Receipt size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts & System Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Low Stock Card */}
          <div className="cafe-card" style={{ borderLeft: '4px solid #E11D48' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#E11D48" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#9F1239' }}>Low Stock Ingredients</h3>
              </div>
              <button
                onClick={() => navigate('/inventory')}
                style={{ fontSize: '0.75rem', color: '#E11D48', fontWeight: 600 }}
              >
                Restock
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {data?.lowStockItems?.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#059669', padding: '0.5rem 0' }}>
                  ✓ All ingredient stock levels are above threshold.
                </div>
              ) : (
                data?.lowStockItems?.map((inv) => (
                  <div
                    key={inv._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.82rem',
                      padding: '0.45rem 0.65rem',
                      background: '#FFF1F2',
                      borderRadius: '8px',
                      border: '1px solid #FECDD3'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#881337' }}>{inv.name}</span>
                    <span style={{ color: '#E11D48', fontWeight: 700 }}>
                      {inv.quantity} {inv.unit} (Min: {inv.minStockLevel})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="cafe-card" style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--cafe-dark)' }}>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data?.recentActivities?.map((act, idx) => (
                <div key={act._id || idx} style={{ display: 'flex', gap: '0.65rem', fontSize: '0.82rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ color: 'var(--cafe-dark)', fontWeight: 500 }}>{act.action}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {act.createdAt ? new Date(act.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now'} • by {act.userName || 'System'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          isOpen={!!selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
          order={selectedReceiptOrder}
        />
      )}
    </div>
  );
};
