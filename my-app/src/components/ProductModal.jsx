import React, { useState } from 'react';
import InventoryForm from './InventoryForm';
import CsvUploader from './CsvUploader';
import '../styles/Modals.css';

export default function ProductModal({
  isOpen,
  onClose,
  items,
  categories,
  suppliers,
  onAddSupplier,
  onAdd,
  onUpdate,
  editingItem,
  setEditingItem,
}) {
  const [activeMode, setActiveMode] = useState('single');

  if (!isOpen) return null;

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
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">×</button>
        
        <div className="modal-header">
          <h2 className="modal-title">
            {editingItem ? 'Update Catalog Record' : 'Add Product'}
          </h2>
          <p className="modal-subtitle">
            {editingItem 
              ? 'Update the product record details inside the catalog.' 
              : 'Choose to add a single product record or upload a bulk sheet.'}
          </p>
        </div>

        {!editingItem && (
          <div className="modal-tabs">
            <button
              className={`modal-tab-btn ${activeMode === 'single' ? 'active' : ''}`}
              onClick={() => setActiveMode('single')}
            >
              Single Product
            </button>
            <button
              className={`modal-tab-btn ${activeMode === 'bulk' ? 'active' : ''}`}
              onClick={() => setActiveMode('bulk')}
            >
              Bulk Import (CSV)
            </button>
          </div>
        )}

        <div className="modal-body">
          {editingItem || activeMode === 'single' ? (
            <InventoryForm
              variant="modal"
              items={items}
              categories={categories}
              suppliers={suppliers}
              onAddSupplier={onAddSupplier}
              onAdd={(data) => {
                onAdd(data);
                onClose();
              }}
              onUpdate={(data) => {
                onUpdate(data);
                onClose();
              }}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
            />
          ) : (
            <CsvUploader
              onUploadComplete={handleBulkProductUpload}
              expectedHeaders={['name']}
              title="Bulk import products via CSV"
            />
          )}
        </div>
      </div>
    </div>
  );
}
