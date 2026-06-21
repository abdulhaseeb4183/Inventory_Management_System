import React, { useState, useEffect } from 'react';
import CsvUploader from './CsvUploader';
import '../styles/Modals.css';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
};

export default function SupplierModal({
  isOpen,
  onClose,
  onAddSupplier,
  onUpdateSupplier,
  editingSupplier,
  setEditingSupplier,
}) {
  const [form, setForm] = useState(emptyForm);
  const [activeMode, setActiveMode] = useState('single');

  useEffect(() => {
    if (editingSupplier) {
      setForm({
        name: editingSupplier.name ?? '',
        email: editingSupplier.email ?? '',
        phone: editingSupplier.phone ?? '',
        address: editingSupplier.address ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingSupplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const payload = {
      name,
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };

    if (editingSupplier) {
      onUpdateSupplier({ ...payload, _id: editingSupplier._id });
      if (setEditingSupplier) setEditingSupplier(null);
    } else {
      onAddSupplier(payload);
    }
    setForm(emptyForm);
    onClose();
  };

  const handleBulkUpload = (data) => {
    data.forEach((row) => {
      const name = (row.name || '').trim();
      if (!name) return;
      onAddSupplier({
        name,
        email: (row.email || '').trim(),
        phone: (row.phone || '').trim(),
        address: (row.address || '').trim(),
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
            {editingSupplier ? 'Update Vendor Record' : 'Add Supplier'}
          </h2>
          <p className="modal-subtitle">
            {editingSupplier 
              ? 'Update the details for this supplier profile.' 
              : 'Add a single vendor manually or upload a CSV dataset.'}
          </p>
        </div>

        {!editingSupplier && (
          <div className="modal-tabs">
            <button
              className={`modal-tab-btn ${activeMode === 'single' ? 'active' : ''}`}
              onClick={() => setActiveMode('single')}
            >
              Single Supplier
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
          {editingSupplier || activeMode === 'single' ? (
            <form onSubmit={handleSubmit}>
              <label className="supplier-form-label">
                Supplier name <span>*</span>
              </label>
              <input
                className="supplier-form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Acme Wholesale Co."
                required
              />

              <label className="supplier-form-label">Contact email</label>
              <input
                type="email"
                className="supplier-form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="orders@supplier.com"
              />

              <label className="supplier-form-label">Phone</label>
              <input
                type="tel"
                className="supplier-form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />

              <label className="supplier-form-label">Address</label>
              <input
                className="supplier-form-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 123 Main St, Sahiwal"
              />

              <button type="submit" className="supplier-submit-btn">
                {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
              </button>
            </form>
          ) : (
            <CsvUploader
              onUploadComplete={handleBulkUpload}
              expectedHeaders={['name']}
              title="Bulk import suppliers via CSV"
            />
          )}
        </div>
      </div>
    </div>
  );
}
