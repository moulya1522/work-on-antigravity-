import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  CreditCard,
  ShoppingBag,
  DollarSign,
  Download,
  Printer,
  Sparkles,
  PieChart as PieIcon,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

const PAYMENT_COLORS = {
  UPI: '#D97706',
  Card: '#2563EB',
  Cash: '#059669'
};

export const Reports = () => {
  const [period, setPeriod] = useState('last30days'); // 'today' | 'last7days' | 'last30days' | 'thisMonth'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { formatCurrency, settings } = useSettings();
  const toast = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports', { params: { period } });
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load reports: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const summary = reportData?.summary || {};
  const salesTrend = reportData?.salesTrend || [];
  const paymentBreakdown = reportData?.paymentBreakdown || [];
  const topProducts = reportData?.topProducts || [];

  const handlePrintSummary = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!salesTrend.length) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Date,Revenue,Orders\n' +
      salesTrend.map((row) => `${row.date},${row.revenue},${row.orders}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `n_cafe_sales_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sales report CSV exported!');
  };

  return (
    <div className="cafe-page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Café Analytics & Financial Reports</h1>
          <p className="page-subtitle">Historical sales trends, payment mode share, and product volume analysis</p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button className="btn btn-amber" onClick={handlePrintSummary}>
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div
        className="cafe-card"
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="#D97706" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Reporting Window:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Today', value: 'today' },
            { label: 'Last 7 Days', value: 'last7days' },
            { label: 'Last 30 Days', value: 'last30days' },
            { label: 'This Month', value: 'thisMonth' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPeriod(tab.value)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: period === tab.value ? 'var(--cafe-espresso)' : '#FAF7F2',
                color: period === tab.value ? '#FFF' : 'var(--text-primary)',
                border: '1px solid var(--cafe-border)',
                transition: 'var(--transition)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards in Period */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem'
        }}
      >
        <div className="cafe-card-elevated" style={{ borderLeft: '4px solid #D97706' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Period Total Revenue
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--cafe-dark)', marginTop: '0.35rem' }}>
            {formatCurrency(summary.totalRevenue || 0)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Gross customer billings
          </div>
        </div>

        <div className="cafe-card">
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Orders Settled
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--cafe-dark)', marginTop: '0.35rem' }}>
            {summary.totalOrders || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Fulfilled café tickets
          </div>
        </div>

        <div className="cafe-card">
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Average Ticket Size (AOV)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--cafe-dark)', marginTop: '0.35rem' }}>
            {formatCurrency(summary.averageOrderValue || 0)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Average spend per order
          </div>
        </div>

        <div className="cafe-card">
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            GST Collected ({settings.taxRate || 5}%)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--cafe-dark)', marginTop: '0.35rem' }}>
            {formatCurrency(summary.totalTax || 0)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Output tax liability
          </div>
        </div>
      </div>

      {/* Main Charts: Revenue Trend Area & Payment Methods Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Sales Timeline */}
        <div className="cafe-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--cafe-dark)' }}>
              Revenue Inflow Timeline
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily sales progression</div>
          </div>

          <div style={{ height: 290, width: '100%', marginTop: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFD5" />
                <XAxis dataKey="label" stroke="#9C8E83" fontSize={11} tickLine={false} />
                <YAxis stroke="#9C8E83" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
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
                <Area type="monotone" dataKey="revenue" stroke="#D97706" strokeWidth={2.5} fill="url(#reportGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="cafe-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--cafe-dark)' }}>
              Payment Methods
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>UPI vs Cards vs Cash</div>
          </div>

          <div style={{ height: 210, width: '100%', margin: 'auto 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdown.filter((p) => p.amount > 0)}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {paymentBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#8C532E'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A0F08',
                    borderRadius: '8px',
                    color: '#FCFAF7',
                    fontSize: '0.8rem'
                  }}
                  formatter={(val) => [formatCurrency(val), 'Volume']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', borderTop: '1px solid var(--cafe-border)', paddingTop: '0.75rem' }}>
            {paymentBreakdown.map((p) => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: PAYMENT_COLORS[p.name] || '#8C532E' }} />
                  <span style={{ fontWeight: 600 }}>{p.name} ({p.count} orders)</span>
                </div>
                <strong>{formatCurrency(p.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Bar Chart */}
      <div className="cafe-card">
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--cafe-dark)' }}>
            Best-Selling Products by Volume
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Highest quantity units served in timeframe</div>
        </div>

        <div style={{ height: 280, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFD5" />
              <XAxis
                dataKey="name"
                stroke="#9C8E83"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#9C8E83" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A0F08',
                  borderRadius: '8px',
                  color: '#FCFAF7',
                  fontSize: '0.8rem'
                }}
                formatter={(val, name) => [name === 'quantity' ? `${val} units` : formatCurrency(val), name === 'quantity' ? 'Units Sold' : 'Revenue']}
              />
              <Bar dataKey="quantity" fill="#3D2314" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
