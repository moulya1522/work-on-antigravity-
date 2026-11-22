import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const ReceiptModal = ({ isOpen, onClose, order }) => {
  const { settings, formatCurrency } = useSettings();

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '420px', background: '#FCFAF7' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ background: '#FFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--cafe-dark)', fontSize: '1rem' }}>
              Order Receipt
            </span>
            <span className={`badge badge-${order.status?.toLowerCase()}`}>
              {order.status}
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Printable Receipt Paper Container */}
          <div
            id="printable-receipt"
            style={{
              background: '#FFFFFF',
              border: '1px dashed #D5C7B7',
              borderRadius: '8px',
              padding: '1.5rem 1.25rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #E8DFD5', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 700, color: '#1A0F08' }}>
                {settings.cafeName || 'N CAFÉ'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6B5D52', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.15rem' }}>
                {settings.tagline || 'Artisan Brews & Gourmet Moments'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#8C7E74', marginTop: '0.35rem', lineHeight: 1.3 }}>
                {settings.address}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#8C7E74' }}>
                Ph: {settings.phone}
              </div>
            </div>

            {/* Order Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
              <span>Order No:</span>
              <strong style={{ color: '#1A0F08' }}>#{order.orderNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
              <span>Date & Time:</span>
              <span>{orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, {orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
              <span>Billed By:</span>
              <span>{order.createdByName || 'Staff'}</span>
            </div>
            {order.customer?.name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.75rem', borderBottom: '1px dashed #E8DFD5', paddingBottom: '0.5rem' }}>
                <span>Customer:</span>
                <span>{order.customer.name} {order.customer.phone ? `(${order.customer.phone})` : ''}</span>
              </div>
            )}

            {/* Line Items Table */}
            <div style={{ borderBottom: '1px dashed #E8DFD5', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 35px 55px 65px', fontWeight: 700, fontSize: '0.72rem', color: '#54331C', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                <span>Item</span>
                <span style={{ textAlign: 'center' }}>Qty</span>
                <span style={{ textAlign: 'right' }}>Price</span>
                <span style={{ textAlign: 'right' }}>Total</span>
              </div>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 35px 55px 65px', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.25rem' }}>
                    {item.name}
                  </span>
                  <span style={{ textAlign: 'center' }}>{item.quantity}</span>
                  <span style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</span>
                  <span style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.subtotal || item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST ({order.taxRate || 5}%):</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '2px solid #1A0F08',
                borderBottom: '2px solid #1A0F08',
                padding: '0.45rem 0',
                marginTop: '0.45rem',
                fontSize: '1rem',
                fontWeight: 800,
                color: '#1A0F08'
              }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem' }}>
              <span>Payment Mode:</span>
              <strong style={{ textTransform: 'uppercase' }}>{order.paymentMethod} ({order.paymentStatus})</strong>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px dashed #E8DFD5' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3D2314' }}>Thank you for visiting N CAFÉ!</div>
              <div style={{ fontSize: '0.68rem', color: '#8C7E74', marginTop: '0.2rem' }}>Brewed with passion. Please visit us again.</div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-amber" onClick={handlePrint}>
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
