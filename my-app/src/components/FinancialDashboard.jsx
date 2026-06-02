import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import '../styles/FinancialDashboard.css';

const PKR = (n) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n || 0);

const PCT = (n) =>
  Number.isFinite(n) ? `${n.toFixed(1)}%` : '—';

const PERIOD_OPTIONS = ['Weekly', 'Monthly'];

const CHART_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#a78bfa', '#fb923c'];

function getWeekLabel(dateStr) {
  const d = new Date(dateStr);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `W${week} '${String(d.getFullYear()).slice(2)}`;
}

function getMonthLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'short', year: '2-digit' });
}

export default function FinancialDashboard({ items = [], orders = [], purchaseOrders = [] }) {
  const [period, setPeriod] = useState('Monthly');

  // ── KPI Aggregations ─────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    // Revenue: from Sales Orders that are NOT Returned
    const activeOrders = orders.filter(o => o.status !== 'Returned');
    const grossRevenue = activeOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

    // COGS: from Received Purchase Orders
    const receivedPOs = purchaseOrders.filter(po => po.status === 'Received');
    const totalCOGS = receivedPOs.reduce((s, po) => {
      const lineCost = (po.lineItems || []).reduce(
        (ls, line) => ls + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0),
        0
      );
      return s + lineCost;
    }, 0);

    // Inventory Value (cost-based)
    const inventoryValue = items.reduce(
      (s, it) => s + (Number(it.quantity) || 0) * (Number(it.costPrice) || 0),
      0
    );

    const grossProfit = grossRevenue - totalCOGS;
    const margin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    const totalOrders = activeOrders.length;
    const avgOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;

    return { grossRevenue, totalCOGS, grossProfit, margin, inventoryValue, totalOrders, avgOrderValue };
  }, [orders, purchaseOrders, items]);

  // ── Trend Data ────────────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const labelFn = period === 'Weekly' ? getWeekLabel : getMonthLabel;
    const buckets = {};

    orders.forEach(o => {
      if (!o.date) return;
      const key = labelFn(o.date);
      if (!buckets[key]) buckets[key] = { label: key, revenue: 0, cogs: 0, date: o.date };
      if (o.status !== 'Returned') {
        buckets[key].revenue += Number(o.totalAmount) || 0;
      }
    });

    purchaseOrders.forEach(po => {
      if (!po.date || po.status !== 'Received') return;
      const key = labelFn(po.date);
      if (!buckets[key]) buckets[key] = { label: key, revenue: 0, cogs: 0, date: po.date };
      const lineCost = (po.lineItems || []).reduce(
        (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0),
        0
      );
      buckets[key].cogs += lineCost;
    });

    return Object.values(buckets)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(b => ({ ...b, profit: b.revenue - b.cogs }));
  }, [orders, purchaseOrders, period]);

  // ── Category P&L ──────────────────────────────────────────────────────────
  const categoryPL = useMemo(() => {
    const cats = {};

    orders.filter(o => o.status !== 'Returned').forEach(o => {
      (o.lineItems || []).forEach(line => {
        const product = items.find(it => it.id === line.itemId);
        const cat = product?.category || 'Uncategorized';
        if (!cats[cat]) cats[cat] = { category: cat, revenue: 0, cost: 0 };
        const revenue = (Number(line.unitPrice) || 0) * (Number(line.quantity) || 0);
        const cost = (Number(product?.costPrice) || 0) * (Number(line.quantity) || 0);
        cats[cat].revenue += revenue;
        cats[cat].cost += cost;
      });
    });

    return Object.values(cats)
      .map(c => ({ ...c, profit: c.revenue - c.cost, margin: c.revenue > 0 ? ((c.revenue - c.cost) / c.revenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders, items]);

  // ── Product P&L ───────────────────────────────────────────────────────────
  const productPL = useMemo(() => {
    const prods = {};

    orders.filter(o => o.status !== 'Returned').forEach(o => {
      (o.lineItems || []).forEach(line => {
        const product = items.find(it => it.id === line.itemId);
        const key = line.itemId;
        if (!prods[key]) {
          prods[key] = {
            name: line.name || product?.name || 'Unknown',
            sku: line.sku || product?.sku || '—',
            category: product?.category || '—',
            unitsSold: 0, revenue: 0, cost: 0,
            costPrice: Number(product?.costPrice) || 0,
          };
        }
        prods[key].unitsSold += Number(line.quantity) || 0;
        prods[key].revenue += (Number(line.unitPrice) || 0) * (Number(line.quantity) || 0);
        prods[key].cost += prods[key].costPrice * (Number(line.quantity) || 0);
      });
    });

    return Object.values(prods)
      .map(p => ({ ...p, profit: p.revenue - p.cost, margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders, items]);

  // ── Revenue by Category (Pie) ─────────────────────────────────────────────
  const pieData = useMemo(() =>
    categoryPL.filter(c => c.revenue > 0).map(c => ({ name: c.category, value: c.revenue })),
    [categoryPL]
  );

  const isEmpty = orders.length === 0 && purchaseOrders.length === 0;

  return (
    <div className="fin-dashboard">
      <header className="fin-header">
        <div>
          <h2>Financial Summary</h2>
          <p>Profit & Loss overview derived from your Sales Orders and Purchase Orders</p>
        </div>
        <div className="fin-period-toggle">
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p}
              className={`fin-period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      {isEmpty && (
        <div className="fin-empty-state">
          <span>📊</span>
          <h3>No data yet</h3>
          <p>Create Sales Orders and receive Purchase Orders to see your financial summary here.</p>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="fin-kpi-grid">
        <div className="fin-kpi-card accent-green">
          <div className="fin-kpi-label">Gross Revenue</div>
          <div className="fin-kpi-value">{PKR(kpis.grossRevenue)}</div>
          <div className="fin-kpi-sub">{kpis.totalOrders} active orders</div>
        </div>
        <div className="fin-kpi-card accent-red">
          <div className="fin-kpi-label">Cost of Goods Sold</div>
          <div className="fin-kpi-value">{PKR(kpis.totalCOGS)}</div>
          <div className="fin-kpi-sub">From received POs</div>
        </div>
        <div className={`fin-kpi-card ${kpis.grossProfit >= 0 ? 'accent-blue' : 'accent-red'}`}>
          <div className="fin-kpi-label">Gross Profit</div>
          <div className="fin-kpi-value">{PKR(kpis.grossProfit)}</div>
          <div className="fin-kpi-sub">Margin: {PCT(kpis.margin)}</div>
        </div>
        <div className="fin-kpi-card accent-purple">
          <div className="fin-kpi-label">Inventory Value</div>
          <div className="fin-kpi-value">{PKR(kpis.inventoryValue)}</div>
          <div className="fin-kpi-sub">{items.length} SKUs on hand</div>
        </div>
        <div className="fin-kpi-card accent-amber">
          <div className="fin-kpi-label">Avg. Order Value</div>
          <div className="fin-kpi-value">{PKR(kpis.avgOrderValue)}</div>
          <div className="fin-kpi-sub">Per active order</div>
        </div>
      </div>

      {/* ── Revenue & Profit Trend Chart ── */}
      {trendData.length > 0 && (
        <div className="fin-card">
          <div className="fin-card-header">
            <h3>Revenue vs Profit Trend</h3>
            <span className="fin-card-badge">{period}</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={60} />
              <Tooltip
                formatter={(value, name) => [PKR(value), name === 'revenue' ? 'Revenue' : 'Gross Profit']}
                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
              />
              <Legend formatter={(v) => v === 'revenue' ? 'Revenue' : 'Gross Profit'} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#profGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Category Bar + Pie Row ── */}
      {categoryPL.length > 0 && (
        <div className="fin-two-col">
          <div className="fin-card">
            <div className="fin-card-header">
              <h3>Revenue by Category</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryPL} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={55} />
                <Tooltip
                  formatter={(v, n) => [PKR(v), n === 'revenue' ? 'Revenue' : n === 'cost' ? 'Cost' : 'Profit']}
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="fin-card">
            <div className="fin-card-header">
              <h3>Revenue Share</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => PKR(v)} contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Category P&L Table ── */}
      {categoryPL.length > 0 && (
        <div className="fin-card">
          <div className="fin-card-header">
            <h3>Category Profit & Loss</h3>
          </div>
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">Revenue</th>
                  <th className="num">COGS</th>
                  <th className="num">Gross Profit</th>
                  <th className="num">Margin</th>
                </tr>
              </thead>
              <tbody>
                {categoryPL.map((c) => (
                  <tr key={c.category}>
                    <td><strong>{c.category}</strong></td>
                    <td className="num">{PKR(c.revenue)}</td>
                    <td className="num">{PKR(c.cost)}</td>
                    <td className={`num ${c.profit >= 0 ? 'positive' : 'negative'}`}>{PKR(c.profit)}</td>
                    <td className={`num margin-pill ${c.margin >= 30 ? 'good' : c.margin >= 10 ? 'ok' : 'low'}`}>
                      {PCT(c.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Product P&L Table ── */}
      {productPL.length > 0 && (
        <div className="fin-card">
          <div className="fin-card-header">
            <h3>Product Profit & Loss</h3>
            <span className="fin-card-badge">{productPL.length} products</span>
          </div>
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th className="num">Units Sold</th>
                  <th className="num">Revenue</th>
                  <th className="num">COGS</th>
                  <th className="num">Gross Profit</th>
                  <th className="num">Margin</th>
                </tr>
              </thead>
              <tbody>
                {productPL.map((p, i) => (
                  <tr key={i}>
                    <td><strong>{p.name}</strong></td>
                    <td className="sku-cell">{p.sku}</td>
                    <td>{p.category}</td>
                    <td className="num">{p.unitsSold}</td>
                    <td className="num">{PKR(p.revenue)}</td>
                    <td className="num">{PKR(p.cost)}</td>
                    <td className={`num ${p.profit >= 0 ? 'positive' : 'negative'}`}>{PKR(p.profit)}</td>
                    <td className={`num margin-pill ${p.margin >= 30 ? 'good' : p.margin >= 10 ? 'ok' : 'low'}`}>
                      {PCT(p.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
