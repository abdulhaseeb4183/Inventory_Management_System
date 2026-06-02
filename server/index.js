require('dotenv').config();
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Force use of reliable public DNS servers to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const itemsRouter = require('./routes/items');
const suppliersRouter = require('./routes/suppliers');
const ordersRouter = require('./routes/orders');
const purchaseOrdersRouter = require('./routes/purchaseOrders');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dbState: mongoose.connection.readyState });
});

// ── Routes ──
app.use('/api/items', itemsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Connect to MongoDB Atlas, then start server ──
const mongoOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  family: 4, // Force IPv4
};

console.log('🔄 Connecting to MongoDB Atlas...');

mongoose
  .connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Check your MONGO_URI in server/.env');
    console.error('   2. Make sure Network Access in Atlas allows 0.0.0.0/0');
    console.error('   3. Try the Standard (non-SRV) connection string from Atlas → Connect → Compass');
    process.exit(1);
  });
