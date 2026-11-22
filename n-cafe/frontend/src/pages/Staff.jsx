import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Calendar,
  X,
  UserX,
  UserCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';

export const Staff = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    jobRole: 'Barista',
    phone: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { user: currentUser } = useAuth();
  const toast = useToast();

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter !== 'All') params.role = roleFilter;
      if (search) params.search = search;

      const res = await api.get('/staff', { params });
      if (res.data.success) {
        setStaffMembers(res.data.staff);
      }
    } catch (err) {
      toast.error('Failed to load staff directory: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStaff();
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      jobRole: 'Barista',
      phone: '',
      status: 'active'
    });
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '', // blank unless changing
      role: member.role,
      jobRole: member.jobRole || 'Barista',
      phone: member.phone || '',
      status: member.status || 'active'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    if (!editingStaff && !formData.password) {
      toast.error('Password is required for new accounts');
      return;
    }

    try {
      setSubmitting(true);
      if (editingStaff) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;

        const res = await api.put(`/staff/${editingStaff._id}`, payload);
        if (res.data.success) {
          toast.success(`Updated ${formData.name}`);
          setStaffMembers((prev) =>
            prev.map((s) => (s._id === editingStaff._id ? res.data.staff : s))
          );
        }
      } else {
        const res = await api.post('/staff', formData);
        if (res.data.success) {
          toast.success(`Account created for ${formData.name}`);
          setStaffMembers((prev) => [res.data.staff, ...prev]);
        }
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save staff account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await api.delete(`/staff/${deleteTarget._id}`);
      if (res.data.success) {
        toast.success(`Removed staff member ${deleteTarget.name}`);
        setStaffMembers((prev) => prev.filter((s) => s._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete staff member');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="cafe-page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Café Staff & Access Control</h1>
          <p className="page-subtitle">Manage baristas, cashiers, kitchen staff, and manager privileges</p>
        </div>

        <button className="btn btn-amber" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Staff Member</span>
        </button>
      </div>

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
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['All', 'admin', 'staff'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                background: roleFilter === r ? 'var(--cafe-espresso)' : '#FAF7F2',
                color: roleFilter === r ? '#FFF' : 'var(--text-primary)',
                border: '1px solid var(--cafe-border)'
              }}
            >
              {r === 'All' ? 'All Roles' : `${r}s`}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search by name, email, role..."
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

      {/* Staff Table */}
      <div className="table-responsive">
        <table className="cafe-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>System Role</th>
              <th>Job Designation</th>
              <th>Phone</th>
              <th>Joining Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffMembers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No staff members found matching criteria.
                </td>
              </tr>
            ) : (
              staffMembers.map((member) => {
                const isSelf = currentUser?._id === member._id || currentUser?.id === member._id;
                const joining = member.joiningDate ? new Date(member.joiningDate) : new Date();

                return (
                  <tr key={member._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: member.role === 'admin' ? '#FEF3C7' : '#F5EFEB',
                            color: member.role === 'admin' ? '#B45309' : 'var(--cafe-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}
                        >
                          {member.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--cafe-dark)' }}>
                            {member.name} {isSelf && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: member.role === 'admin' ? '#FEF3C7' : '#F3F4F6',
                          color: member.role === 'admin' ? '#92400E' : '#374151',
                          textTransform: 'uppercase'
                        }}
                      >
                        {member.role === 'admin' ? <ShieldCheck size={12} /> : <Users size={12} />}
                        {member.role}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--cafe-dark)' }}>
                        {member.jobRole || 'Barista'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {member.phone || '—'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {joining.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${member.status === 'active' ? 'badge-completed' : 'badge-cancelled'}`}
                      >
                        {member.status || 'active'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(member)}
                          title="Edit Staff Member"
                        >
                          <Edit2 size={14} />
                        </button>

                        {!isSelf && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTarget(member)}
                            title="Remove Staff Account"
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

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingStaff ? `Edit: ${editingStaff.name}` : 'Create Staff Account'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. rahul@ncafe.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">System Role *</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="staff">Staff (Limited Access)</option>
                      <option value="admin">Admin (Full Control)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Job Designation</label>
                    <select
                      className="form-select"
                      value={formData.jobRole}
                      onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                    >
                      <option value="Head Barista">Head Barista</option>
                      <option value="Barista">Barista</option>
                      <option value="Cashier & Front Desk">Cashier & Front Desk</option>
                      <option value="Café Chef">Café Chef</option>
                      <option value="Floor Supervisor">Floor Supervisor</option>
                      <option value="Café General Manager">Café General Manager</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">
                      {editingStaff ? 'Reset Password (optional)' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder={editingStaff ? 'Leave blank to keep current' : 'Min 6 characters'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-amber" disabled={submitting}>
                  {submitting ? 'Saving...' : editingStaff ? 'Update Staff Member' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title={`Remove ${deleteTarget.name}?`}
          message={`Are you sure you want to remove ${deleteTarget.name} (${deleteTarget.email})? They will immediately lose access to the system.`}
          confirmText="Yes, Remove"
          isDanger={true}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};
