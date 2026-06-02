import React, { useState, useRef } from 'react';
import '../styles/InvoiceModal.css';

const DEFAULT_BUSINESS = {
  name: 'StockMaster Pro',
  tagline: 'Professional Inventory Intelligence',
  address: 'Office 402, Blue Area Business Plaza',
  city: 'Islamabad 44000, Pakistan',
  email: 'billing@stockmaster.com',
  phone: '+92 51 123 4567',
};

const TAX_OPTIONS = [0, 5, 10, 15, 17, 20];

function formatMoney(n) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n || 0);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return '—'; }
}

function getDueDate(iso, days = 30) {
  try {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return '—'; }
}

export default function InvoiceModal({ order, onClose }) {
  const [taxRate, setTaxRate]     = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [notes, setNotes]         = useState('Thank you for your business. Please make payment within 30 days of invoice date.');
  const [business, setBusiness]   = useState(DEFAULT_BUSINESS);
  const [tempBiz, setTempBiz]     = useState(DEFAULT_BUSINESS);
  const printRef = useRef(null);

  if (!order) return null;

  const subtotal = (order.lineItems || []).reduce(
    (s, line) => s + (Number(line.unitPrice) || 0) * (Number(line.quantity) || 0),
    0
  );
  const taxAmount  = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  const handlePrint = () => window.print();

  const handleSaveBusiness = () => {
    setBusiness(tempBiz);
    setShowEditor(false);
  };

  return (
    <div
      className="invoice-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inv-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="invoice-print-document" onClick={(e) => e.stopPropagation()}>

        {/* ── Toolbar (hidden on print) ── */}
        <div className="invoice-toolbar no-print">
          <div className="invoice-toolbar-left">
            <span className="invoice-toolbar-title">Invoice Preview</span>
            <span className="invoice-toolbar-badge">{order.orderId}</span>
          </div>
          <div className="invoice-toolbar-right">
            {/* Tax selector */}
            <div className="invoice-tax-group">
              <label className="invoice-tax-label">Tax Rate</label>
              <div className="invoice-tax-pills">
                {TAX_OPTIONS.map(t => (
                  <button
                    key={t}
                    className={`invoice-tax-pill ${taxRate === t ? 'active' : ''}`}
                    onClick={() => setTaxRate(t)}
                  >
                    {t}%
                  </button>
                ))}
              </div>
            </div>
            <button className="invoice-btn-outline" onClick={() => { setTempBiz(business); setShowEditor(s => !s); }}>
              ⚙ Edit Details
            </button>
            <button className="invoice-btn-primary" onClick={handlePrint}>
              🖨 Print / Save PDF
            </button>
            <button className="invoice-btn-secondary" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* ── Business Details Editor (hidden on print) ── */}
        {showEditor && (
          <div className="invoice-editor no-print">
            <h4>Business Details</h4>
            <div className="invoice-editor-grid">
              {[
                ['name',    'Business Name'],
                ['tagline', 'Tagline'],
                ['address', 'Address'],
                ['city',    'City & ZIP'],
                ['email',   'Email'],
                ['phone',   'Phone'],
              ].map(([key, label]) => (
                <div key={key} className="invoice-editor-field">
                  <label>{label}</label>
                  <input
                    value={tempBiz[key]}
                    onChange={e => setTempBiz(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="invoice-editor-actions">
              <button className="invoice-btn-primary" onClick={handleSaveBusiness}>Save</button>
              <button className="invoice-btn-secondary" onClick={() => setShowEditor(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Printable Document ── */}
        <div className="invoice-document-inner" ref={printRef}>

          {/* Header */}
          <header className="invoice-header">
            <div className="invoice-branding">
              <div className="invoice-logo-mark">{business.name.charAt(0)}</div>
              <div>
                <h1 id="inv-title" className="invoice-company-name">{business.name}</h1>
                <p className="invoice-tagline">{business.tagline}</p>
                <p className="invoice-address">
                  {business.address}<br />
                  {business.city}<br />
                  {business.email} · {business.phone}
                </p>
              </div>
            </div>
            <div className="invoice-meta-right">
              <div className="invoice-badge">INVOICE</div>
              <div className="invoice-order-id">{order.orderId}</div>
              <div className="invoice-date-row">
                <span className="invoice-meta-label">Issued</span>
                <span>{formatDate(order.date)}</span>
              </div>
              <div className="invoice-date-row">
                <span className="invoice-meta-label">Due</span>
                <span>{getDueDate(order.date)}</span>
              </div>
              <div className={`invoice-status-chip status-${(order.status || '').toLowerCase()}`}>
                {order.status}
              </div>
            </div>
          </header>

          {/* Bill To */}
          <div className="invoice-bill-row">
            <div className="invoice-bill-block">
              <div className="invoice-section-label">Bill To</div>
              <div className="invoice-customer-name">{order.customerName || '—'}</div>
              {order.customerContact && (
                <div className="invoice-customer-contact">{order.customerContact}</div>
              )}
              {order.shippingInfo?.address && (
                <div className="invoice-customer-contact">{order.shippingInfo.address}</div>
              )}
            </div>
            <div className="invoice-bill-block">
              <div className="invoice-section-label">Payment Info</div>
              <div className="invoice-payment-info">Bank Transfer / Cash on Delivery</div>
              <div className="invoice-payment-info muted">Ref: {order.orderId}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>SKU</th>
                <th className="align-right">Qty</th>
                <th className="align-right">Unit Price</th>
                <th className="align-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.lineItems || []).map((line, idx) => {
                const unit      = Number(line.unitPrice) || 0;
                const lineTotal = unit * (Number(line.quantity) || 0);
                return (
                  <tr key={`${line.itemId}-${idx}`}>
                    <td className="invoice-row-num">{idx + 1}</td>
                    <td className="invoice-item-name">{line.name}</td>
                    <td className="invoice-item-sku">{line.sku || '—'}</td>
                    <td className="align-right">{line.quantity}</td>
                    <td className="align-right">{formatMoney(unit)}</td>
                    <td className="align-right invoice-line-total">{formatMoney(lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="invoice-totals-wrapper">
            <div className="invoice-totals-box">
              <div className="invoice-totals-row">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="invoice-totals-row tax">
                  <span>Tax ({taxRate}%)</span>
                  <span>{formatMoney(taxAmount)}</span>
                </div>
              )}
              <div className="invoice-totals-row grand">
                <span>Grand Total</span>
                <strong>{formatMoney(grandTotal)}</strong>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="invoice-notes-section">
            <div className="invoice-section-label">Notes</div>
            <p className="invoice-notes-text no-print-edit">{notes}</p>
            <textarea
              className="invoice-notes-edit no-print"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Footer */}
          <footer className="invoice-footer">
            <div className="invoice-footer-brand">{business.name}</div>
            <div className="invoice-footer-info">{business.email} · {business.phone}</div>
          </footer>
        </div>
      </div>
    </div>
  );
}
