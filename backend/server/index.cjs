require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { sendWhatsAppNotification, sendCustomerWhatsAppReceipt } = require('./whatsappService.cjs');
const { sendCustomerEmailReceipt, sendDeliveredReceiptEmail } = require('./emailService.cjs');
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
      receipt_email_sent BOOLEAN DEFAULT FALSE,
      receipt_email_sent_at TIMESTAMP,
      receipt_email_status VARCHAR(50),
      receipt_email_error TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `)
  .then(() => pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS review JSONB DEFAULT NULL;`))
  .then(() => console.log('✅ PostgreSQL Database connected and orders table ready'))
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

// ── Admin credentials (from env)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'vishwa81251@gmail.com';
const ADMIN_PASS = process.env.ADMIN_PASS || '81251';

// ── POST /api/admin/login — Secure admin authentication
app.post('/api/admin/login', (req, res) => {
  const { email, pass } = req.body;
  const inputEmail = (email || '').trim().toLowerCase();
  if (
    inputEmail &&
    inputEmail === ADMIN_EMAIL.trim().toLowerCase() &&
    pass === ADMIN_PASS
  ) {
    const token = 'jwt_owner_session_' + Date.now();
    return res.json({ success: true, token, email: ADMIN_EMAIL });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// ── Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'PJR Swagrooha Foods API',
    db: pool ? 'postgresql' : 'in-memory',
    emailConfigured: !!(process.env.GMAIL_USER || process.env.SMTP_USER)
  });
});

// ── Test Email Endpoint
app.get('/api/test-email', async (req, res) => {
  const targetEmail = req.query.to;

  // Require the ?to= parameter — never default to owner email
  if (!targetEmail || !targetEmail.includes('@')) {
    return res.status(400).json({
      error: 'Missing or invalid ?to= query parameter. Provide the customer email to test. Example: /api/test-email?to=customer@gmail.com'
    });
  }

  const testOrder = {
    orderId: 'TEST-101',
    customer: { name: 'Test Customer', phone: '8125154114', email: targetEmail, address: 'Test Address, Hyderabad' },
    area: { name: 'Hyderabad' },
    items: [{ name: 'Mutton Pickle (250g)', quantity: 1, unitPrice: 450 }],
    subtotal: 450,
    deliveryCharge: 50,
    totalAmount: 500,
    utrNumber: '123456789012',
    deliveryDate: { dayOfWeekName: 'Saturday', formattedDate: 'Upcoming Saturday' }
  };

  const result = await sendCustomerEmailReceipt(testOrder);
  return res.json({
    recipient: targetEmail,
    gmailUserDetected: !!(process.env.GMAIL_USER || process.env.SMTP_USER),
    gmailPassDetected: !!(process.env.GMAIL_PASS || process.env.SMTP_PASS),
    result: result
  });
});

// ── Fallback in-memory orders store
let orders = [];

// Helper function to check if UTR was already used for another order
async function isUtrDuplicate(utr, currentOrderId) {
  if (!utr) return false;
  const cleanUtr = utr.trim().toLowerCase();

  // Check PostgreSQL DB if active
  if (pool) {
    try {
      const result = await pool.query(
        `SELECT order_id FROM orders 
         WHERE LOWER(utr) = $1 AND LOWER(order_id) != $2 
         LIMIT 1`,
        [cleanUtr, (currentOrderId || '').toLowerCase()]
      );
      if (result.rows.length > 0) {
        return true;
      }
    } catch (e) {
      console.error('Error checking duplicate UTR in PostgreSQL:', e);
    }
  }

  // Check in-memory store
  return orders.some(
    o => o.utrNumber && 
         o.utrNumber.trim().toLowerCase() === cleanUtr && 
         o.orderId !== currentOrderId
  );
}

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
      keyId: RAZORPAY_KEY_ID,
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

