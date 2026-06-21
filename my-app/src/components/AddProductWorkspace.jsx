import React from 'react';
import InventoryChart from './InventoryChart';
import InventoryForm from './InventoryForm';
import InventoryTable from './InventoryTable';
import CsvUploader from './CsvUploader';
import '../styles/AddProductWorkspace.css';

export default function AddProductWorkspace({
  items,
  categories = [],
  suppliers = [],
  onAddSupplier,
  lowStockItems,
  safetyStock = 10,
  onGoToOverview,
  onOpenPurchaseOrder,
  onAdd,
  onUpdate,
  editingItem,
  setEditingItem,
  onDelete,
  onAdjustStock,
  onEditFromTable,
  onOpenProductModal,
}) {
  const metrics = (() => {
    const totalProducts = items.length;
    const totalUnits = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const cats = new Set(items.map((it) => it.category).filter(Boolean));
    return {
      totalProducts,
      totalUnits,
      categoryCount: cats.size,
      lowCount: items.filter((it) => (Number(it.quantity) || 0) < safetyStock).length,
    };
  })();

  const handleBulkProductUpload = (rows) => {
    rows.forEach((row) => {
      const name = (row.name || '').trim();
      if (!name) return;
      onAdd({
        name,
        sku: (row.sku || '').trim(),
        category: (row.category || '').trim(),
        quantity: Number(row.quantity) || 0,
        costPrice: Number(row.costPrice) || 10,
        sellingPrice: Number(row.sellingPrice) || 15,
        supplierName: (row.supplierName || row.supplier || '').trim(),
      });
    });
  };

  const pill = (label, value, accent) => (
    <div className={`workspace-pill ${accent ? 'accent' : ''}`}>
      <div className="workspace-pill-label">
        {label}
      </div>
      <div className="workspace-pill-value">
        {value}
      </div>
    </div>
  );

  return (
    <div className="workspace-container">
      <header className="workspace-header">
        <div className="workspace-header-deco" aria-hidden />
        <div className="workspace-header-content">
          <button
            type="button"
            onClick={onGoToOverview}
            className="workspace-back-btn"
          >
            <span aria-hidden className="workspace-back-icon">←</span>
            Stock overview
          </button>
          <h2 className="workspace-title">
            {editingItem ? 'Update a catalog record' : 'Create a new catalog record'}
          </h2>
          <p className="workspace-desc">
            Enter product details on the right. Metrics and the chart update live from the same inventory data as the rest of the app — nothing is duplicated in a second database.
          </p>
        </div>
      </header>

      <div className="workspace-layout-grid">
        <div className="add-product-main-grid">
          <aside className="workspace-aside" aria-label="Live inventory snapshot">
            <div className="workspace-snapshot-label">
              Live snapshot
            </div>
            <div className="workspace-metrics-grid">
              {pill('SKUs', metrics.totalProducts, false)}
              {pill('Units on hand', metrics.totalUnits, true)}
            </div>
            <div className="workspace-metrics-grid">
              {pill('Categories', metrics.categoryCount, false)}
              {pill('Below safety', metrics.lowCount, metrics.lowCount > 0)}
            </div>

            {lowStockItems.length > 0 && (
              <div className="workspace-alert-box">
                <strong className="workspace-alert-count">{lowStockItems.length}</strong> SKU
                {lowStockItems.length === 1 ? '' : 's'} need attention.{' '}
                <button
                  type="button"
                  onClick={() => onOpenPurchaseOrder(lowStockItems[0])}
                  className="workspace-alert-btn"
                >
                  Draft PO for first alert
                </button>
              </div>
            )}

            <div className="workspace-chart-card">
              <div className="workspace-chart-title">Category mix</div>
              <div className="workspace-chart-desc">
                Quick visual of how stock is spread — updates when you save a product.
              </div>
              <div className="workspace-chart-wrapper">
                {items.length === 0 ? (
                  <div className="workspace-chart-empty">Save your first product to populate this chart.</div>
                ) : (
                  <InventoryChart items={items} variant="embedded" safetyStock={safetyStock} />
                )}
              </div>
            </div>
          </aside>

          <section className="workspace-form-section" aria-label="Product entry card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '340px', padding: '2.5rem', textAlign: 'center' }}>
            <div className="workspace-form-deco" aria-hidden />
            <div className="workspace-form-content" style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>📦</div>
              <h3 className="workspace-form-title" style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-h)' }}>
                Product catalog addition
              </h3>
              <p className="workspace-form-desc" style={{ maxWidth: '340px', fontSize: '0.9rem', color: 'var(--text)', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
                Open the form to register new inventory products or import them using a bulk sheet.
              </p>
              <button
                type="button"
                className="inventory-form-btn-submit"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(170, 59, 255, 0.25)',
                  transition: 'all 0.2s ease',
                  width: 'auto'
                }}
                onClick={onOpenProductModal}
              >
                ✚ Add Product Details
              </button>
            </div>
          </section>
        </div>

        <section className="workspace-table-section" aria-label="Full inventory list">
          <div className="workspace-table-header">
            <div>
              <h3 className="workspace-table-title">
                Full catalog (live)
              </h3>
              <p className="workspace-table-desc">
                Same table as Stock overview. Edits from here jump back into the form above.
              </p>
            </div>
          </div>
          <CsvUploader
            onUploadComplete={handleBulkProductUpload}
            expectedHeaders={['name']}
            title="Bulk import products via CSV"
          />
          <InventoryTable items={items} onDelete={onDelete} onEdit={onEditFromTable} onAdjustStock={onAdjustStock} safetyStock={safetyStock} />
        </section>
      </div>
    </div>
  );
}
