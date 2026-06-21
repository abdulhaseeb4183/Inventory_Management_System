import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import InventoryTable from './InventoryTable';
import ThemeToggle from './ThemeToggle';
import InventoryChart from './InventoryChart';
import InventorySummary from './InventorySummary';
import SupplierManager from './SupplierManager';
import PurchaseOrderModal from './PurchaseOrderModal';
import OrderManager from './OrderManager';
import ProductModal from './ProductModal';
import AddProductWorkspace from './AddProductWorkspace';
import PurchaseOrderManager from './PurchaseOrderManager';
import FinancialDashboard from './FinancialDashboard';
import { itemsApi } from '../api/itemsApi';
import { suppliersApi } from '../api/suppliersApi';
import { ordersApi } from '../api/ordersApi';
import { purchaseOrdersApi } from '../api/purchaseOrdersApi';
import '../styles/Dashboard.css';

const DEFAULT_ITEM_COST = 10;
const DEFAULT_ITEM_SELL = 15;

function nextOrderPublicId() {
  return `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`;
}

const ORDER_STATUSES = ['Pending', 'Shipped', 'Delivered', 'Returned'];

const SIDEBAR_NAV = [
  {
    type: 'group',
    key: 'inventory-group',
    label: 'Inventory Control',
    children: [
      { id: 'inventory', label: 'Stock overview' },
      { id: 'inventory-add', label: 'Add product' },
    ],
  },
  { type: 'item', id: 'suppliers', label: 'Supplier Management' },
  { type: 'item', id: 'purchase-orders', label: 'Purchase Orders' },
  { type: 'item', id: 'sales', label: 'Sales & Orders' },
  { type: 'item', id: 'financials', label: 'Financial Summary' },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('sm_darkMode') === 'true'; } catch { return false; }
  });

  const [editingItem, setEditingItem] = useState(null);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [activeTab, setActiveTab]     = useState('inventory');
  const [poItem, setPoItem]           = useState(null);
  const safetyStock = 10;

  // ── Persist dark mode preference ──
  useEffect(() => { try { localStorage.setItem('sm_darkMode', String(darkMode)); } catch { /* ignore */ } }, [darkMode]);
  useEffect(() => {
    document.documentElement.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  // ── Load all data from MongoDB on mount ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const [fetchedItems, fetchedSuppliers, fetchedOrders, fetchedPOs] = await Promise.all([
        itemsApi.getAll(),
        suppliersApi.getAll(),
        ordersApi.getAll(),
        purchaseOrdersApi.getAll(),
      ]);
      setItems(fetchedItems);
      setSuppliers(fetchedSuppliers);
      setOrders(fetchedOrders);
      setPurchaseOrders(fetchedPOs);
    } catch (err) {
      setApiError(`Could not connect to the server: ${err.message}. Make sure the backend is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Items CRUD ──
  const addItem = async (item) => {
    try {
      const saved = await itemsApi.create(item);
      setItems((prev) => [saved, ...prev]);
    } catch (err) {
      alert(`Failed to add item: ${err.message}`);
    }
  };

  const updateItem = async (updated) => {
    try {
      const saved = await itemsApi.update(updated._id, updated);
      setItems((prev) => prev.map((i) => (i._id === saved._id ? saved : i)));
      setEditingItem(null);
    } catch (err) {
      alert(`Failed to update item: ${err.message}`);
    }
  };

  const deleteItem = async (id) => {
    try {
      await itemsApi.remove(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert(`Failed to delete item: ${err.message}`);
    }
  };

  const adjustStock = async (id, amount, operation) => {
    try {
      const updated = await itemsApi.adjustStock(id, amount, operation);
      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
    } catch (err) {
      alert(`Failed to adjust stock: ${err.message}`);
    }
  };

  // ── Orders CRUD ──
  const handleCreateOrder = async (payload) => {
    const { customerName, customerContact, lineItems } = payload;

    const enrichedLineItems = lineItems.map((line) => {
      const item = items.find((it) => it._id === line.itemId);
      const unitPrice = item
        ? (item.sellingPrice != null ? Number(item.sellingPrice) : DEFAULT_ITEM_SELL)
        : DEFAULT_ITEM_SELL;
      return {
        ...line,
        name: item ? item.name : 'Unknown Product',
        sku: item ? item.sku : '—',
        unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : DEFAULT_ITEM_SELL,
      };
    });

    const totalAmount = enrichedLineItems.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

    const orderPayload = {
      orderId: nextOrderPublicId(),
      date: new Date().toISOString(),
      customerName,
      customerContact,
      lineItems: enrichedLineItems,
      status: 'Pending',
      totalUnits: lineItems.reduce((s, l) => s + l.quantity, 0),
      totalAmount,
      shippingInfo: {
        customerName: customerName.trim(),
        phone: customerContact.trim(),
        address: '',
        courierName: '',
      },
    };

    try {
      const saved = await ordersApi.create(orderPayload);
      setOrders((prev) => [saved, ...prev]);
      // Reflect stock deduction in local state
      setItems((prevItems) =>
        prevItems.map((item) => {
          const line = lineItems.find((l) => l.itemId === item._id);
          if (line) {
            return { ...item, quantity: Math.max(0, (Number(item.quantity) || 0) - line.quantity) };
          }
          return item;
        })
      );
    } catch (err) {
      alert(`Failed to create order: ${err.message}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const updated = await ordersApi.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      // Reflect stock changes locally
      const order = orders.find((o) => o._id === orderId);
      if (order) {
        const oldStatus = order.status;
        if (oldStatus !== newStatus) {
          if (newStatus === 'Returned') {
            setItems((prevItems) =>
              prevItems.map((item) => {
                const line = order.lineItems.find((l) => l.itemId === item._id);
                if (line) return { ...item, quantity: (Number(item.quantity) || 0) + line.quantity };
                return item;
              })
            );
          } else if (oldStatus === 'Returned') {
            setItems((prevItems) =>
              prevItems.map((item) => {
                const line = order.lineItems.find((l) => l.itemId === item._id);
                if (line) return { ...item, quantity: Math.max(0, (Number(item.quantity) || 0) - line.quantity) };
                return item;
              })
            );
          }
        }
      }
    } catch (err) {
      alert(`Failed to update order status: ${err.message}`);
    }
  };

  const handleUpdateShippingInfo = async (orderId, shippingPatch) => {
    try {
      const updated = await ordersApi.updateShipping(orderId, shippingPatch);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (err) {
      alert(`Failed to update shipping info: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await ordersApi.remove(orderId);
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      // Reflect stock restoration locally
      const order = orders.find((o) => o._id === orderId);
      if (order && order.status !== 'Returned') {
        setItems((prevItems) =>
          prevItems.map((item) => {
            const line = order.lineItems.find((l) => l.itemId === item._id);
            if (line) return { ...item, quantity: (Number(item.quantity) || 0) + line.quantity };
            return item;
          })
        );
      }
    } catch (err) {
      alert(`Failed to delete order: ${err.message}`);
    }
  };

  const handleUpdateOrder = async (payload) => {
    const { id, customerName, customerContact, lineItems, status, shippingInfo } = payload;

    const enrichedLineItems = lineItems.map((line) => {
      const item = items.find((it) => it._id === line.itemId);
      const unitPrice = item
        ? (item.sellingPrice != null ? Number(item.sellingPrice) : DEFAULT_ITEM_SELL)
        : DEFAULT_ITEM_SELL;
      return {
        ...line,
        name: item ? item.name : 'Unknown Product',
        sku: item ? item.sku : '—',
        unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : DEFAULT_ITEM_SELL,
      };
    });

    const totalAmount = enrichedLineItems.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

    try {
      const updated = await ordersApi.update(id, {
        customerName,
        customerContact,
        lineItems: enrichedLineItems,
        status,
        totalUnits: enrichedLineItems.reduce((s, l) => s + l.quantity, 0),
        totalAmount,
        shippingInfo: {
          ...shippingInfo,
          customerName: customerName.trim(),
          phone: customerContact.trim(),
        },
      });
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      // Refresh items to reflect stock adjustments made on the server
      const freshItems = await itemsApi.getAll();
      setItems(freshItems);
    } catch (err) {
      alert(`Failed to update order: ${err.message}`);
    }
  };

  // ── Purchase Orders CRUD ──
  const handleCreatePO = async (po) => {
    try {
      const saved = await purchaseOrdersApi.create(po);
      setPurchaseOrders((prev) => [saved, ...prev]);
      if (saved.status === 'Received') {
        const freshItems = await itemsApi.getAll();
        setItems(freshItems);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleUpdatePO = async (updated) => {
    try {
      const saved = await purchaseOrdersApi.update(updated._id, updated);
      setPurchaseOrders((prev) => prev.map((p) => (p._id === saved._id ? saved : p)));
      // Refresh items for any stock changes
      const freshItems = await itemsApi.getAll();
      setItems(freshItems);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleDeletePO = async (id) => {
    try {
      await purchaseOrdersApi.remove(id);
      setPurchaseOrders((prev) => prev.filter((p) => p._id !== id));
      const freshItems = await itemsApi.getAll();
      setItems(freshItems);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Suppliers CRUD ──
  const addSupplier = async (data) => {
    try {
      const saved = await suppliersApi.create(data);
      setSuppliers((prev) => [saved, ...prev]);
    } catch (err) {
      alert(`Failed to add supplier: ${err.message}`);
    }
  };

  const deleteSupplier = async (id) => {
    try {
      await suppliersApi.remove(id);
      setSuppliers((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(`Failed to delete supplier: ${err.message}`);
    }
  };

  const updateSupplier = async (updated) => {
    try {
      const saved = await suppliersApi.update(updated._id, updated);
      setSuppliers((prev) => prev.map((s) => (s._id === saved._id ? saved : s)));
    } catch (err) {
      alert(`Failed to update supplier: ${err.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/auth');
  };

  const lowStockItems = items.filter((item) => (Number(item.quantity) || 0) < safetyStock);

  // ── Loading / Error states ──
  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary, #888)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontSize: '1.1rem' }}>Connecting to MongoDB Atlas…</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>❌</div>
          <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '12px' }}>{apiError}</p>
          <button
            onClick={loadAll}
            style={{ padding: '10px 24px', background: 'var(--accent, #6366f1)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <aside id="dashboard-sidebar" className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            StockMaster <span style={{ color: 'var(--accent)' }}>Pro</span>
          </div>
          <p className="sidebar-subtitle">
            Module navigation
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Main sections">
          <ul className="sidebar-nav-list">
            {SIDEBAR_NAV.map((entry) => {
              if (entry.type === 'group') {
                return (
                  <li key={entry.key}>
                    <div className="sidebar-group-label">
                      {entry.label}
                    </div>
                    <ul className="sidebar-group-list">
                      {entry.children.map(({ id, label }) => {
                        const active = activeTab === id;
                        return (
                          <li key={id}>
                            <button
                              type="button"
                              className={`sidebar-nav-btn nested ${active ? 'active' : ''}`}
                              onClick={() => {
                                setEditingItem(null);
                                setActiveTab(id);
                              }}
                            >
                              {label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              }
              const { id, label } = entry;
              const active = activeTab === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`sidebar-nav-btn ${active ? 'active' : ''}`}
                    onClick={() => {
                      setEditingItem(null);
                      setActiveTab(id);
                    }}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div style={{ minWidth: 0 }}>
            <h1 className="dashboard-header-title">
              StockMaster <span style={{ color: 'var(--accent)' }}>Pro</span>
            </h1>
            <p className="dashboard-header-sub">Professional Inventory Intelligence</p>
          </div>

          <div className="dashboard-header-actions">
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
            <button
              type="button"
              className="dashboard-logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {activeTab === 'inventory' && (
        <>
          <InventorySummary items={items} safetyStock={safetyStock} />

          {items.length > 0 && lowStockItems.length > 0 && (
            <section className="alert-section" aria-label="Actionable low-stock alerts">
              <h2 className="alert-title">
                Actionable alerts
              </h2>
              <div className="alert-list">
                {lowStockItems.map((item) => {
                  const sku = item.sku?.trim() || '—';
                  const qty = Number(item.quantity) || 0;
                  return (
                    <div key={item._id} className="alert-card">
                      <div className="alert-content">
                        <span role="img" aria-label="warning">
                          ⚠️
                        </span>{' '}
                        <strong>Action required:</strong> {item.name} — SKU <strong>{sku}</strong> is running low (Only{' '}
                        <strong>{qty}</strong> left in stock).
                      </div>
                      <button
                        type="button"
                        className="alert-btn"
                        onClick={() => setPoItem(item)}
                      >
                        Create PO
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {items.length > 0 && lowStockItems.length === 0 && (
            <div className="healthy-stock-alert">
              All stock levels are healthy.
            </div>
          )}

          <main className="dashboard-content-grid">
            <div>
              <InventoryChart items={items} safetyStock={safetyStock} />
              <InventoryTable
                items={items}
                onDelete={deleteItem}
                onEdit={(item) => {
                  setEditingItem(item);
                  setProductModalOpen(true);
                }}
                onAdjustStock={adjustStock}
                safetyStock={safetyStock}
              />
            </div>
          </main>
        </>
      )}

      {activeTab === 'inventory-add' && (
        <AddProductWorkspace
          items={items}
          suppliers={suppliers}
          onAddSupplier={addSupplier}
          lowStockItems={lowStockItems}
          safetyStock={safetyStock}
          onGoToOverview={() => {
            setEditingItem(null);
            setActiveTab('inventory');
          }}
          onOpenPurchaseOrder={setPoItem}
          onAdd={addItem}
          onUpdate={updateItem}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          onDelete={deleteItem}
          onAdjustStock={adjustStock}
          onEditFromTable={(item) => {
            setEditingItem(item);
            setProductModalOpen(true);
          }}
          onOpenProductModal={() => {
            setEditingItem(null);
            setProductModalOpen(true);
          }}
        />
      )}

      {activeTab === 'suppliers' && (
        <SupplierManager suppliers={suppliers} onAddSupplier={addSupplier} onUpdateSupplier={updateSupplier} onDeleteSupplier={deleteSupplier} />
      )}

      {activeTab === 'purchase-orders' && (
        <PurchaseOrderManager
          items={items}
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          onCreatePO={handleCreatePO}
          onUpdatePO={handleUpdatePO}
          onDeletePO={handleDeletePO}
        />
      )}

      {activeTab === 'sales' && (
        <OrderManager
          items={items}
          orders={orders}
          onCreateOrder={handleCreateOrder}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
        />
      )}

      {activeTab === 'financials' && (
        <FinancialDashboard
          items={items}
          orders={orders}
          purchaseOrders={purchaseOrders}
        />
      )}

        {poItem && (
          <PurchaseOrderModal
            item={poItem}
            suppliers={suppliers}
            safetyStock={safetyStock}
            onClose={() => setPoItem(null)}
            onSave={(poData) => {
              handleCreatePO(poData);
              setPoItem(null);
            }}
          />
        )}

        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setProductModalOpen(false);
            setEditingItem(null);
          }}
          items={items}
          categories={[]}
          suppliers={suppliers}
          onAddSupplier={addSupplier}
          onAdd={addItem}
          onUpdate={updateItem}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
        />
      </div>
    </div>
  );
}
