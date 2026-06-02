import React, { useState, useEffect } from 'react';
import CsvUploader from './CsvUploader';
import '../styles/SupplierManager.css';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  leadTimeDays: '',
};

export default function SupplierManager({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier }) {
  const [form, setForm] = useState(emptyForm);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (editingSupplier) {
      setForm({
        name: editingSupplier.name ?? '',
        email: editingSupplier.email ?? '',
        phone: editingSupplier.phone ?? '',
        leadTimeDays: editingSupplier.leadTimeDays ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingSupplier]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const lt = parseInt(form.leadTimeDays, 10);
    const leadTimeDays = form.leadTimeDays === '' ? '' : (Number.isFinite(lt) ? Math.max(0, lt) : 0);
    const payload = {
      name,
      email: form.email.trim(),
      phone: form.phone.trim(),
      leadTimeDays,
    };

    if (editingSupplier) {
      onUpdateSupplier({ ...payload, _id: editingSupplier._id });
      setEditingSupplier(null);
    } else {
      onAddSupplier(payload);
    }
    setForm(emptyForm);
  };

  const handleBulkUpload = (data) => {
    data.forEach((row) => {
      const name = (row.name || '').trim();
      if (!name) return;
      const lt = parseInt(row.leadTimeDays, 10);
      const leadTimeDays = row.leadTimeDays === '' || row.leadTimeDays == null ? '' : (Number.isFinite(lt) ? Math.max(0, lt) : 0);
      onAddSupplier({
        name,
        email: (row.email || '').trim(),
        phone: (row.phone || '').trim(),
        leadTimeDays,
      });
    });
  };

  return (
    <div className="supplier-manager-container">
      <div className="supplier-form-card">
        <h2 className="supplier-form-title">
          {editingSupplier ? 'Update supplier' : 'Add supplier'}
        </h2>
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

          <label className="supplier-form-label">Lead time (days)</label>
          <input
            type="number"
            min="0"
            className="supplier-form-input"
            value={form.leadTimeDays}
            onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })}
            placeholder="e.g. 7"
          />

          <button
            type="submit"
            className="supplier-submit-btn"
          >
            {editingSupplier ? 'Update supplier' : 'Save supplier'}
          </button>
          {editingSupplier && (
            <button
              type="button"
              className="supplier-cancel-btn"
              onClick={() => setEditingSupplier(null)}
            >
              Cancel edit
            </button>
          )}
        </form>
      </div>

      <div style={{ padding: '0 2rem' }}>
        <CsvUploader 
          onUploadComplete={handleBulkUpload} 
          expectedHeaders={['name']} 
          title="Bulk import suppliers"
        />
      </div>

      <div className="supplier-directory-card">
        <h2 className="supplier-directory-title">Vendor directory</h2>
        <p className="supplier-directory-desc">
          Suppliers saved here can be matched automatically on purchase orders when the product vendor name matches.
        </p>
        <table className="supplier-table">
          <thead>
            <tr className="supplier-table-header-row">
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Lead (days)</th>
              <th className="align-right"> </th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s._id} className="supplier-table-row">
                <td className="supplier-name-cell">{s.name}</td>
                <td className="supplier-text-cell">{s.email || '—'}</td>
                <td className="supplier-text-cell">{s.phone || '—'}</td>
                <td className="supplier-text-cell">{s.leadTimeDays === '' || s.leadTimeDays === undefined ? '—' : s.leadTimeDays}</td>
                <td className="supplier-action-cell">
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setEditingSupplier(s)}
                      className="supplier-edit-btn"
                    >
                      Edit
                    </button>
                    {deleteConfirmId === s._id ? (
                      <div className="supplier-delete-confirm">
                        <span className="supplier-delete-confirm-text">Sure?</span>
                        <button
                          type="button"
                          className="supplier-remove-btn"
                          onClick={() => { onDeleteSupplier(s._id); setDeleteConfirmId(null); }}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className="supplier-edit-btn"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(s._id)}
                        className="supplier-remove-btn"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {suppliers.length === 0 && (
          <div className="supplier-empty-state">No suppliers yet. Add your first vendor above.</div>
        )}
      </div>
    </div>
  );
}
