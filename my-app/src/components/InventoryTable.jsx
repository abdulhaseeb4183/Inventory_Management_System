import React, { useState } from 'react';
import '../styles/InventoryTable.css';

const DEFAULT_COST = 10;
const DEFAULT_SELL = 15;

function supplierLabel(item) {
  const name = item.supplierName?.trim() || item.supplier?.trim();
  return name || '—';
}

function calcMargin(item) {
  const cost = Number(item.costPrice) || DEFAULT_COST;
  const sell = Number(item.sellingPrice) || DEFAULT_SELL;
  if (sell <= 0) return 0;
  return ((sell - cost) / sell) * 100;
}

function MarginBadge({ item }) {
  const margin = calcMargin(item);
  const cls =
    margin >= 30 ? 'margin-badge good' :
    margin >= 10 ? 'margin-badge warn' :
                   'margin-badge low';
  return (
    <span className={cls} title={`Cost: ${item.costPrice} / Sell: ${item.sellingPrice}`}>
      {margin.toFixed(0)}% margin
    </span>
  );
}

export default function InventoryTable({ items, onDelete, onEdit, onAdjustStock, safetyStock = 10 }) {
  const [adjustRowId, setAdjustRowId]     = useState(null);
  const [adjustAmount, setAdjustAmount]   = useState('1');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [search, setSearch]               = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  /* ── helpers ── */
  const openAdjust  = (id) => { setAdjustRowId(id); setAdjustAmount('1'); };
  const closeAdjust = ()   => setAdjustRowId(null);

  const parseAmount = () => {
    const n = Math.floor(Number.parseInt(adjustAmount, 10));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const handleStockIn  = (id) => { const n = parseAmount(); if (n > 0) { onAdjustStock(id, n, 'in');  closeAdjust(); } };
  const handleStockOut = (id) => { const n = parseAmount(); if (n > 0) { onAdjustStock(id, n, 'out'); closeAdjust(); } };

  /* ── unique categories for filter dropdown ── */
  const allCategories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();

  /* ── filtered list ── */
  const q = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (!q) return true;
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.sku  || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="inventory-table-container">

      {/* ── Search & Filter bar ── */}
      <div className="inv-filter-bar">
        <input
          type="search"
          className="inv-filter-input"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
        <select
          className="inv-filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {(search || categoryFilter) && (
          <button
            type="button"
            className="inv-filter-clear"
            onClick={() => { setSearch(''); setCategoryFilter(''); }}
          >
            Clear
          </button>
        )}
        <span className="inv-filter-count">
          {filteredItems.length} / {items.length} products
        </span>
      </div>

      {/* ── Table ── */}
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Supplier</th>
            <th>Status</th>
            <th>Margin</th>
            <th className="align-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => {
            const isLow        = item.quantity < safetyStock;
            const sku          = item.sku?.trim();
            const skuDisplay   = sku || '—';
            const isAdjustOpen = adjustRowId === item._id;
            const confirmingDelete = deleteConfirmId === item._id;

            return (
              <React.Fragment key={item._id}>
                <tr className={`inventory-table-row ${isAdjustOpen ? 'adjust-open' : ''}`}>
                  <td>
                    <div className="inventory-product-name">{item.name}</div>
                    <div className="inventory-product-sku">{skuDisplay}</div>
                    <div className="inventory-product-category">{item.category}</div>
                  </td>
                  <td className="inventory-supplier-cell">{supplierLabel(item)}</td>
                  <td>
                    <span className={`inventory-status-badge ${isLow ? 'low-stock' : 'in-stock'}`}>
                      {isLow ? `Low Stock: ${item.quantity}` : `In Stock: ${item.quantity}`}
                    </span>
                  </td>
                  <td>
                    <MarginBadge item={item} />
                  </td>
                  <td className="align-right">
                    <div className="inventory-actions-container">
                      <button type="button" onClick={() => onEdit(item)} className="inventory-btn-icon accent">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => (isAdjustOpen ? closeAdjust() : openAdjust(item._id))}
                        className="inventory-btn-icon default"
                      >
                        {isAdjustOpen ? 'Close' : 'Adjust stock'}
                      </button>

                      {/* ── Delete with confirmation ── */}
                      {confirmingDelete ? (
                        <span className="inv-delete-confirm">
                          <span className="inv-delete-confirm-text">Sure?</span>
                          <button
                            type="button"
                            className="inventory-btn-icon danger"
                            onClick={() => { onDelete(item._id); setDeleteConfirmId(null); }}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            className="inventory-btn-icon default"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item._id)}
                          className="inventory-btn-icon danger"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* ── Stock adjustment row ── */}
                {isAdjustOpen && (
                  <tr className="inventory-adjust-row">
                    <td colSpan={5} className="inventory-adjust-cell">
                      <div className="inventory-adjust-container">
                        <span className="inventory-adjust-label-left">Quick adjustment</span>
                        <label htmlFor={`qty-${item._id}`} className="inventory-adjust-label">Qty</label>
                        <input
                          id={`qty-${item._id}`}
                          type="number"
                          min="1"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          className="inventory-input-compact"
                        />
                        <button type="button" onClick={() => handleStockIn(item._id)}  className="inventory-btn-compact stock-in">+ Stock-in</button>
                        <button type="button" onClick={() => handleStockOut(item._id)} className="inventory-btn-compact stock-out">− Stock-out</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {items.length === 0 && (
        <div className="inventory-empty-state">No products found. Add your first item to get started.</div>
      )}
      {items.length > 0 && filteredItems.length === 0 && (
        <div className="inventory-empty-state">No products match your search or filter.</div>
      )}
    </div>
  );
}
