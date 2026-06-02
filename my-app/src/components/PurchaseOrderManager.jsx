import React, { useState, useEffect } from 'react';
import '../styles/PurchaseOrderManager.css';

const DEFAULT_COST = 10;

function formatPkr(n) {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(n);
}

export default function PurchaseOrderManager({
  items = [],
  suppliers = [],
  purchaseOrders = [],
  onCreatePO,
  onUpdatePO,
  onDeletePO,
}) {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [activePO, setActivePO] = useState(null); // for editing or viewing details
  const [printPO, setPrintPO] = useState(null); // for print preview modal

  // Form State
  const [poNumber, setPoNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [status, setStatus] = useState('Draft');
  const [lineItems, setLineItems] = useState([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Filtering / Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Deletion Confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Generate next PO Number automatically
  const getNextPoSeqNumber = () => {
    try {
      const raw = localStorage.getItem('stock_po_seq');
      let n = raw ? parseInt(raw, 10) : 1024;
      if (!Number.isFinite(n) || n < 1) n = 1024;
      return `PO-${n}`;
    } catch {
      return `PO-${Date.now().toString().slice(-6)}`;
    }
  };

  const incrementPoSeq = () => {
    try {
      const raw = localStorage.getItem('stock_po_seq');
      let n = raw ? parseInt(raw, 10) : 1024;
      localStorage.setItem('stock_po_seq', String(n + 1));
    } catch { /* ignore */ }
  };

  // Switch to Create View
  const handleOpenCreate = () => {
    setPoNumber(getNextPoSeqNumber());
    setSupplierId(suppliers[0]?._id || '');
    setStatus('Draft');
    setLineItems([]);
    setFormError('');
    setFormSuccess('');
    setView('create');
  };

  // Switch to Edit View
  const handleOpenEdit = (po) => {
    setActivePO(po);
    setPoNumber(po.poNumber);
    setSupplierId(po.supplierId);
    setStatus(po.status);
    setLineItems(
      po.lineItems.map((li) => ({
        itemId: li.itemId,
        quantity: li.quantity,
        costPrice: li.costPrice,
      }))
    );
    setFormError('');
    setFormSuccess('');
    setView('edit');
  };

  // Line Item actions
  const handleAddLineItem = () => {
    const defaultItem = items[0];
    if (!defaultItem) {
      setFormError('Cannot add line item. No items exist in inventory.');
      return;
    }
    setLineItems((prev) => [
      ...prev,
      {
        itemId: defaultItem._id,
        quantity: 1,
        costPrice: defaultItem.costPrice != null ? Number(defaultItem.costPrice) : DEFAULT_COST,
      },
    ]);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index, field, value) => {
    setLineItems((prev) =>
      prev.map((li, i) => {
        if (i !== index) return li;
        const updated = { ...li, [field]: value };
        if (field === 'itemId') {
          const matchedItem = items.find((it) => it._id === value);
          if (matchedItem) {
            updated.costPrice =
              matchedItem.costPrice != null ? Number(matchedItem.costPrice) : DEFAULT_COST;
          }
        }
        return updated;
      })
    );
  };

  // Submit PO (Create or Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedPoNum = poNumber.trim();
    if (!trimmedPoNum) {
      setFormError('PO Number is required.');
      return;
    }

    if (!supplierId) {
      setFormError('Supplier is required.');
      return;
    }

    if (lineItems.length === 0) {
      setFormError('At least one line item is required.');
      return;
    }

    // Validate quantities and prices
    for (const li of lineItems) {
      if (Number(li.quantity) <= 0) {
        setFormError('All quantities must be greater than zero.');
        return;
      }
      if (Number(li.costPrice) < 0) {
        setFormError('Cost price cannot be negative.');
        return;
      }
    }

    const selectedSupplier = suppliers.find((s) => s._id === supplierId);
    const enrichedLineItems = lineItems.map((li) => {
      const matched = items.find((it) => it._id === li.itemId);
      return {
        itemId: li.itemId,
        name: matched ? matched.name : 'Unknown Item',
        sku: matched ? matched.sku || '—' : '—',
        quantity: Number(li.quantity),
        costPrice: Number(li.costPrice),
      };
    });

    const totalAmount = enrichedLineItems.reduce(
      (sum, li) => sum + li.quantity * li.costPrice,
      0
    );

    const poData = {
      poNumber: trimmedPoNum,
      supplierId: Number(supplierId),
      supplierName: selectedSupplier ? selectedSupplier.name : 'Unknown Supplier',
      status,
      lineItems: enrichedLineItems,
      totalAmount,
    };

    if (view === 'create') {
      Promise.resolve(onCreatePO({ ...poData, date: new Date().toISOString() })).then((res) => {
        if (res && res.success) {
          incrementPoSeq();
          setView('list');
        } else {
          setFormError((res && res.error) || 'Failed to create Purchase Order.');
        }
      });
    } else {
      Promise.resolve(onUpdatePO({ ...activePO, ...poData })).then((res) => {
        if (res && res.success) {
          setView('list');
        } else {
          setFormError((res && res.error) || 'Failed to update Purchase Order.');
        }
      });
    }
  };

  // Delete handler
  const handleDelete = (id) => {
    Promise.resolve(onDeletePO(id)).then((res) => {
      if (res && res.success) {
        setConfirmDeleteId(null);
      } else {
        alert((res && res.error) || 'Failed to delete Purchase Order.');
      }
    });
  };

  // Filtering Logic
  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="po-manager-container">
      {/* ── Header ── */}
      <div className="po-header-row no-print">
        <div>
          <h2 className="po-header-title">Procurement &amp; Purchase Orders</h2>
          <p className="po-header-desc">
            Manage incoming supply chains, issue purchase orders, and track receipt of goods.
            Status transitions to <strong>Received</strong> automatically increment catalog inventory levels.
          </p>
        </div>
        {view === 'list' && (
          <button type="button" className="po-create-btn" onClick={handleOpenCreate}>
            ➕ Create Purchase Order
          </button>
        )}
      </div>

      {/* ── View Switcher ── */}
      {view === 'list' ? (
        <div className="po-list-view no-print">
          {/* Filters Bar */}
          <div className="po-filters-bar">
            <input
              type="text"
              placeholder="Search by PO number or Supplier..."
              className="po-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="po-status-select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Table */}
          {filteredPOs.length === 0 ? (
            <div className="po-empty-state">
              No purchase orders found matching your search.
            </div>
          ) : (
            <div className="po-table-container">
              <table className="po-table-el">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Items Count</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map((po) => (
                    <tr key={po._id} className="po-table-row">
                      <td className="po-table-num-cell">{po.poNumber}</td>
                      <td>{new Date(po.date).toLocaleDateString()}</td>
                      <td className="po-table-supplier-cell">{po.supplierName}</td>
                      <td>{po.lineItems?.length || 0} SKU(s)</td>
                      <td className="po-table-price-cell">{formatPkr(po.totalAmount)}</td>
                      <td>
                        <span className={`po-status-badge ${po.status.toLowerCase()}`}>
                          {po.status}
                        </span>
                      </td>
                      <td>
                        <div className="po-table-actions">
                          <button
                            type="button"
                            className="po-action-edit-btn"
                            onClick={() => handleOpenEdit(po)}
                          >
                            ✏ Edit
                          </button>
                          <button
                            type="button"
                            className="po-action-print-btn"
                            onClick={() => setPrintPO(po)}
                          >
                            📄 Print
                          </button>
                          <button
                            type="button"
                            className="po-action-delete-btn"
                            onClick={() => setConfirmDeleteId(po._id)}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ── Create / Edit Form View ── */
        <div className="po-form-card no-print">
          <div className="po-form-header">
            <h3>{view === 'create' ? 'New Purchase Order' : `Edit Purchase Order (${poNumber})`}</h3>
            <button type="button" className="po-form-back-btn" onClick={() => setView('list')}>
              ✕ Cancel
            </button>
          </div>

          {formError && <div className="po-form-error-banner">{formError}</div>}

          <form onSubmit={handleSubmit} className="po-form">
            <div className="po-form-row">
              <div className="po-form-group">
                <label className="po-label">PO Number</label>
                <input
                  type="text"
                  className="po-input"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-1024"
                  required
                />
              </div>

              <div className="po-form-group">
                <label className="po-label">Supplier</label>
                <select
                  className="po-input"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Supplier</option>
                  {suppliers.map((sup) => (
                    <option key={sup._id} value={sup._id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="po-form-group">
                <label className="po-label">Status</label>
                <select
                  className="po-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Received">Received (Increments Stock)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div className="po-line-items-section">
              <div className="po-line-items-header">
                <h4>Line Items</h4>
                <button
                  type="button"
                  className="po-add-line-btn"
                  onClick={handleAddLineItem}
                >
                  ➕ Add Item
                </button>
              </div>

              {lineItems.length === 0 ? (
                <div className="po-lines-empty">
                  No products added to this purchase order yet. Click <strong>Add Item</strong> to start building.
                </div>
              ) : (
                <div className="po-lines-list">
                  {lineItems.map((li, index) => {
                          const matchedItem = items.find((it) => it._id === li.itemId);
                          const sku = matchedItem ? matchedItem.sku || '—' : '—';
                            return (
                              <div key={index} className="po-line-row">
                                <div className="po-line-field item-col">
                                  <label className="po-line-sublabel">Product</label>
                                  <select
                                    className="po-input"
                                    value={li.itemId}
                                    onChange={(e) => handleUpdateLineItem(index, 'itemId', e.target.value)}
                                    required
                                  >
                                    {items.map((it) => (
                                      <option key={it._id} value={it._id}>
                                        {it.name}
                                      </option>
                                    ))}
                                  </select>
                        </div>

                        <div className="po-line-field sku-col">
                          <label className="po-line-sublabel">SKU</label>
                          <div className="po-readonly-sku">{sku}</div>
                        </div>

                        <div className="po-line-field qty-col">
                          <label className="po-line-sublabel">Qty</label>
                          <input
                            type="number"
                            className="po-input"
                            value={li.quantity}
                            onChange={(e) =>
                              handleUpdateLineItem(index, 'quantity', Number(e.target.value))
                            }
                            min={1}
                            required
                          />
                        </div>

                        <div className="po-line-field cost-col">
                          <label className="po-line-sublabel">Unit Cost (PKR)</label>
                          <input
                            type="number"
                            className="po-input"
                            value={li.costPrice}
                            onChange={(e) =>
                              handleUpdateLineItem(index, 'costPrice', Number(e.target.value))
                            }
                            min={0}
                            required
                          />
                        </div>

                        <div className="po-line-field total-col">
                          <label className="po-line-sublabel">Total</label>
                          <div className="po-readonly-total">
                            {formatPkr(Number(li.quantity || 0) * Number(li.costPrice || 0))}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="po-line-delete-btn"
                          onClick={() => handleRemoveLineItem(index)}
                          title="Remove item"
                        >
                          🗑
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total Row */}
            <div className="po-form-summary-row">
              <div className="po-form-grand-total">
                Grand Total:{' '}
                <strong>
                  {formatPkr(
                    lineItems.reduce(
                      (sum, li) => sum + Number(li.quantity || 0) * Number(li.costPrice || 0),
                      0
                    )
                  )}
                </strong>
              </div>
              <div className="po-form-submit-actions">
                <button type="button" className="po-cancel-btn" onClick={() => setView('list')}>
                  Cancel
                </button>
                <button type="submit" className="po-save-btn">
                  💾 Save Purchase Order
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Deletion Confirmation Modal Overlay ── */}
      {confirmDeleteId != null && (
        <div className="po-overlay no-print">
          <div className="po-confirm-modal">
            <h4>Confirm Deletion</h4>
            <p>
              Are you sure you want to delete this purchase order?
              If the order has been received, deleting it will attempt to subtract the stock levels.
            </p>
            <div className="po-confirm-actions">
              <button
                type="button"
                className="po-confirm-delete-btn"
                onClick={() => handleDelete(confirmDeleteId)}
              >
                🗑 Delete
              </button>
              <button
                type="button"
                className="po-confirm-cancel-btn"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Print / Preview Modal Overlay ── */}
      {printPO != null && (
        <div className="po-overlay print-overlay-active" onClick={() => setPrintPO(null)}>
          <div className="po-print-card" onClick={(e) => e.stopPropagation()}>
            <div className="po-print-actions no-print">
              <button
                type="button"
                className="po-btn-print-action"
                onClick={() => window.print()}
              >
                Print / Save PDF
              </button>
              <button
                type="button"
                className="po-btn-close-action"
                onClick={() => setPrintPO(null)}
              >
                Close
              </button>
            </div>

            <div className="po-print-doc">
              <div className="po-print-header">
                <span className="po-print-label">Purchase Order</span>
                <h2>StockMaster Pro</h2>
                <p>Procurement Division</p>
              </div>

              <div className="po-print-meta-grid">
                <div>
                  <strong>PO Number:</strong> {printPO.poNumber}
                </div>
                <div>
                  <strong>Date Issued:</strong> {new Date(printPO.date).toLocaleDateString()}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`po-status-badge ${printPO.status.toLowerCase()}`}>
                    {printPO.status}
                  </span>
                </div>
              </div>

              <div className="po-print-vendor-box">
                <h4>Vendor/Supplier</h4>
                <div className="po-vendor-name">{printPO.supplierName}</div>
              </div>

              <table className="po-print-items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>SKU</th>
                    <th className="align-center">Qty</th>
                    <th className="align-right">Unit Cost</th>
                    <th className="align-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {printPO.lineItems?.map((li, index) => (
                    <tr key={index}>
                      <td>{li.name}</td>
                      <td><code>{li.sku}</code></td>
                      <td className="align-center">{li.quantity}</td>
                      <td className="align-right">{formatPkr(li.costPrice)}</td>
                      <td className="align-right">{formatPkr(li.quantity * li.costPrice)}</td>
                    </tr>
                  ))}
                  <tr className="grand-total-row">
                    <td colSpan="4" className="align-right">
                      <strong>Grand Total:</strong>
                    </td>
                    <td className="align-right">
                      <strong>{formatPkr(printPO.totalAmount)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="po-print-footer-text">
                Authorized purchase order. Subject to terms &amp; conditions of purchase.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
