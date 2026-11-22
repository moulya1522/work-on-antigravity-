import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  X,
  PackageCheck
} from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';

export const Inventory = () => {
  const [items, setItems] = useState([]);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    minStockLevel: '5',
    supplier: '',
    supplierContact: '',
    purchasePrice: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Quick Adjust Modal
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('add'); // 'add' | 'deduct'
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { formatCurrency } = useSettings();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (lowStockFilter) params.lowStockOnly = 'true';
      if (search) params.search = search;

      const res = await api.get('/inventory', { params });
      if (res.data.success) {
        setItems(res.data.items);
      }
    } catch (err) {
      toast.error('Failed to load inventory: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      quantity: '',
      unit: 'kg',
      minStockLevel: '5',
      supplier: '',
      supplierContact: '',
      purchasePrice: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'kg',
      minStockLevel: item.minStockLevel || '5',
      supplier: item.supplier || '',
      supplierContact: item.supplierContact || '',
      purchasePrice: item.purchasePrice || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.quantity === '') {
      toast.error('Ingredient name and quantity are required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        const res = await api.put(`/inventory/${editingItem._id}`, formData);
        if (res.data.success) {
          toast.success(`Updated ${formData.name}`);
          setItems((prev) =>
            prev.map((i) => (i._id === editingItem._id ? res.data.item : i))
          );
        }
      } else {
        const res = await api.post('/inventory', formData);
        if (res.data.success) {
          toast.success(`Added ${formData.name} to inventory`);
          setItems((prev) => [res.data.item, ...prev]);
        }
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Restock Adjustment
  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustTarget || !adjustAmount) return;

    try {
      setAdjusting(true);
      const res = await api.post(`/inventory/${adjustTarget._id}/adjust`, {
        adjustmentAmount: parseFloat(adjustAmount),
        type: adjustType,
        note: adjustNote
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setItems((prev) =>
          prev.map((i) => (i._id === adjustTarget._id ? res.data.item : i))
        );
        setAdjustTarget(null);
        setAdjustAmount('');
        setAdjustNote('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stock adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await api.delete(`/inventory/${deleteTarget._id}`);
      if (res.data.success) {
        toast.success(`Deleted ${deleteTarget.name}`);
        setItems((prev) => prev.filter((i) => i._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setDeleteLoading(false);
    }
  };

  const lowStockCount = items.filter((i) => i.quantity <= i.minStockLevel).length;

  return (
    <div className="cafe-page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ingredient Inventory & Stocks</h1>
          <p className="page-subtitle">Manage raw coffee beans, dairy, syrups, packaging, and reorder levels</p>
        </div>

        <button className="btn btn-amber" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Ingredient</span>
        </button>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(90deg, #FFF1F2 0%, #FFE4E6 100%)',
            border: '1px solid #FECDD3',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#9F1239', fontSize: '0.95rem' }}>
                {lowStockCount} ingredient{lowStockCount === 1 ? '' : 's'} running critically low!
              </div>
              <div style={{ fontSize: '0.82rem', color: '#BE123C' }}>
                Stock has fallen below safe reorder thresholds. Restock soon to prevent menu disruptions.
              </div>
            </div>
          </div>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => setLowStockFilter(!lowStockFilter)}
          >
            {lowStockFilter ? 'Show All Items' : 'Filter Low Stock Only'}
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setLowStockFilter(false)}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: !lowStockFilter ? 'var(--cafe-espresso)' : '#FAF7F2',
              color: !lowStockFilter ? '#FFF' : 'var(--text-primary)',
              border: '1px solid var(--cafe-border)'
            }}
          >
            All Ingredients ({items.length})
          </button>

          <button
            onClick={() => setLowStockFilter(true)}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: lowStockFilter ? '#E11D48' : '#FAF7F2',
              color: lowStockFilter ? '#FFF' : '#E11D48',
              border: lowStockFilter ? '1px solid #BE123C' : '1px solid var(--cafe-border)'
            }}
          >
            Low Stock Alerts ({lowStockCount})
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search ingredient or supplier..."
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

      {/* Inventory Table */}
      <div className="table-responsive">
        <table className="cafe-table">
          <thead>
            <tr>
              <th>Ingredient Name</th>
              <th>Current Stock</th>
              <th>Min Threshold</th>
              <th>Stock Status</th>
              <th>Unit Cost</th>
              <th>Supplier</th>
              <th>Last Restocked</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No inventory ingredients found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isLow = item.quantity <= item.minStockLevel;
                const restockedDate = item.lastRestocked ? new Date(item.lastRestocked) : new Date();

                return (
                  <tr key={item._id} style={{ background: isLow ? '#FFFBFB' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--cafe-dark)', fontSize: '0.92rem' }}>
                        {item.name}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: isLow ? '#E11D48' : 'var(--cafe-dark)' }}>
                        {item.quantity} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{item.unit}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.minStockLevel} {item.unit}
                      </div>
                    </td>

                    <td>
                      {isLow ? (
                        <span className="badge badge-cancelled" style={{ fontWeight: 700 }}>
                          <AlertTriangle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="badge badge-completed">
                          <PackageCheck size={12} /> In Stock
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(item.purchasePrice || 0)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>per {item.unit}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500 }}>{item.supplier || '—'}</div>
                      {item.supplierContact && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.supplierContact}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {restockedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                        {/* Quick Restock / Adjust */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setAdjustTarget(item);
                            setAdjustType('add');
                            setAdjustAmount('');
                            setAdjustNote('');
                          }}
                          title="Adjust Stock / Restock"
                        >
                          <TrendingUp size={14} color="#D97706" />
                          <span>Adjust</span>
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(item)}
                          title="Edit Details"
                        >
                          <Edit2 size={14} />
                        </button>

                        {isAdmin && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Ingredient"
                          >
                            <Trash2 size={14} />
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

      {/* Add / Edit Ingredient Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? `Edit: ${editingItem.name}` : 'Add New Inventory Ingredient'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Ingredient Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Colombian Supremo Coffee Beans"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Available Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 15.5"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit of Measure *</label>
                    <select
                      className="form-select"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="L">Liters (L)</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="packets">Packets</option>
                      <option value="boxes">Boxes</option>
                      <option value="bottles">Bottles</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Minimum Stock Alert Level *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 5"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Price per Unit (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 1200"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Supplier Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Blue Mountain Roasters"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supplier Contact</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. +91 98765 11223"
                      value={formData.supplierContact}
                      onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-amber" disabled={submitting}>
                  {submitting ? 'Saving...' : editingItem ? 'Update Ingredient' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Adjust Stock Modal */}
      {adjustTarget && (
        <div className="modal-overlay" onClick={() => setAdjustTarget(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Adjust Stock: {adjustTarget.name}</h3>
              <button onClick={() => setAdjustTarget(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment}>
              <div className="modal-body">
                <div style={{ background: '#FAF7F2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  Current Stock: <strong>{adjustTarget.quantity} {adjustTarget.unit}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setAdjustType('add')}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        background: adjustType === 'add' ? '#ECFDF5' : '#FFF',
                        color: adjustType === 'add' ? '#065F46' : 'var(--text-secondary)',
                        border: adjustType === 'add' ? '1.5px solid #059669' : '1px solid var(--cafe-border)'
                      }}
                    >
                      + Restock / Received
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustType('deduct')}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        background: adjustType === 'deduct' ? '#FFF1F2' : '#FFF',
                        color: adjustType === 'deduct' ? '#9F1239' : 'var(--text-secondary)',
                        border: adjustType === 'deduct' ? '1.5px solid #E11D48' : '1px solid var(--cafe-border)'
                      }}
                    >
                      - Waste / Spoilage
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity to {adjustType === 'add' ? 'Add' : 'Deduct'} ({adjustTarget.unit}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="Enter amount"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Note / Reason</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Regular weekly restock delivery, spill waste"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdjustTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-amber" disabled={adjusting}>
                  {adjusting ? 'Updating...' : 'Save Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete ${deleteTarget.name}?`}
          message={`Are you sure you want to remove ${deleteTarget.name} from inventory tracking?`}
          confirmText="Yes, Delete"
          isDanger={true}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};
