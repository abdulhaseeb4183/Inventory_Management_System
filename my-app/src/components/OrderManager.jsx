import React, { useState } from 'react';
import InvoiceModal from './InvoiceModal';
import '../styles/OrderManager.css';

const DEFAULT_SELL_PRICE = 15;

function formatPkr(n) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(n);
}

const STATUS_STYLES = {
  Pending: { color: '#a16207', bg: 'rgba(234, 179, 8, 0.18)', border: '#eab308' },
  Shipped: { color: '#1d4ed8', bg: 'rgba(37, 99, 235, 0.12)', border: '#3b82f6' },
  Delivered: { color: '#047857', bg: 'rgba(16, 185, 129, 0.14)', border: '#10b981' },
  Returned: { color: '#b91c1c', bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444' },
};

const STATUSES = ['Pending', 'Shipped', 'Delivered', 'Returned'];

function newLineRow() {
  return { key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, itemId: '', quantity: 1 };
}

export default function OrderManager({ items, orders, onCreateOrder, onUpdateOrderStatus, onUpdateOrder, onDeleteOrder }) {
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [lines, setLines] = useState([newLineRow()]);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const stockById = (() => {
    const m = new Map();
    items.forEach((it) => m.set(it._id, Number(it.quantity) || 0));
    if (editingOrder && editingOrder.status !== 'Returned') {
      editingOrder.lineItems.forEach((line) => {
        const id = line.itemId;
        m.set(id, (m.get(id) || 0) + line.quantity);
      });
    }
    return m;
  })();

  const sellPriceById = (() => {
    const m = new Map();
    items.forEach((it) => {
      const sp = it.sellingPrice != null ? Number(it.sellingPrice) : DEFAULT_SELL_PRICE;
      m.set(it._id, Number.isFinite(sp) && sp >= 0 ? sp : DEFAULT_SELL_PRICE);
    });
    return m;
  })();

  const runningTotal = (() => {
    let total = 0;
    lines.forEach((line) => {
      const q = Math.max(0, Math.floor(Number(line.quantity)) || 0);
      if (!line.itemId) return;
      const unit = sellPriceById.get(line.itemId) ?? DEFAULT_SELL_PRICE;
      total += q * unit;
    });
    return total;
  })();

  const runningUnits = (() => {
    return lines.reduce((sum, line) => {
      const q = Math.max(0, Math.floor(Number(line.quantity)) || 0);
      return line.itemId ? sum + q : sum;
    }, 0);
  })();

  const addLine = () => setLines((prev) => [...prev, newLineRow()]);

  const updateLine = (key, patch) => {
    setLines((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeLine = (key) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  const handleStartEdit = (order) => {
    setEditingOrder(order);
    setCustomerName(order.customerName);
    setCustomerContact(order.customerContact || '');
    const formLines = (order.lineItems || []).map((line) => ({
      key: `${line.itemId}-${Math.random().toString(36).slice(2)}`,
      itemId: String(line.itemId),
      quantity: line.quantity,
    }));
    setLines(formLines.length > 0 ? formLines : [newLineRow()]);
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setCustomerName('');
    setCustomerContact('');
    setLines([newLineRow()]);
  };

  const validateAndSubmit = (e) => {
    e.preventDefault();
    const name = customerName.trim() || 'Guest';

    const payloadLines = lines
      .filter((row) => row.itemId)
      .map((row) => ({ itemId: row.itemId, quantity: Math.max(1, Number(row.quantity) || 1) }));

    if (editingOrder) {
      onUpdateOrder({
        id: editingOrder._id,
        customerName: name,
        customerContact: customerContact.trim(),
        lineItems: payloadLines,
        status: editingOrder.status,
        shippingInfo: editingOrder.shippingInfo,
      });
      setEditingOrder(null);
    } else {
      onCreateOrder({
        customerName: name,
        customerContact: customerContact.trim(),
        lineItems: payloadLines,
      });
    }

    setCustomerName('');
    setCustomerContact('');
    setLines([newLineRow()]);
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('en-PK');
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <div className="order-manager-grid">
        <section className="order-card">
          <h2 className="order-card-title">{editingOrder ? `Update order ${editingOrder.orderId}` : 'Create new order'}</h2>
          <p className="order-card-desc">
            Line totals use each product&apos;s <strong>selling price</strong> (default {formatPkr(DEFAULT_SELL_PRICE)} if unset). {editingOrder ? 'Quantities are adjusted in inventory based on item differences.' : 'Quantities are deducted from inventory when the order is created.'}
          </p>

          <form onSubmit={validateAndSubmit}>
            <label className="order-form-label">Customer name</label>
            <input
              className="order-form-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Jane Customer"
              required
            />

            <label className="order-form-label">Customer email / phone</label>
            <input
              className="order-form-input"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              placeholder="jane@email.com or +1 555-0100"
            />

            <div className="order-form-section-title">Line items</div>

            {lines.map((row) => {
              const available = row.itemId ? stockById.get(row.itemId) : null;
              const qty = Math.max(0, Math.floor(Number(row.quantity)) || 0);
              const over = row.itemId && qty > (available ?? 0);

              return (
                <div key={row.key} className="order-line-item">
                  <div className="order-line-item-row">
                    <div className="order-line-item-col">
                      <label className="order-line-label">Product</label>
                      <select
                        className="order-form-input no-mb"
                        value={row.itemId}
                        onChange={(e) => updateLine(row.key, { itemId: e.target.value, quantity: row.quantity })}
                      >
                        <option value="">— Select product —</option>
                        {items.map((it) => {
                          const q = Number(it.quantity) || 0;
                          return (
                            <option key={it._id} value={String(it._id)}>
                              {it.name} (stock: {q})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="order-line-item-col-small">
                      <label className="order-line-label">Qty</label>
                      <input
                        type="number"
                        min="1"
                        className="order-form-input no-mb"
                        value={row.quantity}
                        onChange={(e) => updateLine(row.key, { quantity: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(row.key)}
                      className="order-remove-line-btn"
                    >
                      Remove
                    </button>
                  </div>
                  {row.itemId && (
                    <div className={`order-line-warning ${over ? 'over-stock' : ''}`}>
                      Available: {available ?? 0}
                      {over && ' — quantity exceeds available stock.'}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={addLine}
              className="order-add-line-btn"
            >
              + Add line
            </button>

            <div className="order-summary-box">
              <span className="order-summary-label">Total items (units)</span>
              <span className="order-summary-value">{runningUnits}</span>
            </div>
            <div className="order-summary-box highlight">
              <span className="order-summary-label">Order total (est.)</span>
              <span className="order-summary-value highlight">
                {formatPkr(runningTotal)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="submit" className="order-submit-btn" style={{ margin: 0 }}>
                {editingOrder ? 'Update order' : 'Submit order'}
              </button>
              {editingOrder && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="order-remove-line-btn"
                  style={{ width: '100%', padding: '14px', margin: 0 }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="order-card history-card">
          <h2 className="order-card-title padded">Order history</h2>
          <p className="order-card-desc padded">
            Update fulfillment status or generate an invoice. Marking an order <strong>Returned</strong> restores stock. Use <strong>Delivery &amp; Dispatch</strong> for shipping details and packing slips.
          </p>
          <div className="order-table-container">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total items</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...orders].reverse().map((order) => {
                  const st = STATUS_STYLES[order.status] || STATUS_STYLES.Pending;
                  return (
                    <tr key={order._id} className="order-table-row">
                      <td className="order-id-cell">{order.orderId}</td>
                      <td className="order-date-cell">{formatDate(order.date)}</td>
                      <td className="order-customer-cell">{order.customerName}</td>
                      <td className="order-units-cell">{order.totalUnits ?? 0}</td>
                      <td>
                        <select
                          className="order-status-select"
                          value={STATUSES.includes(order.status) ? order.status : 'Pending'}
                          onChange={(e) => onUpdateOrderStatus(order._id, e.target.value)}
                          style={{ // Keeping dynamic inline styles mapped to STATUS_STYLES
                            borderColor: st.border,
                            backgroundColor: st.bg,
                            color: st.color,
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="align-right">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(order)}
                            className="order-invoice-btn"
                            style={{ padding: '6px 10px', minWidth: 'auto', background: 'var(--accent)', color: '#fff', border: 'none' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(order)}
                            className="order-invoice-btn"
                            style={{ padding: '6px 10px', minWidth: 'auto' }}
                          >
                            Invoice
                          </button>
                          {deleteConfirmId === order._id ? (
                            <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text)' }}>Sure?</span>
                              <button
                                type="button"
                                onClick={() => { onDeleteOrder(order._id); setDeleteConfirmId(null); }}
                                className="order-remove-line-btn"
                                style={{ padding: '4px 8px', margin: 0, background: 'var(--danger)', color: '#fff', border: 'none' }}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="order-invoice-btn"
                                style={{ padding: '4px 8px', margin: 0, minWidth: 'auto' }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(order._id)}
                              className="order-remove-line-btn"
                              style={{ padding: '6px 10px', margin: 0 }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <div className="order-empty-state">No orders yet.</div>
          )}
        </section>
      </div>

      {invoiceOrder && <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}
    </div>
  );
}
