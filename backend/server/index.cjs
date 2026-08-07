const express = require('express');
const cors = require('cors');

const app = express();

// Allow requests from Vercel frontend (and localhost for dev)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Allow all in production if FRONTEND_URL is not strictly enforced
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// ── Health check (Render uses this to confirm service is alive)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PJR Swagrooha Foods API' });
});

// ── Orders store (in-memory; replace with a DB later)
let orders = [];

// POST /api/orders — place new order
app.post('/api/orders', (req, res) => {
  const order = req.body;
  if (!order || !order.orderId) {
    return res.status(400).json({ error: 'Invalid order data' });
  }
  // Remove duplicate orderId if re-submitted
  orders = orders.filter(o => o.orderId !== order.orderId);
  orders.unshift(order);
  console.log(`New order received: ${order.orderId}`);
  res.status(201).json({ success: true, orderId: order.orderId });
});

// GET /api/orders/:query — track order by orderId / phone / UTR
app.get('/api/orders/:query', (req, res) => {
  const q = req.params.query.trim().toLowerCase();
  const found = orders.find(o =>
    o.orderId.toLowerCase() === q ||
    (o.customer && o.customer.phone === q) ||
    (o.utrNumber && o.utrNumber.toLowerCase() === q)
  );
  if (!found) return res.status(404).json({ error: 'Order not found' });
  res.json(found);
});

// PUT /api/orders/:orderId/status — owner updates status
app.put('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status, paymentStatus } = req.body;
  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  if (status) orders[idx].status = status;
  if (paymentStatus) orders[idx].paymentStatus = paymentStatus;
  res.json({ success: true, order: orders[idx] });
});

// GET /api/admin/orders — owner fetches all orders
app.get('/api/admin/orders', (req, res) => {
  res.json(orders);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PJR Swagrooha Foods API running on port ${PORT}`);
});