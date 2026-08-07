const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');
const Razorpay = require('razorpay');
const { sendWhatsAppNotification } = require('./whatsappService.cjs');

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

// ── Initialize Razorpay SDK
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

let razorpayInstance = null;
if (razorpayKeyId && razorpayKeySecret) {
  try {
    razorpayInstance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });
    console.log('✅ Razorpay SDK initialized successfully with provided API credentials');
  } catch (err) {
    console.error('❌ Error initializing Razorpay SDK:', err.message);
  }
} else {
  console.log('ℹ️ RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in environment. Running in Demo/Test payment mode.');
}

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
      razorpay_payment_id VARCHAR(100),
      razorpay_order_id VARCHAR(100),
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
    database: pool ? 'PostgreSQL Connected' : 'In-Memory Mode',
    razorpay: razorpayInstance ? 'Active' : 'Demo Mode'
  });
});

// ── Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'PJR Swagrooha Foods API',
    db: pool ? 'postgresql' : 'in-memory',
    razorpay: !!razorpayInstance
  });
});

// ── Fallback in-memory orders store
let orders = [];

// Helper function to insert/update order in PostgreSQL & Memory
async function persistOrder(order) {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO orders (order_id, phone, utr, razorpay_payment_id, razorpay_order_id, data, status, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (order_id) DO UPDATE SET 
           data = $6, 
           status = $7, 
           payment_status = $8,
           razorpay_payment_id = $4,
           razorpay_order_id = $5`,
        [
          order.orderId,
          order.customer && order.customer.phone ? order.customer.phone.trim().toLowerCase() : '',
          order.utrNumber || order.razorpayPaymentId || '',
          order.razorpayPaymentId || '',
          order.razorpayOrderId || '',
          JSON.stringify(order),
          order.status || 'PLACED',
          order.paymentStatus || 'VERIFIED_PAID'
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

// ── 1. Create Razorpay Order Endpoint
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const orderReceipt = receipt || `rcpt_${Date.now()}`;

    // If Razorpay SDK is configured with real API keys
    if (razorpayInstance) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderReceipt,
        notes: notes || {}
      };

      const razorpayOrder = await razorpayInstance.orders.create(options);
      return res.json({
        success: true,
        keyId: razorpayKeyId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      });
    }

    // Demo Mode (fallback if API keys are not provided yet)
    const mockRazorpayOrderId = `order_demo_${Math.floor(100000 + Math.random() * 900000)}`;
    return res.json({
      success: true,
      keyId: 'rzp_test_demo_key',
      razorpayOrderId: mockRazorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderReceipt,
      isDemoMode: true
    });
  } catch (err) {
    console.error('❌ Error creating Razorpay order:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
});

// ── 2. Verify Razorpay Payment Endpoint & Save Order & Trigger WhatsApp
app.post('/api/verify-razorpay-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order } = req.body;

    if (!order || !order.orderId) {
      return res.status(400).json({ error: 'Order details missing' });
    }

    let isSignatureValid = false;

    if (razorpayKeySecret && razorpay_signature) {
      const hmac = crypto.createHmac('sha256', razorpayKeySecret);
      hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
      const generatedSignature = hmac.digest('hex');
      isSignatureValid = (generatedSignature === razorpay_signature);
    } else {
      // Demo / Test mode fallback
      isSignatureValid = true;
      console.log('ℹ️ Running in payment verification demo mode (signature accepted).');
    }

    if (!isSignatureValid) {
      console.error('❌ Razorpay payment signature verification failed!');
      return res.status(400).json({ error: 'Invalid payment signature. Transaction unverified.' });
    }

    // Construct confirmed order object
    const finalOrder = {
      ...order,
      status: 'PLACED',
      paymentStatus: 'VERIFIED_PAID',
      razorpayOrderId: razorpay_order_id || order.razorpayOrderId || '',
      razorpayPaymentId: razorpay_payment_id || order.razorpayPaymentId || `pay_demo_${Date.now()}`,
      razorpaySignature: razorpay_signature || '',
      utrNumber: razorpay_payment_id || order.utrNumber || `PAY-${Date.now()}`,
      paidAt: new Date().toISOString()
    };

    // Save order in database & memory
    await persistOrder(finalOrder);

    // Trigger WhatsApp API Notification
    const whatsappResult = await sendWhatsAppNotification(finalOrder);

    res.status(200).json({
      success: true,
      message: 'Payment verified and order saved successfully',
      orderId: finalOrder.orderId,
      whatsapp: whatsappResult
    });
  } catch (err) {
    console.error('❌ Error verifying Razorpay payment:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

// ── 3. Razorpay Webhook (Server-to-Server Payment Capture Notification)
app.post('/api/razorpay-webhook', async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret) {
    const signature = req.headers['x-razorpay-signature'];
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(JSON.stringify(req.body));
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ status: 'invalid_signature' });
    }
  }

  const event = req.body.event;
  console.log(`🔔 Razorpay Webhook Event received: ${event}`);

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = req.body.payload.payment.entity;
    console.log('Payment Captured:', paymentEntity.id, 'Amount:', paymentEntity.amount / 100);
  }

  res.json({ status: 'ok' });
});

// ── POST /api/orders — place new order (Legacy / Manual UTR endpoint)
app.post('/api/orders', async (req, res) => {
  const order = req.body;
  if (!order || !order.orderId) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  await persistOrder(order);
  
  // Also send WhatsApp notification for manual orders
  sendWhatsAppNotification(order).catch(e => console.error('WhatsApp notify error:', e));

  res.status(201).json({ success: true, orderId: order.orderId });
});

// GET /api/orders/:query — track order by orderId / phone / UTR / paymentId
app.get('/api/orders/:query', async (req, res) => {
  const q = req.params.query.trim().toLowerCase();

  if (pool) {
    try {
      const result = await pool.query(
        `SELECT data FROM orders 
         WHERE LOWER(order_id) = $1 
            OR LOWER(phone) = $1 
            OR LOWER(utr) = $1
            OR LOWER(razorpay_payment_id) = $1
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
    (o.utrNumber && o.utrNumber.toLowerCase() === q) ||
    (o.razorpayPaymentId && o.razorpayPaymentId.toLowerCase() === q)
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