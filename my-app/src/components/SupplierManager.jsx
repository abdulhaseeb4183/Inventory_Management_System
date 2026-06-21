import React, { useState } from 'react';
import SupplierModal from './SupplierModal';
import '../styles/SupplierManager.css';

export default function SupplierManager({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier }) {
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="supplier-manager-container">
      <div className="supplier-manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0 2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-h)', margin: 0 }}>Supplier Management</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text)', fontSize: '0.95rem' }}>Maintain vendor directory and contact information.</p>
        </div>
        <div>
          <button
            type="button"
            className="supplier-submit-btn"
            style={{ width: 'auto', padding: '12px 24px', marginTop: 0, borderRadius: '10px' }}
            onClick={() => {
              setEditingSupplier(null);
              setIsModalOpen(true);
            }}
          >
            ✚ Add Supplier
          </button>
        </div>
      </div>

      <div className="supplier-directory-card" style={{ margin: '0 2rem 2rem' }}>
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
              <th>Address</th>
              <th className="align-right"> </th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s._id} className="supplier-table-row">
                <td className="supplier-name-cell">{s.name}</td>
                <td className="supplier-text-cell">{s.email || '—'}</td>
                <td className="supplier-text-cell">{s.phone || '—'}</td>
                <td className="supplier-text-cell">{s.address || '—'}</td>
                <td className="supplier-action-cell">
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(s)}
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

      <SupplierModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddSupplier={onAddSupplier}
        onUpdateSupplier={onUpdateSupplier}
        editingSupplier={editingSupplier}
        setEditingSupplier={setEditingSupplier}
      />
    </div>
  );
}