// ── POST /api/orders — place new order via Direct Scanner / UPI & trigger notifications
app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.orderId) {
      return res.status(400).json({ error: 'Invalid order data received' });
    }

    // Validate UTR only if paymentProof is NOT uploaded and utrNumber is provided
    const utrPattern = /^\d{12,22}$/;
    if (!order.paymentProof && order.utrNumber && !['SCREENSHOT_PROVED', 'DIRECT_UPI_PAYMENT'].includes(order.utrNumber) && !utrPattern.test(order.utrNumber.trim())) {
      return res.status(400).json({ error: 'UTR must contain only numbers and be 12 to 22 digits long.' });
    }
    // Check for duplicate UTR (excluding current order and non-numeric placeholders)
    if (order.utrNumber && utrPattern.test(order.utrNumber.trim())) {
      const duplicate = await isUtrDuplicate(order.utrNumber, order.orderId);
      if (duplicate) {
        return res.status(400).json({ error: 'Duplicate UTR / Transaction ID detected. Each UTR must be unique.' });
      }
    }

    const finalOrder = {
      ...order,
      status: order.status || 'PLACED',
      paymentStatus: 'PAID_VIA_UPI',
      createdAt: order.createdAt || new Date().toISOString()
    };

    await persistOrder(finalOrder);
    
    // Fire all three automatically in parallel:
    //  1. WhatsApp notification to OWNER (via CallMeBot)
    //  2. WhatsApp receipt to CUSTOMER (via UltraMsg / Meta / Twilio)
    //  3. Email receipt to CUSTOMER (via Gmail SMTP / Resend / Brevo)
    const [ownerWhatsappResult, customerWhatsappResult, emailResult] = await Promise.allSettled([
      sendWhatsAppNotification(finalOrder),
      sendCustomerWhatsAppReceipt(finalOrder),
      sendCustomerEmailReceipt(finalOrder),
    ]);

    return res.status(201).json({ 
      success: true, 
      orderId: finalOrder.orderId,
      ownerWhatsapp: ownerWhatsappResult.value || ownerWhatsappResult.reason?.message,
      customerWhatsapp: customerWhatsappResult.value || customerWhatsappResult.reason?.message,
      email: emailResult.value || emailResult.reason?.message,
    });
  } catch (err) {
    console.error('❌ Error processing /api/orders:', err);
    return res.status(500).json({ error: 'Failed to process order on server: ' + err.message });
  }
});

