import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter
} from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';

export const Menu = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dietaryFilter, setDietaryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryName: 'Coffee',
    preparationTime: '5',
    dietary: 'Veg',
    isAvailable: true,
    isPopular: false,
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { formatCurrency } = useSettings();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, catRes] = await Promise.all([
        api.get('/menu'),
        api.get('/categories')
      ]);
      if (menuRes.data.success) setItems(menuRes.data.items);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      toast.error('Failed to load menu: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryName: categories[0]?.name || 'Coffee',
      preparationTime: '5',
      dietary: 'Veg',
      isAvailable: true,
      isPopular: false,
      imageUrl: ''
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryName: item.categoryName,
      preparationTime: item.preparationTime || '5',
      dietary: item.dietary || 'Veg',
      isAvailable: item.isAvailable,
      isPopular: !!item.isPopular,
      imageUrl: item.image || ''
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Item name and price are required');
      return;
    }

    try {
      setSubmitting(true);
      const form = new FormData();
      form.append('name', formData.name);
      form.append('description', formData.description);
      form.append('price', formData.price);
      form.append('categoryName', formData.categoryName);
      form.append('preparationTime', formData.preparationTime);
      form.append('dietary', formData.dietary);
      form.append('isAvailable', formData.isAvailable);
      form.append('isPopular', formData.isPopular);

      if (imageFile) {
        form.append('image', imageFile);
      } else if (formData.imageUrl) {
        form.append('imageUrl', formData.imageUrl);
      }

      if (editingItem) {
        const res = await api.put(`/menu/${editingItem._id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          toast.success(`Updated ${formData.name}`);
          setItems((prev) =>
            prev.map((i) => (i._id === editingItem._id ? res.data.item : i))
          );
        }
      } else {
        const res = await api.post('/menu', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          toast.success(`Added ${formData.name} to menu`);
          setItems((prev) => [res.data.item, ...prev]);
        }
      }

      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save menu item');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle availability
  const handleToggleAvailability = async (item) => {
    try {
      const res = await api.patch(`/menu/${item._id}/toggle-availability`);
      if (res.data.success) {
        toast.info(`${item.name} is now ${res.data.isAvailable ? 'In Stock' : 'Out of Stock'}`);
        setItems((prev) =>
          prev.map((i) => (i._id === item._id ? { ...i, isAvailable: res.data.isAvailable } : i))
        );
      }
    } catch (err) {
      toast.error('Failed to toggle availability');
    }
  };

  // Delete item
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await api.delete(`/menu/${deleteTarget._id}`);
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

  // Filter
  const filteredItems = items.filter((item) => {
    const matchCat =
      selectedCategory === 'All' ||
      item.categoryName?.toLowerCase() === selectedCategory.toLowerCase();
    const matchDietary =
      dietaryFilter === 'All' || item.dietary === dietaryFilter;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchDietary && matchSearch;
  });

  return (
    <div className="cafe-page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Café Menu Management</h1>
          <p className="page-subtitle">Configure recipes, prices, stock availability, and categories</p>
        </div>

        <button className="btn btn-amber" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Category Pills & Filters */}
      <div className="cafe-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            <button
              onClick={() => setSelectedCategory('All')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: selectedCategory === 'All' ? 'var(--cafe-espresso)' : '#FAF7F2',
                color: selectedCategory === 'All' ? '#FFF' : 'var(--text-primary)',
                border: '1px solid var(--cafe-border)',
                transition: 'var(--transition)'
              }}
            >
              All Items ({items.length})
            </button>
            {categories.map((c) => (
              <button
                key={c._id || c.name}
                onClick={() => setSelectedCategory(c.name)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: selectedCategory === c.name ? 'var(--cafe-espresso)' : '#FAF7F2',
                  color: selectedCategory === c.name ? '#FFF' : 'var(--text-primary)',
                  border: '1px solid var(--cafe-border)',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition)'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search & Dietary */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', width: 'auto' }}
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
            >
              <option value="All">All Diets</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Vegan">Vegan</option>
            </select>

            <div style={{ position: 'relative', width: 220 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Search menu..."
                className="form-input"
                style={{ padding: '0.45rem 0.75rem 0.45rem 2rem', fontSize: '0.85rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {filteredItems.map((item) => (
          <div
            key={item._id}
            className="cafe-card"
            style={{
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Top Image */}
            <div
              style={{
                width: '100%',
                height: 160,
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#EDE4D8',
                marginBottom: '1rem',
                position: 'relative'
              }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Coffee size={36} color="#8C532E" />
                </div>
              )}

              {/* Status pill on image */}
              <div style={{ position: 'absolute', top: 10, right: 10 }}>
                <button
                  onClick={() => handleToggleAvailability(item)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: item.isAvailable ? '#ECFDF5' : '#FFF1F2',
                    color: item.isAvailable ? '#065F46' : '#9F1239',
                    border: item.isAvailable ? '1px solid #A7F3D0' : '1px solid #FECDD3',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                  title="Click to toggle availability"
                >
                  {item.isAvailable ? '● In Stock' : '✕ Out of Stock'}
                </button>
              </div>

              {/* Dietary */}
              <span
                className={`badge badge-${item.dietary === 'Non-Veg' ? 'nonveg' : 'veg'}`}
                style={{ position: 'absolute', top: 10, left: 10, fontSize: '0.7rem' }}
              >
                {item.dietary || 'Veg'}
              </span>
            </div>

            {/* Details */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {item.categoryName}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cafe-dark)', marginTop: '0.15rem' }}>
                    {item.name}
                  </h3>
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D97706' }}>
                  {formatCurrency(item.price)}
                </div>
              </div>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.45rem',
                  lineHeight: 1.4,
                  flex: 1
                }}
              >
                {item.description}
              </p>

              {/* Card Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--cafe-border)'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Prep: ~{item.preparationTime || 5} mins
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEditModal(item)}
                    title="Edit Item"
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>

                  {isAdmin && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteTarget(item)}
                      title="Delete Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? `Edit: ${editingItem.name}` : 'Add New Café Item'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Vanilla Bean Frappuccino"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={formData.categoryName}
                      onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c._id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (INR ₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 250"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Dietary Classification</label>
                    <select
                      className="form-select"
                      value={formData.dietary}
                      onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
                    >
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Egg">Egg-based</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Prep Time (Mins)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Flavor notes, brewing method, garnish, allergen info..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Item Image (Upload File or Image URL)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      style={{ fontSize: '0.85rem' }}
                    />
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Or provide image URL:</div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      className="form-input"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    />
                    <span>Available in stock</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    />
                    <span>Highlight as Popular</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-amber" disabled={submitting}>
                  {submitting ? 'Saving...' : editingItem ? 'Update Menu Item' : 'Create Menu Item'}
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
          title={`Delete ${deleteTarget.name}?`}
          message={`Are you sure you want to permanently remove "${deleteTarget.name}" from the menu? This action cannot be undone.`}
          confirmText="Yes, Delete"
          isDanger={true}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};
