import React, { useState, useEffect } from 'react';
import '../styles/InventoryForm.css';

const DEFAULT_COST = 10;
const DEFAULT_SELL = 15;

const emptyForm = {
  name: '',
  sku: '',
  category: '',
  quantity: '',
  supplierName: '',
  costPrice: DEFAULT_COST,
  sellingPrice: DEFAULT_SELL,
};

function priceOrDefault(v, def) {
  if (v === '' || v === undefined || v === null) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export default function InventoryForm({ onAdd, onUpdate, editingItem, setEditingItem, variant = 'default', items = [], suppliers = [], onAddSupplier }) {
  const isWorkspace = variant === 'workspace';
  const [formData, setFormData] = useState(emptyForm);
  const [skuError, setSkuError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name ?? '',
        sku: editingItem.sku ?? '',
        category: editingItem.category ?? '',
        quantity: editingItem.quantity ?? '',
        supplierName: editingItem.supplierName ?? editingItem.supplier ?? '',
        costPrice: priceOrDefault(editingItem.costPrice, DEFAULT_COST),
        sellingPrice: priceOrDefault(editingItem.sellingPrice, DEFAULT_SELL),
      });
    } else {
      setFormData(emptyForm);
    }
  }, [editingItem]);

  useEffect(() => {
    setSkuError('');
  }, [formData.sku]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const skuTrim = formData.sku.trim();
    if (!formData.name || formData.quantity === '' || !formData.category || !skuTrim) return;

    // Duplicate SKU check
    const isDuplicate = items.some(
      (i) => i.sku?.trim().toLowerCase() === skuTrim.toLowerCase() && i.id !== editingItem?.id
    );
    if (isDuplicate) {
      setSkuError(`SKU "${skuTrim}" already exists in your catalog. Choose a unique SKU.`);
      return;
    }

    const costRaw = Number(formData.costPrice);
    const sellRaw = Number(formData.sellingPrice);
    const cost = Number.isFinite(costRaw) ? Math.max(0, costRaw) : DEFAULT_COST;
    const sell = Number.isFinite(sellRaw) ? Math.max(0, sellRaw) : DEFAULT_SELL;
    const payload = {
      ...formData,
      sku: skuTrim,
      supplierName: formData.supplierName.trim(),
      quantity: formData.quantity === '' ? '' : parseInt(formData.quantity, 10),
      costPrice: cost,
      sellingPrice: sell,
    };

    if (editingItem) {
      onUpdate({ ...payload, id: editingItem.id });
    } else {
      onAdd(payload);
    }

    // Auto-register supplier if name is new
    const supplierTrimmed = formData.supplierName.trim();
    if (supplierTrimmed && onAddSupplier) {
      const exists = suppliers.some(
        (s) => s.name.trim().toLowerCase() === supplierTrimmed.toLowerCase()
      );
      if (!exists) {
        onAddSupplier({ name: supplierTrimmed, email: '', phone: '', leadTimeDays: '' });
      }
    }

    setFormData(emptyForm);
    setSkuError('');
    if(setEditingItem) setEditingItem(null);
  };

  return (
    <div className={`inventory-form-shell ${isWorkspace ? 'workspace-mode' : ''}`}>
      {!isWorkspace && (
        <h2 className="inventory-form-title">
          {editingItem ? 'Edit Product' : 'Add New Product'}
        </h2>
      )}
      <form onSubmit={handleSubmit}>
        <label className="inventory-form-label">Product name</label>
        <input
          className="inventory-form-input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Cotton Tee"
          required
        />

        <label className="inventory-form-label">SKU</label>
        <input
          className={`inventory-form-input ${skuError ? 'input-error' : ''}`}
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          placeholder="e.g. SHIRT-BLU-S"
          required
        />
        {skuError && <div className="inventory-form-sku-error">{skuError}</div>}

        <label className="inventory-form-label">Category</label>
        <select
          className="inventory-form-input"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
        >
          <option value="">-- Select Category --</option>

          <optgroup label="Technology & Office">
            <option value="Electronics">Electronics & IT</option>
            <option value="Technology">Technology</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Software">Software & Licenses</option>
          </optgroup>

          <optgroup label="Retail & Consumables">
            <option value="Apparel">Apparel & Clothing</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Beauty & Health">Beauty & Healthcare</option>
            <option value="Sporting Goods">Sporting Goods</option>
            <option value="Books & Media">Books & Media</option>
          </optgroup>

          <optgroup label="Industrial & Hardware">
            <option value="Raw Materials">Raw Materials</option>
            <option value="Tools & Machinery">Tools & Machinery</option>
            <option value="Automotive">Automotive & Parts</option>
            <option value="Packaging">Packaging Materials</option>
          </optgroup>

          <optgroup label="Home & Furniture">
            <option value="Furniture">Furniture</option>
            <option value="Cleaning Supplies">Cleaning Supplies</option>
            <option value="Home Decor">Home Decor</option>
          </optgroup>

          <optgroup label="Other">
            <option value="Miscellaneous">Miscellaneous</option>
          </optgroup>
        </select>

        <label className="inventory-form-label">Supplier name</label>
        {/* datalist gives native autocomplete from saved suppliers */}
        <datalist id="supplier-list">
          {suppliers.map((s) => (
            <option key={s.id ?? s.name} value={s.name} />
          ))}
        </datalist>
        <input
          className="inventory-form-input"
          list="supplier-list"
          value={formData.supplierName}
          onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
          placeholder={suppliers.length > 0 ? 'Type or pick a supplier…' : 'e.g. Acme Wholesale Co.'}
        />
        {suppliers.length > 0 && formData.supplierName.trim() &&
          !suppliers.some(s => s.name.trim().toLowerCase() === formData.supplierName.trim().toLowerCase()) && (
          <div className="inventory-form-new-supplier-hint">
            ✚ &quot;{formData.supplierName.trim()}&quot; will be added as a new supplier on save.
          </div>
        )}

        <label className="inventory-form-label">Cost price (PKR)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="inventory-form-input"
          value={formData.costPrice}
          onChange={(e) => setFormData({ ...formData, costPrice: e.target.value === '' ? '' : parseFloat(e.target.value) })}
          required
        />

        <label className="inventory-form-label">Selling price (PKR)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="inventory-form-input"
          value={formData.sellingPrice}
          onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value === '' ? '' : parseFloat(e.target.value) })}
          required
        />

        <label className="inventory-form-label">Quantity</label>
        <input
          type="number"
          min="0"
          className="inventory-form-input"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
          required
        />

        <button type="submit" className="inventory-form-btn-submit">
          {editingItem ? 'Update Item' : 'Add to Inventory'}
        </button>
        {editingItem && (
          <button
            type="button"
            onClick={() => {
              if(setEditingItem) setEditingItem(null);
              setFormData(emptyForm);
            }}
            className="inventory-form-btn-cancel"
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}
