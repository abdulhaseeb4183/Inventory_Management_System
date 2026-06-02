import React from 'react';
import '../styles/InventorySummary.css';

export default function InventorySummary({ items }) {
  const totalProducts = items.length;
  const totalStock = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockCount = items.filter(item => item.quantity < 5).length;

  return (
    <div className="inventory-summary-container">
      <div className="inventory-summary-card">
        <span className="inventory-summary-label">
          Total Products
        </span>
        <span className="inventory-summary-value">
          {totalProducts}
        </span>
      </div>

      <div className="inventory-summary-card">
        <span className="inventory-summary-label">
          Total Stock Volume
        </span>
        <span className="inventory-summary-value accent">
          {totalStock}
        </span>
      </div>

      <div className={`inventory-summary-card ${lowStockCount > 0 ? 'alert' : ''}`}>
        <span className="inventory-summary-label">
          Low Stock Alerts
        </span>
        <span className={`inventory-summary-value ${lowStockCount > 0 ? 'danger' : 'success'}`}>
          {lowStockCount}
        </span>
      </div>
    </div>
  );
}
