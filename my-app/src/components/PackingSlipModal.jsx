import React from 'react';
import '../styles/PackingSlipModal.css';

const COMPANY = {
  name: 'StockMaster Pro',
  tagline: 'Professional Inventory Intelligence',
  address: 'Office 402, Blue Area Business Plaza',
  city: 'Islamabad 44000, Pakistan',
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function PackingSlipModal({ order, onClose }) {
  if (!order) return null;

  const si = order.shippingInfo || {};
  const shipName = (si.customerName || order.customerName || '—').trim() || '—';
  const shipPhone = (si.phone || order.customerContact || '—').trim() || '—';
  const address = (si.address || '').trim() || '—';
  const courier = (si.courierName || '').trim() || '—';

  const handlePrint = () => window.print();

  return (
    <div
      className="packing-slip-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="packing-slip-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="packing-slip-root"
        className="packing-slip-print-root"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="packing-slip-header">
          <h1 id="packing-slip-title" className="packing-slip-title">
            {COMPANY.name}
          </h1>
          <p className="packing-slip-tagline">{COMPANY.tagline}</p>
          <p className="packing-slip-company-info">
            {COMPANY.address}
            <br />
            {COMPANY.city}
          </p>
        </header>

        <div className="packing-slip-meta">
          <p className="packing-slip-meta-label">
            Packing slip
          </p>
          <p className="packing-slip-meta-order">
            {order.isCustom ? 'Dispatch ID' : 'Order'} <span>{order.orderId}</span>
          </p>
          <p className="packing-slip-meta-detail">Date: {formatDate(order.date)}</p>
          {courier !== '—' && (
            <p className="packing-slip-meta-detail">Courier: {courier}</p>
          )}
          {order.shippingInfo?.trackingNumber && (
            <p className="packing-slip-meta-detail">Tracking: {order.shippingInfo.trackingNumber}</p>
          )}
          {order.shippingInfo?.weight && (
            <p className="packing-slip-meta-detail">Weight: {order.shippingInfo.weight} kg</p>
          )}
        </div>

        <section className="packing-slip-section">
          <h2 className="packing-slip-section-title">
            Ship to
          </h2>
          <div className="packing-slip-address-box">
            <div className="packing-slip-name">{shipName}</div>
            <div className="packing-slip-phone">{shipPhone}</div>
            <div className="packing-slip-address">{address}</div>
          </div>
        </section>

        <section>
          <h2 className="packing-slip-section-title">
            Items to pack
          </h2>
          <table className="packing-slip-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {(order.lineItems || []).map((line) => (
                <tr key={`${line.itemId}-${line.sku}`}>
                  <td>{line.name ?? '—'}</td>
                  <td className="packing-slip-table-sku">{line.sku?.trim() || '—'}</td>
                  <td>{line.quantity ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="packing-slip-actions packing-slip-no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="packing-slip-btn-primary"
          >
            Print slip
          </button>
          <button
            type="button"
            onClick={onClose}
            className="packing-slip-btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
