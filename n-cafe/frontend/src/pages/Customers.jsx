import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Edit2,
  Calendar,
  X
} from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { ReceiptModal } from '../components/ReceiptModal';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // History Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Add / Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const { formatCurrency } = useSettings();
  const toast = useToast();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/customers', { params });
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      toast.error('Failed to load customers: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  // View Customer History
  const openHistoryModal = async (cust) => {
    setSelectedCustomer(cust);
    try {
      setLoadingOrders(true);
      const res = await api.get(`/customers/${cust._id}`);
      if (res.data.success) {
        setCustomerOrders(res.data.orders || []);
      }
    } catch (err) {
      toast.error('Could not load order history');
    } finally {
      setLoadingOrders(false);
    }
  };

  const openAddModal = () => {
    setEditingTarget(null);
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setEditModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingTarget(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone,
      email: cust.email || '',
      notes: cust.notes || ''
    });
    setEditModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Customer name and phone number are required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingTarget) {
        const res = await api.put(`/customers/${editingTarget._id}`, formData);
        if (res.data.success) {
          toast.success(`Updated ${formData.name}`);
          setCustomers((prev) =>
            prev.map((c) => (c._id === editingTarget._id ? res.data.customer : c))
          );
        }
      } else {
        const res = await api.post('/customers', formData);
        if (res.data.success) {
          toast.success(`Registered ${formData.name}`);
          setCustomers((prev) => [res.data.customer, ...prev]);
        }
      }
      setEditModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cafe-page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Café Customer Profiles</h1>
          <p className="page-subtitle">Loyalty metrics, spending habits, contact directory, and order history</p>
        </div>

        <button className="btn btn-amber" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div
        className="cafe-card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Total Customers: <strong>{customers.length}</strong>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', minWidth: 280 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
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

      {/* Customer Directory Table */}
      <div className="table-responsive">
        <table className="cafe-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>Lifetime Orders</th>
              <th>Total Spending</th>
              <th>Last Visit</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No customer profiles registered.
                </td>
              </tr>
            ) : (
              customers.map((cust) => {
                const lastVisit = cust.lastOrderDate ? new Date(cust.lastOrderDate) : null;

                return (
                  <tr key={cust._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#F5EFEB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#54331C',
                            fontSize: '0.85rem'
                          }}
                        >
                          {cust.name?.charAt(0) || 'C'}
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--cafe-dark)' }}>
                          {cust.name}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--cafe-dark)', fontFamily: 'var(--font-mono)' }}>
                        {cust.phone}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {cust.email || '—'}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-amber" style={{ fontWeight: 700 }}>
                        {cust.totalOrders || 0} orders
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, color: '#D97706', fontSize: '0.95rem' }}>
                        {formatCurrency(cust.totalSpent || 0)}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {lastVisit ? lastVisit.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openHistoryModal(cust)}
                          title="View Order History"
                        >
                          <Receipt size={14} color="#D97706" />
                          <span>History</span>
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(cust)}
                          title="Edit Customer Details"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedCustomer.name}'s Order History</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {selectedCustomer.phone} • {selectedCustomer.email || 'No email provided'}
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</div>
              ) : customerOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No orders recorded for this customer yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {customerOrders.map((ord) => {
                    const d = ord.createdAt ? new Date(ord.createdAt) : new Date();

                    return (
                      <div
                        key={ord._id}
                        style={{
                          background: '#FAF7F2',
                          borderRadius: '10px',
                          border: '1px solid var(--cafe-border)',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                              #{ord.orderNumber}
                            </span>
                            <span className={`badge badge-${ord.status?.toLowerCase()}`}>
                              {ord.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {ord.paymentMethod}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                            {ord.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--cafe-dark)' }}>
                            {formatCurrency(ord.total)}
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginTop: '0.35rem' }}
                            onClick={() => setReceiptOrder(ord)}
                          >
                            <Receipt size={12} /> View Bill
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTarget ? `Edit: ${editingTarget.name}` : 'Register New Customer'}
              </h3>
              <button onClick={() => setEditModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Siddharth Mehta"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +91 98765 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. siddharth@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Preferences / Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Prefers oat milk, regular morning visitor"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-amber" disabled={submitting}>
                  {submitting ? 'Saving...' : editingTarget ? 'Update Profile' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          isOpen={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
          order={receiptOrder}
        />
      )}
    </div>
  );
};
