import React, { useEffect, useState } from 'react';
import '../styles/PurchaseOrderModal.css';

function nextPoNumber() {
  try {
    const raw = localStorage.getItem('stock_po_seq');
    let n = raw ? parseInt(raw, 10) : 1024;
    if (!Number.isFinite(n) || n < 1) n = 1024;
    localStorage.setItem('stock_po_seq', String(n + 1));
    return `PO-${n}`;
  } catch {
    return `PO-${Date.now().toString().slice(-6)}`;
  }
}

function vendorNameFromItem(item) {
  return (item?.supplierName || item?.supplier || '').trim();
}

function findSupplier(suppliers, name) {
  const q = (name || '').trim().toLowerCase();
  if (!q) return null;
  return suppliers.find((s) => (s.name || '').trim().toLowerCase() === q) || null;
}

export default function PurchaseOrderModal({ item, suppliers, safetyStock, onClose, onSave }) {
  const [poNumber, setPoNumber] = useState('');

  useEffect(() => {
    if (item) setPoNumber(nextPoNumber());
  }, [item]);

  const matched = item ? findSupplier(suppliers, vendorNameFromItem(item)) : null;

  const sku = item?.sku?.trim() || '—';
  const supplierLabel = item ? vendorNameFromItem(item) || '—' : '—';
  const currentQty = Number(item?.quantity) || 0;
  const reorderQty = item ? Math.max(safetyStock - currentQty, 1) : 0;

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!item) return null;

  const handlePrint = () => window.print();

  const handleSaveToSystem = () => {
    if (!onSave) return;
    const vendor = vendorNameFromItem(item);
    const supplier = findSupplier(suppliers, vendor);
    onSave({
      poNumber,
      date: new Date().toISOString(),
      supplierId: supplier ? supplier._id : undefined,
      supplierName: vendor || 'Unknown Supplier',
      status: 'Draft',
      lineItems: [
        {
          itemId: item._id,
          name: item.name,
          sku: item.sku || '—',
          quantity: reorderQty,
          costPrice: item.costPrice != null ? Number(item.costPrice) : 10,
        },
      ],
      totalAmount: reorderQty * (item.costPrice != null ? Number(item.costPrice) : 10),
    });
  };

  return (
    <div
      className="po-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="po-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="po-print-document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="po-modal-actions no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="po-btn-primary"
          >
            Print / Save PDF
          </button>
          {onSave && (
            <button
              type="button"
              onClick={handleSaveToSystem}
              className="po-btn-primary"
              style={{ background: 'var(--success, #10b981)', color: '#fff', borderColor: 'var(--success, #10b981)' }}
            >
              💾 Save Draft PO
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="po-btn-secondary"
          >
            Close
          </button>
        </div>

        <div className="po-document-inner">
          <div className="po-header">
            <div className="po-header-label">
              Purchase order
            </div>
            <h2 id="po-title" className="po-title">
              StockMaster Pro
            </h2>
            <p className="po-subtitle">Inventory reorder request</p>
          </div>

          <div className="po-meta-row">
            <div>
              <div className="po-meta-label">PO number</div>
              <div className="po-meta-value">{poNumber}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="po-meta-label">Date</div>
              <div className="po-meta-value-small">{dateStr}</div>
            </div>
          </div>

          <div className="po-supplier-box">
            <div className="po-supplier-label">
              Supplier
            </div>
            <div className="po-supplier-name">{supplierLabel}</div>
            {matched && (
              <div className="po-supplier-details">
                {matched.email && (
                  <div>
                    <strong style={{ color: 'var(--text-h)' }}>Email:</strong> {matched.email}
                  </div>
                )}
                {matched.phone && (
                  <div>
                    <strong style={{ color: 'var(--text-h)' }}>Phone:</strong> {matched.phone}
                  </div>
                )}
                {(matched.leadTimeDays !== '' && matched.leadTimeDays !== undefined) && (
                  <div>
                    <strong style={{ color: 'var(--text-h)' }}>Lead time:</strong> {matched.leadTimeDays} days
                  </div>
                )}
              </div>
            )}
            {!matched && supplierLabel !== '—' && (
              <p className="po-supplier-empty">
                No matching vendor record — add this name in Supplier Management to auto-fill contact details next time.
              </p>
            )}
          </div>

          <table className="po-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th className="align-right">Reorder qty</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="po-item-name">{item.name}</td>
                <td className="po-item-sku">{sku}</td>
                <td className="po-item-qty align-right">{reorderQty}</td>
              </tr>
            </tbody>
          </table>

          <p className="po-footer-note">
            Reorder quantity is calculated to bring stock up to the safety threshold ({safetyStock} units), based on current on-hand count ({currentQty}).
          </p>
        </div>
      </div>
    </div>
  );
}
