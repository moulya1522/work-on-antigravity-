import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  RotateCcw,
  RefreshCw,
  Eye,
  ChevronRight,
  User,
  Phone
} from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { ReceiptModal } from '../components/ReceiptModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [cancelOrderTarget, setCancelOrderTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { formatCurrency } = useSettings();
  const toast = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (paymentFilter !== 'All') params.paymentStatus = paymentFilter;
      if (search) params.search = search;

      const res = await api.get('/orders', { params });
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      toast.error('Failed to load orders: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  // Status transitions: Pending -> Preparing -> Ready -> Completed
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(res.data.message);
        setOrders((prev) =>
          prev.map((ord) => (ord._id === orderId ? res.data.order : ord))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel order
  const handleConfirmCancel = async () => {
    if (!cancelOrderTarget) return;

    try {
      setActionLoading(true);
      const res = await api.post(`/orders/${cancelOrderTarget._id}/cancel`, {
        reason: cancelReason || 'Cancelled by staff'
      });
      if (res.data.success) {
        toast.success(`Order #${cancelOrderTarget.orderNumber} cancelled`);
        setOrders((prev) =>
          prev.map((ord) => (ord._id === cancelOrderTarget._id ? res.data.order : ord))
        );
        setCancelOrderTarget(null);
        setCancelReason('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const getNextAction = (status) => {
    switch (status) {
      case 'Pending':
        return { label: 'Start Preparing', nextStatus: 'Preparing', btnClass: 'btn-amber' };
      case 'Preparing':
        return { label: 'Mark Ready', nextStatus: 'Ready', btnClass: 'btn-primary' };
      case 'Ready':
        return { label: 'Complete Order', nextStatus: 'Completed', btnClass: 'btn-primary' };
      default:
        return null;
    }
  };

  return (
    <div className="cafe-page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders Management</h1>
          <p className="page-subtitle">Track, prepare, complete and view receipts for all orders</p>
        </div>

        <button className="btn btn-secondary" onClick={fetchOrders} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div
        className="cafe-card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: statusFilter === st ? 'var(--cafe-espresso)' : '#FAF7F2',
                color: statusFilter === st ? '#FFF' : 'var(--text-primary)',
                border: '1px solid var(--cafe-border)',
                transition: 'var(--transition)'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Order # or Customer..."
              className="form-input"
              style={{ padding: '0.45rem 0.75rem 0.45rem 2rem', fontSize: '0.85rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="table-responsive">
        <table className="cafe-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items Ordered</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Time</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No orders found matching this filter criteria.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const nextAction = getNextAction(order.status);
                const orderTime = order.createdAt ? new Date(order.createdAt) : new Date();

                return (
                  <tr key={order._id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--cafe-dark)',
                          background: '#F5EFEB',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px'
                        }}
                      >
                        #{order.orderNumber}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--cafe-dark)' }}>
                        {order.customer?.name || 'Walk-in Customer'}
                      </div>
                      {order.customer?.phone && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {order.customer.phone}
                        </div>
                      )}
                    </td>

                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {order.items?.length || 1} item line{order.items?.length === 1 ? '' : 's'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--cafe-dark)', fontSize: '0.95rem' }}>
                        {formatCurrency(order.total)}
                      </div>
                      {order.discount > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#16A34A' }}>
                          Disc: -{formatCurrency(order.discount)}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        {order.paymentMethod}
                      </div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: order.paymentStatus === 'Paid' ? '#059669' : '#DC2626'
                        }}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td>
                      <span className={`badge badge-${order.status?.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {orderTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {orderTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        {/* Stepper button */}
                        {nextAction && (
                          <button
                            className={`btn ${nextAction.btnClass} btn-sm`}
                            onClick={() => handleUpdateStatus(order._id, nextAction.nextStatus)}
                            disabled={actionLoading}
                          >
                            <span>{nextAction.label}</span>
                          </button>
                        )}

                        {/* View Receipt */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedReceiptOrder(order)}
                          title="View Bill / Receipt"
                        >
                          <Receipt size={14} />
                        </button>

                        {/* Cancel order button if not already completed/cancelled */}
                        {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setCancelOrderTarget(order)}
                            title="Cancel Order"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          isOpen={!!selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
          order={selectedReceiptOrder}
        />
      )}

      {/* Cancel Order Dialog */}
      {cancelOrderTarget && (
        <ConfirmModal
          isOpen={!!cancelOrderTarget}
          onClose={() => {
            setCancelOrderTarget(null);
            setCancelReason('');
          }}
          onConfirm={handleConfirmCancel}
          title={`Cancel Order #${cancelOrderTarget.orderNumber}?`}
          message={
            <div>
              <p style={{ marginBottom: '0.85rem' }}>
                Are you sure you want to cancel order <strong>#{cancelOrderTarget.orderNumber}</strong> ({formatCurrency(cancelOrderTarget.total)})?
                Any paid amount will be marked as refunded.
              </p>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: 0 }}>
                <label className="form-label">Cancellation Reason</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Customer changed mind, incorrect item ordered"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
          }
          confirmText="Yes, Cancel Order"
          isDanger={true}
          loading={actionLoading}
        />
      )}
    </div>
  );
};
