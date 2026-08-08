const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { sendWhatsAppNotification } = require('./whatsappService.cjs');
const Razorpay = require('razorpay');
const crypto = require('crypto');

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
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// ── PostgreSQL Connection Pool (Render Database)
const dbUrl = process.env.DATABASE_URL || process.env.INTERNAL_DATABASE_URL;
let pool = null;

if (dbUrl) {
  pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id VARCHAR(100) PRIMARY KEY,
      phone VARCHAR(50),
      utr VARCHAR(100),
      data JSONB NOT NULL,
      status VARCHAR(50),
      payment_status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `).then(() => console.log('✅ PostgreSQL Database connected and orders table ready'))
    .catch(err => console.error('❌ PostgreSQL table init error:', err));
} else {
  console.log('ℹ️ DATABASE_URL not detected. Falling back to in-memory order store.');
}

// ── Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'PJR Swagrooha Foods API is running successfully',
    database: pool ? 'PostgreSQL Connected' : 'In-Memory Mode'
  });
});

// ── Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'PJR Swagrooha Foods API',
    db: pool ? 'postgresql' : 'in-memory'
  });
});

// ── Fallback in-memory orders store
let orders = [];

// Helper function to insert/update order in PostgreSQL & Memory
async function persistOrder(order) {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO orders (order_id, phone, utr, data, status, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (order_id) DO UPDATE SET 
           data = $4, 
           status = $5, 
           payment_status = $6,
           utr = $3`,
        [
          order.orderId,
          order.customer && order.customer.phone ? order.customer.phone.trim().toLowerCase() : '',
          order.utrNumber || 'DIRECT_UPI_PAYMENT',
          JSON.stringify(order),
          order.status || 'PLACED',
          order.paymentStatus || 'PAID_VIA_UPI'
        ]
      );
      console.log(`✅ Order ${order.orderId} saved to PostgreSQL`);
    } catch (e) {
      console.error('Error saving order to PostgreSQL:', e);
    }
  }

  orders = orders.filter(o => o.orderId !== order.orderId);
  orders.unshift(order);
}

// ── Razorpay credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TNGuNg9TsCrgxS';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'DWd93GhUM4TSKWukxJntyb7W';

// ── POST /api/payment/create-order — Create Razorpay order
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    const amountInPaise = Math.round(amount * 100);

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: 'txn_' + Date.now(),
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (e) {
    console.error('Error creating Razorpay order:', e);
    res.status(500).json({ error: 'Error creating payment order: ' + e.message });
  }
});

// ── POST /api/payment/verify — Verify Razorpay payment signature & amount
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    // 1. Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    // 2. Verify actual amount & status from Razorpay
    if (amount) {
      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });

      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      const expectedAmountInPaise = Math.round(amount * 100);

      if (payment.status !== 'captured') {
        return res.status(400).json({ success: false, message: 'Payment not captured. Status: ' + payment.status });
      }

      if (payment.amount !== expectedAmountInPaise) {
        return res.status(400).json({ success: false, message: `Amount mismatch. Expected ₹${amount}, got ₹${payment.amount / 100}` });
      }
    }

    res.json({ success: true, message: 'Payment verified successfully.' });
  } catch (e) {
    console.error('Error verifying payment:', e);
    res.status(500).json({ success: false, error: 'Error verifying payment: ' + e.message });
  }
});

