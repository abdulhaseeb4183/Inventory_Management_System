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
  safetyStock = 5,
  onGoToOverview,
  onOpenPurchaseOrder,
  onAdd,
  onUpdate,
  editingItem,
  setEditingItem,
  onDelete,
  onAdjustStock,
  onEditFromTable,
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
                  <InventoryChart items={items} variant="embedded" />
                )}
              </div>
            </div>
          </aside>

          <section className="workspace-form-section" aria-label="Product form">
            <div className="workspace-form-deco" aria-hidden />
            <div className="workspace-form-content">
              <h3 className="workspace-form-title">
                Product record
              </h3>
              <p className="workspace-form-desc">
                Required fields are marked by the browser. SKU must stay unique in your catalog.
              </p>
              <InventoryForm
                variant="workspace"
                items={items}
                categories={categories}
                suppliers={suppliers}
                onAddSupplier={onAddSupplier}
                onAdd={onAdd}
                onUpdate={onUpdate}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
              />
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
          <InventoryTable items={items} onDelete={onDelete} onEdit={onEditFromTable} onAdjustStock={onAdjustStock} />
        </section>
      </div>
    </div>
  );
}
