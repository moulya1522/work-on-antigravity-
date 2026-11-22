import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Coffee,
  Percent,
  Receipt,
  X
} from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { ReceiptModal } from '../components/ReceiptModal';

export const POS = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' | 'percentage'
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'Cash' | 'Card'
  const [paymentStatus, setPaymentStatus] = useState('Paid'); // 'Paid' | 'Unpaid'
  const [orderNotes, setOrderNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const { formatCurrency, settings } = useSettings();
  const toast = useToast();

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [menuRes, catRes] = await Promise.all([
        api.get('/menu'),
        api.get('/categories')
      ]);

      if (menuRes.data.success) setMenuItems(menuRes.data.items);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      toast.error('Failed to load menu: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  // Filter menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesCat =
      selectedCategory === 'All' ||
      item.categoryName?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Cart operations
  const addToCart = (item) => {
    if (!item.isAvailable) {
      toast.error(`${item.name} is currently out of stock`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        return prev.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          notes: ''
        }
      ];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i._id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i._id !== id));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = Math.round(((subtotal * (parseFloat(discountValue) || 0)) / 100) * 100) / 100;
  } else {
    discountAmount = Math.min(subtotal, Math.max(0, parseFloat(discountValue) || 0));
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRate = settings.taxRate || 5;
  const tax = Math.round(((discountedSubtotal * taxRate) / 100) * 100) / 100;
  const total = Math.round((discountedSubtotal + tax) * 100) / 100;

  // Submit Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Please select menu items first.');
      return;
    }

    try {
      setPlacingOrder(true);
      const payload = {
        customer: {
          name: customerName.trim() || 'Walk-in Customer',
          phone: customerPhone.trim(),
          email: customerEmail.trim()
        },
        items: cart.map((i) => ({
          menuItem: i._id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          notes: i.notes
        })),
        discount: discountAmount,
        discountType,
        paymentMethod,
        paymentStatus,
        notes: orderNotes
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        toast.success(`Order #${res.data.order.orderNumber} placed successfully!`);
        setPlacedOrder(res.data.order);
        // Clear cart
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setDiscountValue(0);
        setOrderNotes('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="cafe-page-wrapper" style={{ maxWidth: '1600px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Menu Item Selector */}
        <div>
          {/* Header & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 className="page-title" style={{ fontSize: '1.65rem' }}>Point of Sale (POS)</h1>
              <p className="page-subtitle">Select items to build and bill a customer order</p>
            </div>

            <div style={{ position: 'relative', width: 280 }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
              <input
                type="text"
                placeholder="Search coffee, snacks, bites..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.3rem' }}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.75rem',
              marginBottom: '1.25rem'
            }}
          >
            <button
              onClick={() => setSelectedCategory('All')}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                background: selectedCategory === 'All' ? 'var(--cafe-espresso)' : '#FFF',
                color: selectedCategory === 'All' ? '#FFF' : 'var(--text-primary)',
                border: '1px solid var(--cafe-border)',
                transition: 'var(--transition)'
              }}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id || cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  background: selectedCategory === cat.name ? 'var(--cafe-espresso)' : '#FFF',
                  color: selectedCategory === cat.name ? '#FFF' : 'var(--text-primary)',
                  border: '1px solid var(--cafe-border)',
                  transition: 'var(--transition)'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items Visual Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '1.15rem'
            }}
          >
            {filteredItems.map((item) => (
              <div
                key={item._id}
                onClick={() => addToCart(item)}
                className="cafe-card"
                style={{
                  padding: '0.85rem',
                  cursor: item.isAvailable ? 'pointer' : 'not-allowed',
                  opacity: item.isAvailable ? 1 : 0.6,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => item.isAvailable && (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={(e) => item.isAvailable && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {/* Image */}
                <div
                  style={{
                    width: '100%',
                    height: 135,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#EDE4D8',
                    marginBottom: '0.75rem',
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
                      <Coffee size={32} color="#8C532E" />
                    </div>
                  )}

                  {/* Dietary badge */}
                  <span
                    className={`badge badge-${item.dietary === 'Non-Veg' ? 'nonveg' : 'veg'}`}
                    style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                  >
                    {item.dietary || 'Veg'}
                  </span>

                  {!item.isAvailable && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(26, 15, 8, 0.75)',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.82rem',
                        fontWeight: 700
                      }}
                    >
                      Out of Stock
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {item.categoryName}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--cafe-dark)', marginTop: '0.15rem', lineHeight: 1.25 }}>
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.35rem',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {item.description}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--cafe-dark)' }}>
                      {formatCurrency(item.price)}
                    </div>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: '#F5EFEB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--cafe-dark)',
                        transition: 'var(--transition)'
                      }}
                    >
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Order Cart */}
        <div
          className="cafe-card"
          style={{
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden'
          }}
        >
          {/* Cart Header */}
          <div
            style={{
              padding: '1.15rem 1.25rem',
              background: '#FAF7F2',
              borderBottom: '1px solid var(--cafe-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cafe-dark)' }}>
                Current Order
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {cart.length} item{cart.length === 1 ? '' : 's'} in cart
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{ fontSize: '0.75rem', color: '#E11D48', fontWeight: 600 }}
              >
                Clear Cart
              </button>
            )}
          </div>

          <div style={{ padding: '1.15rem 1.25rem', overflowY: 'auto', flex: 1 }}>
            {/* Customer Information Form */}
            <div style={{ marginBottom: '1rem', background: '#FCFAF7', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--cafe-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                Customer Details (Optional)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="form-input"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="form-input"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <Coffee size={36} color="#D5C7B7" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cart is Empty</div>
                <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Click any menu item to start adding</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {cart.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.75rem',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid var(--cafe-border)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cafe-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatCurrency(item.price)} each
                      </div>
                    </div>

                    {/* Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => updateQuantity(item._id, -1)}
                        style={{ width: 24, height: 24, borderRadius: '4px', background: '#F5EFEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, width: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, 1)}
                        style={{ width: 24, height: 24, borderRadius: '4px', background: '#F5EFEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div style={{ fontSize: '0.88rem', fontWeight: 700, minWidth: 60, textAlign: 'right' }}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      style={{ color: '#E11D48', opacity: 0.7, marginLeft: '0.5rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Discount & Payment Method */}
            {cart.length > 0 && (
              <div style={{ borderTop: '1px dashed var(--cafe-border)', paddingTop: '0.85rem' }}>
                {/* Discount */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Discount:
                  </div>
                  <div style={{ display: 'flex', flex: 1, gap: '0.25rem' }}>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="0"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setDiscountType(discountType === 'fixed' ? 'percentage' : 'fixed')}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        background: '#FAF7F2',
                        border: '1px solid var(--cafe-border)',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    >
                      {discountType === 'fixed' ? '₹ Fixed' : '% Pct'}
                    </button>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Payment Mode
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                    {['UPI', 'Cash', 'Card'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMethod(mode)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: paymentMethod === mode ? 'var(--cafe-espresso)' : '#FAF7F2',
                          color: paymentMethod === mode ? '#FFF' : 'var(--text-primary)',
                          border: '1px solid var(--cafe-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          transition: 'var(--transition)'
                        }}
                      >
                        {mode === 'UPI' && <Smartphone size={14} />}
                        {mode === 'Cash' && <Banknote size={14} />}
                        {mode === 'Card' && <CreditCard size={14} />}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cart Bottom Summary & Place Order */}
          <div
            style={{
              padding: '1.15rem 1.25rem',
              background: '#FAF7F2',
              borderTop: '1px solid var(--cafe-border)'
            }}
          >
            <div style={{ fontSize: '0.82rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                  <span>Discount:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST ({taxRate}%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--cafe-dark)',
                  borderTop: '1px solid var(--cafe-border)',
                  paddingTop: '0.35rem',
                  marginTop: '0.35rem'
                }}
              >
                <span>Total Amount:</span>
                <span style={{ color: '#D97706' }}>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              className="btn btn-amber"
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || placingOrder}
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)'
              }}
            >
              {placingOrder ? 'Processing Order...' : `Place & Pay ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {placedOrder && (
        <ReceiptModal
          isOpen={!!placedOrder}
          onClose={() => setPlacedOrder(null)}
          order={placedOrder}
        />
      )}
    </div>
  );
};