// GET /api/orders — fetch all orders for admin dashboard
app.get('/api/orders', async (req, res) => {
  if (pool) {
    try {
      const result = await pool.query('SELECT data FROM orders ORDER BY created_at DESC');
      const pgOrders = result.rows.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data);
      return res.json(pgOrders);
    } catch (e) {
      console.error('Error fetching orders from PostgreSQL:', e);
    }
  }
  return res.json(orders);
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

// PUT /api/orders/:orderId/status — owner updates status, sends receipt email on DELIVERED
app.put('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status, paymentStatus } = req.body;

  let updatedOrder = null;

  if (pool) {
    try {
      const result = await pool.query('SELECT data, receipt_email_sent FROM orders WHERE order_id = $1', [orderId]);
      if (result.rows.length > 0) {
        let orderObj = typeof result.rows[0].data === 'string' ? JSON.parse(result.rows[0].data) : result.rows[0].data;
        const alreadySent = result.rows[0].receipt_email_sent || false;

        if (status) orderObj.status = status;
        if (paymentStatus) orderObj.paymentStatus = paymentStatus;

        let emailFields = {};

        // Auto-send delivery receipt only when transitioning to DELIVERED and not already sent
        if (status === 'DELIVERED' && !alreadySent) {
          const emailResult = await sendDeliveredReceiptEmail(orderObj);
          if (emailResult.success) {
            emailFields = {
              receiptEmailSent: true,
              receiptEmailSentAt: new Date().toISOString(),
              receiptEmailStatus: 'SENT',
              receiptEmailError: null,
            };
            Object.assign(orderObj, emailFields);
            await pool.query(
              'UPDATE orders SET data = $1, status = $2, payment_status = $3, receipt_email_sent = TRUE, receipt_email_sent_at = NOW(), receipt_email_status = $4, receipt_email_error = NULL WHERE order_id = $5',
              [JSON.stringify(orderObj), status || orderObj.status, paymentStatus || orderObj.paymentStatus, 'SENT', orderId]
            );
          } else {
            emailFields = {
              receiptEmailSent: false,
              receiptEmailStatus: 'FAILED',
              receiptEmailError: emailResult.error || emailResult.message || 'Email delivery failed',
            };
            Object.assign(orderObj, emailFields);
            await pool.query(
              'UPDATE orders SET data = $1, status = $2, payment_status = $3, receipt_email_sent = FALSE, receipt_email_status = $4, receipt_email_error = $5 WHERE order_id = $6',
              [JSON.stringify(orderObj), status || orderObj.status, paymentStatus || orderObj.paymentStatus, 'FAILED', emailFields.receiptEmailError, orderId]
            );
          }
        } else {
          // Normal status update — preserve existing receipt email fields
          await pool.query(
            'UPDATE orders SET data = $1, status = $2, payment_status = $3 WHERE order_id = $4',
            [JSON.stringify(orderObj), status || orderObj.status, paymentStatus || orderObj.paymentStatus, orderId]
          );
        }

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

// POST /api/orders/:orderId/resend-receipt — admin manually retries delivery receipt email
app.post('/api/orders/:orderId/resend-receipt', async (req, res) => {
  const { orderId } = req.params;
  let orderObj = null;

  if (pool) {
    try {
      const result = await pool.query('SELECT data FROM orders WHERE order_id = $1', [orderId]);
      if (result.rows.length > 0) {
        orderObj = typeof result.rows[0].data === 'string' ? JSON.parse(result.rows[0].data) : result.rows[0].data;
      }
    } catch (e) {
      console.error('Error fetching order for resend:', e);
    }
  }

  if (!orderObj) {
    const found = orders.find(o => o.orderId === orderId);
    if (found) orderObj = found;
  }

  if (!orderObj) return res.status(404).json({ error: 'Order not found' });

  if (orderObj.status !== 'DELIVERED') {
    return res.status(400).json({ error: `Receipt email can only be sent for DELIVERED orders. Current status: ${orderObj.status}` });
  }

  const emailResult = await sendDeliveredReceiptEmail(orderObj);
  const newEmailStatus = emailResult.success ? 'SENT' : 'FAILED';
  const errorMsg = emailResult.success ? null : (emailResult.error || emailResult.message || 'Email delivery failed');

  orderObj.receiptEmailSent = emailResult.success;
  orderObj.receiptEmailStatus = newEmailStatus;
  orderObj.receiptEmailError = errorMsg;
  if (emailResult.success) orderObj.receiptEmailSentAt = new Date().toISOString();

  if (pool) {
    try {
      if (emailResult.success) {
        await pool.query(
          'UPDATE orders SET data = $1, receipt_email_sent = TRUE, receipt_email_sent_at = NOW(), receipt_email_status = $2, receipt_email_error = NULL WHERE order_id = $3',
          [JSON.stringify(orderObj), 'SENT', orderId]
        );
      } else {
        await pool.query(
          'UPDATE orders SET data = $1, receipt_email_sent = FALSE, receipt_email_status = $2, receipt_email_error = $3 WHERE order_id = $4',
          [JSON.stringify(orderObj), 'FAILED', errorMsg, orderId]
        );
      }
    } catch (e) {
      console.error('Error persisting resend result:', e);
    }
  }

  // Sync in-memory store
  const memIdx = orders.findIndex(o => o.orderId === orderId);
  if (memIdx !== -1) orders[memIdx] = orderObj;

  if (emailResult.success) {
    return res.json({
      success: true,
      message: `Receipt email successfully resent to ${orderObj.customer?.email || 'customer'}`,
      receiptEmailSentAt: orderObj.receiptEmailSentAt,
    });
  } else {
    return res.status(500).json({
      success: false,
      error: `Failed to resend receipt email: ${errorMsg}`,
    });
  }
});

// ── POST /api/orders/:orderId/review — Customer submits star rating + comment
app.post('/api/orders/:orderId/review', async (req, res) => {
  const { orderId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  const review = { rating: parseInt(rating), comment: (comment || '').trim(), submittedAt: new Date().toISOString() };

  if (pool) {
    try {
      const result = await pool.query('SELECT data FROM orders WHERE order_id = $1', [orderId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      const orderData = typeof result.rows[0].data === 'string' ? JSON.parse(result.rows[0].data) : result.rows[0].data;
      orderData.review = review;
      await pool.query(
        'UPDATE orders SET review = $1, data = $2 WHERE order_id = $3',
        [JSON.stringify(review), JSON.stringify(orderData), orderId]
      );
    } catch (e) {
      console.error('Error saving review:', e);
      return res.status(500).json({ error: 'Failed to save review.' });
    }
  }

  // Sync in-memory store
  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx !== -1) orders[idx].review = review;

  return res.json({ success: true, review });
});

// ── GET /api/stats/rating — Returns average star rating + review count
app.get('/api/stats/rating', async (req, res) => {
  let reviews = [];

  if (pool) {
    try {
      const result = await pool.query(
        `SELECT review FROM orders WHERE review IS NOT NULL AND review->>'rating' IS NOT NULL`
      );
      reviews = result.rows.map(r => typeof r.review === 'string' ? JSON.parse(r.review) : r.review);
    } catch (e) {
      console.error('Error fetching ratings:', e);
    }
  } else {
    reviews = orders.filter(o => o.review && o.review.rating).map(o => o.review);
  }

  if (reviews.length === 0) {
    return res.json({ averageRating: 4.9, count: 500, hasRealData: false });
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return res.json({
    averageRating: Math.round(avg * 10) / 10,
    count: reviews.length,
    hasRealData: true,
    reviews: reviews.slice(-10).reverse()
  });
});

// ── GET /api/stats/analytics — Admin analytics data
app.get('/api/stats/analytics', async (req, res) => {
  let allData = [];

  if (pool) {
    try {
      const result = await pool.query('SELECT data, created_at FROM orders ORDER BY created_at DESC');
      allData = result.rows.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data);
    } catch (e) {
      console.error('Error fetching analytics:', e);
    }
  } else {
    allData = orders;
  }

  const delivered = allData.filter(o => o.status === 'DELIVERED');
  const totalRevenue = delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Today & this week
  const now = new Date();
  const todayStr = now.toDateString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ordersToday = allData.filter(o => new Date(o.createdAt).toDateString() === todayStr).length;
  const ordersThisWeek = allData.filter(o => new Date(o.createdAt) >= weekAgo).length;

  // Top products
  const productCount = {};
  allData.forEach(o => {
    (o.items || []).forEach(item => {
      const name = item.product?.name || item.productName || 'Unknown';
      productCount[name] = (productCount[name] || 0) + (item.quantity || 1);
    });
  });
  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  // Area breakdown
  const areaCount = {};
  allData.forEach(o => {
    const area = o.area?.name || o.deliveryArea || 'Unknown';
    areaCount[area] = (areaCount[area] || 0) + 1;
  });
  const areaBreakdown = Object.entries(areaCount)
    .sort((a, b) => b[1] - a[1])
    .map(([area, count]) => ({ area, count }));

  // Payment method breakdown
  const paymentBreakdown = {
    utr: allData.filter(o => o.paymentMethod && o.paymentMethod.includes('UTR')).length,
    screenshot: allData.filter(o => o.paymentMethod && o.paymentMethod.includes('Screenshot')).length,
    razorpay: allData.filter(o => o.paymentStatus === 'PAID_VIA_RAZORPAY').length,
  };

  // Average rating
  const ratedOrders = allData.filter(o => o.review && o.review.rating);
  const avgRating = ratedOrders.length > 0
    ? Math.round(ratedOrders.reduce((s, o) => s + o.review.rating, 0) / ratedOrders.length * 10) / 10
    : null;

  return res.json({
    totalOrders: allData.length,
    deliveredOrders: delivered.length,
    totalRevenue,
    ordersToday,
    ordersThisWeek,
    topProducts,
    areaBreakdown,
    paymentBreakdown,
    avgRating,
    ratingCount: ratedOrders.length,
  });
});

// DELETE /api/admin/reset-orders — owner resets all orders to start fresh
app.delete('/api/admin/reset-orders', async (req, res) => {
  try {
    if (pool) {
      await pool.query('TRUNCATE TABLE orders;');
      console.log('🧹 PostgreSQL orders table truncated');
    }
    orders = [];
    return res.json({ success: true, message: 'All order history has been deleted' });
  } catch (e) {
    console.error('Error clearing PostgreSQL orders:', e);
    return res.status(500).json({ error: 'Failed to clear orders: ' + e.message });
  }
});

// GET /api/admin/orders — owner fetches all orders
app.get('/api/admin/orders', async (req, res) => {
  if (pool) {
    try {
      const result = await pool.query('SELECT data FROM orders ORDER BY created_at DESC');
      const pgOrders = result.rows.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data);
      return res.json(pgOrders);
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