// ── POST /api/orders — place new order via Direct UPI & trigger WhatsApp
app.post('/api/orders', async (req, res) => {
  const order = req.body;
  if (!order || !order.orderId) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  const finalOrder = {
    ...order,
    status: order.status || 'PLACED',
    paymentStatus: order.paymentStatus || 'PAID_VIA_UPI',
    createdAt: order.createdAt || new Date().toISOString()
  };

  // Verify Razorpay payment before finalizing the order
  if (finalOrder.paymentStatus === 'PAID_VIA_RAZORPAY' && finalOrder.utrNumber) {
    const paymentId = finalOrder.utrNumber;
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TNGuNg9TsCrgxS';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'DWd93GhUM4TSKWukxJntyb7W';
    
    try {
      const rzpResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
        }
      });
      
      if (rzpResponse.ok) {
        const paymentData = await rzpResponse.json();
        const expectedAmountInPaise = Math.round(finalOrder.totalAmount * 100);
        
        if (paymentData.status !== 'captured') {
          return res.status(400).json({ error: 'Payment is not fully captured. Status: ' + paymentData.status });
        }
        
        if (paymentData.amount !== expectedAmountInPaise) {
          return res.status(400).json({ error: 'Payment amount mismatch. Expected ₹' + finalOrder.totalAmount + ' but received ₹' + (paymentData.amount / 100) });
        }
      } else {
        return res.status(400).json({ error: 'Failed to verify payment with Razorpay.' });
      }
    } catch (e) {
      console.error('Error verifying Razorpay payment:', e);
      return res.status(500).json({ error: 'Internal server error verifying payment.' });
    }
  }

  await persistOrder(finalOrder);
  
  // Trigger WhatsApp notification to owner & customer
  const whatsappResult = await sendWhatsAppNotification(finalOrder);

  res.status(201).json({ 
    success: true, 
    orderId: finalOrder.orderId,
    whatsapp: whatsappResult
  });
});

// GET /api/orders/:query — track order by orderId / phone / UTR
app.get('/api/orders/:query', async (req, res) => {
  const q = req.params.query.trim().toLowerCase();

  if (pool) {
    try {
      const result = await pool.query(
        `SELECT data FROM orders 
         WHERE LOWER(order_id) = $1 
            OR LOWER(phone) = $1 
            OR LOWER(utr) = $1
         LIMIT 1`,
        [q]
      );
      if (result.rows.length > 0) {
        const d = result.rows[0].data;
        return res.json(typeof d === 'string' ? JSON.parse(d) : d);
      }
    } catch (e) {
      console.error('Error querying PostgreSQL:', e);
    }
  }

  const found = orders.find(o =>
    o.orderId.toLowerCase() === q ||
    (o.customer && o.customer.phone === q) ||
    (o.utrNumber && o.utrNumber.toLowerCase() === q)
  );
  if (!found) return res.status(404).json({ error: 'Order not found' });
  res.json(found);
});

// PUT /api/orders/:orderId/status — owner updates status
app.put('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status, paymentStatus } = req.body;

  let updatedOrder = null;

  if (pool) {
    try {
      const result = await pool.query('SELECT data FROM orders WHERE order_id = $1', [orderId]);
      if (result.rows.length > 0) {
        let orderObj = typeof result.rows[0].data === 'string' ? JSON.parse(result.rows[0].data) : result.rows[0].data;
        if (status) orderObj.status = status;
        if (paymentStatus) orderObj.paymentStatus = paymentStatus;
        
        await pool.query(
          'UPDATE orders SET data = $1, status = $2, payment_status = $3 WHERE order_id = $4',
          [JSON.stringify(orderObj), status || orderObj.status, paymentStatus || orderObj.paymentStatus, orderId]
        );
        updatedOrder = orderObj;
      }
    } catch (e) {
      console.error('Error updating status in PostgreSQL:', e);
    }
  }

  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx !== -1) {
    if (status) orders[idx].status = status;
    if (paymentStatus) orders[idx].paymentStatus = paymentStatus;
    if (!updatedOrder) updatedOrder = orders[idx];
  }

  if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true, order: updatedOrder });
});

// GET /api/admin/orders — owner fetches all orders
app.get('/api/admin/orders', async (req, res) => {
  if (pool) {
    try {
      const result = await pool.query('SELECT data FROM orders ORDER BY created_at DESC');
      const pgOrders = result.rows.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data);
      if (pgOrders.length > 0) {
        return res.json(pgOrders);
      }
    } catch (e) {
      console.error('Error fetching orders from PostgreSQL:', e);
    }
  }
  res.json(orders);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PJR Swagrooha Foods API running on port ${PORT}`);
});