import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { itemsApi } from '../api/itemsApi';
import { ordersApi } from '../api/ordersApi';
import '../styles/LandingPage.css';

const FEATURES = [
  {
    title: 'Inventory control',
    body: 'SKUs, safety stock, and adjustments in one place—no more broken spreadsheet links.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Suppliers & POs',
    body: 'Vendors, lead times, and purchasing that mirror what your warehouse actually holds.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M10 11h4M10 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Orders & analytics',
    body: 'Sales flow into reports—revenue, margin, and runway without exporting to BI tools.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 15l3-3 2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

function fadeUp(delaySec) {
  return {
    animation: `lpFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${delaySec}s forwards`,
    opacity: 0,
  };
}

export default function LandingPage() {
  // Shared dark mode — same localStorage key as the dashboard
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('sm_darkMode') === 'true'; } catch { return false; }
  });

  // Live snapshot numbers pulled from MongoDB Atlas
  const [snapshot, setSnapshot] = useState({
    products: 0,
    stockValue: 0,
    orders: 0,
    pending: 0,
  });

  // Sync dark mode to localStorage and apply to <html>
  useEffect(() => {
    document.documentElement.className = darkMode ? 'dark-mode' : '';
    try { localStorage.setItem('sm_darkMode', String(darkMode)); } catch { /* ignore */ }
  }, [darkMode]);

  // Fetch real-time snapshot data from MongoDB Atlas
  useEffect(() => {
    async function fetchSnapshot() {
      try {
        const [items, orders] = await Promise.all([
          itemsApi.getAll(),
          ordersApi.getAll(),
        ]);
        const stockValue = items.reduce(
          (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.costPrice) || 10), 0
        );
        setSnapshot({
          products: items.length,
          stockValue: stockValue,
          orders: orders.length,
          pending: orders.filter(o => o.status === 'Pending').length,
        });
      } catch (err) {
        console.error('Failed to load landing page snapshot:', err);
        // Fallback to localStorage
        try {
          const items = JSON.parse(localStorage.getItem('sm_items') || '[]');
          const orders = JSON.parse(localStorage.getItem('sm_orders') || '[]');
          const stockValue = items.reduce(
            (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.costPrice) || 10), 0
          );
          setSnapshot({
            products: items.length,
            stockValue: stockValue,
            orders: orders.length,
            pending: orders.filter(o => o.status === 'Pending').length,
          });
        } catch {
          // Keep default zeros if parsing fails
        }
      }
    }
    fetchSnapshot();
  }, []);

  return (
    <div className="landing-page lp-page-wrapper">
      {/* Ambient orbs */}
      <div className="lp-orb-a lp-skip-transition" aria-hidden />
      <div className="lp-orb-b lp-skip-transition" aria-hidden />

      <header className="lp-header">
        <div className="lp-container lp-header-container">
          <Link
            to="/"
            className="lp-skip-transition lp-brand-link"
            style={{ ...fadeUp(0.02) }}
          >
            StockMaster <span style={{ color: 'var(--accent)' }}>Pro</span>
          </Link>
          <div className="lp-header-actions">
            <div className="lp-skip-transition" style={fadeUp(0.06)}>
              <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
            </div>
            <Link
              to="/auth"
              className="lp-skip-transition lp-nav-btn"
              style={{ ...fadeUp(0.1) }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="lp-main-content">
        {/* Hero */}
        <section className="lp-container lp-hero-section">
          <div className="landing-hero-grid">
            <div>
              <div className="lp-skip-transition" style={{ ...fadeUp(0.05), marginBottom: '1.25rem' }}>
                <div className="lp-shimmer-bar" />
              </div>
              <p
                className="lp-skip-transition lp-ops-title"
                style={{ ...fadeUp(0.12) }}
              >
                Operations OS · 2026
              </p>
              <h1
                className="lp-skip-transition lp-hero-h1"
                style={{ ...fadeUp(0.18) }}
              >
                Inventory, vendors & revenue—aligned in real time
              </h1>
              <p
                className="lp-skip-transition lp-hero-sub"
                style={{ ...fadeUp(0.26) }}
              >
                One workspace for stock, purchase orders, fulfillment, and reporting. Built for teams that need clarity without
                enterprise bloat.
              </p>
              <div className="lp-skip-transition lp-hero-actions" style={{ ...fadeUp(0.34) }}>
                <Link
                  to="/auth"
                  className="lp-btn-primary"
                >
                  Get started
                </Link>
                <a
                  href="#features"
                  className="lp-btn-secondary"
                >
                  See modules
                </a>
              </div>
            </div>

            {/* Preview card */}
            <div className="lp-hero-preview lp-skip-transition" style={fadeUp(0.22)}>
              <div className="lp-card-base lp-preview-card">
                <div className="lp-preview-header">
                  <span className="lp-preview-title">
                    Live snapshot
                  </span>
                  <span className="lp-preview-badge">
                    {snapshot.products > 0 ? 'Active' : 'Empty'}
                  </span>
                </div>
                <div className="lp-mock-lines-container">
                  <div className="lp-mock-bar lp-mock-bar-inner" style={{ width: snapshot.products > 0 ? '88%' : '30%' }} />
                  <div className="lp-mock-bar lp-mock-bar-inner" style={{ width: snapshot.orders  > 0 ? '72%' : '20%' }} />
                  <div className="lp-mock-bar lp-mock-bar-inner" style={{ width: snapshot.products > 0 ? '92%' : '45%' }} />
                </div>
                <div className="lp-preview-grid">
                  <div className="lp-preview-metric">
                    <div className="lp-metric-label">Stock value</div>
                    <div className="lp-metric-value">
                      {snapshot.stockValue > 0
                        ? `Rs ${snapshot.stockValue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
                        : 'Rs —'}
                    </div>
                  </div>
                  <div className="lp-preview-metric">
                    <div className="lp-metric-label">Orders</div>
                    <div className="lp-metric-value lp-metric-value-accent">
                      {snapshot.orders > 0 ? `${snapshot.orders} total` : 'Pipeline'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stat strip */}
          <div
            className="lp-skip-transition lp-stat-strip"
            style={{ ...fadeUp(0.42) }}
          >
            {[
              [`${snapshot.products} SKUs`, 'In your catalog'],
              [`${snapshot.orders} orders`, 'All time'],
              ['Persisted', 'MongoDB Atlas'],
            ].map(([a, b]) => (
              <div key={a} className="lp-stat-card">
                <div className="lp-stat-title">{a}</div>
                <div className="lp-stat-sub">{b}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="lp-container lp-features-section">
          <h2 className="lp-skip-transition lp-section-h2" style={{ ...fadeUp(0.05) }}>
            Built as one system
          </h2>
          <p className="lp-skip-transition lp-section-sub" style={{ ...fadeUp(0.1) }}>
            Every module shares the same data model—so counts, costs, and orders stay consistent from warehouse to leadership.
          </p>

          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <article
                key={f.title}
                className="landing-feature-card lp-skip-transition lp-card-base lp-feature-card"
                style={{ ...fadeUp(0.14 + i * 0.08) }}
              >
                <div className="lp-feature-icon-wrapper">
                  {f.icon}
                </div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-body">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="lp-container lp-cta-section">
          <div
            className="lp-skip-transition lp-card-base lp-cta-card"
            style={{ ...fadeUp(0.08) }}
          >
            <h2 className="lp-cta-h2">
              Ship faster decisions
            </h2>
            <p className="lp-cta-sub">
              Use the admin portal to run inventory, suppliers, sales, and reports without switching tools.
            </p>
            <Link
              to="/auth"
              className="lp-cta-btn"
            >
              Open admin portal
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div
          className="lp-skip-transition lp-footer-content"
          style={{ ...fadeUp(0) }}
        >
          <span className="lp-footer-brand">© {new Date().getFullYear()} StockMaster Pro</span>
          <span className="lp-footer-tagline">Inventory intelligence for modern teams</span>
        </div>
      </footer>
    </div>
  );
}
