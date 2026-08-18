require('dotenv').config();
const crypto = require('crypto');
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto.webcrypto || crypto;
}
if (typeof global.crypto === 'undefined') {
  global.crypto = crypto.webcrypto || crypto;
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { sendWhatsAppNotification, sendCustomerWhatsAppReceipt, sendCustomerDeliveredWhatsAppReceipt } = require('./whatsappService.cjs');
const { sendCustomerEmailReceipt, sendDeliveredReceiptEmail } = require('./emailService.cjs');
const Razorpay = require('razorpay');

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

// ── MongoDB Schema & Connection Setup
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
let isMongoConnected = false;

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  phone: { type: String, index: true },
  utrNumber: { type: String, index: true },
  status: { type: String, default: 'PLACED' },
  paymentStatus: { type: String, default: 'PAID_VIA_UPI' },
  customer: {
    name: String,
    phone: String,
    email: String,
    address: String,
  },
  area: mongoose.Schema.Types.Mixed,
  items: [mongoose.Schema.Types.Mixed],
  subtotal: Number,
  deliveryCharge: Number,
  totalAmount: Number,
  paymentMethod: String,
  paymentProof: String,
  deliveryDate: mongoose.Schema.Types.Mixed,
  receiptEmailSent: { type: Boolean, default: false },
  receiptEmailSentAt: Date,
  receiptEmailStatus: String,
  receiptEmailError: String,
  review: {
    rating: Number,
    comment: String,
    submittedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  strict: false,
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => {
      isMongoConnected = true;
      console.log('✅ MongoDB Database connected and orders collection ready');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
} else {
  console.log('ℹ️ MONGODB_URI not detected. Falling back to in-memory order store.');
}

// ── Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'PJR Swagrooha Foods API is running successfully',
    database: isMongoConnected ? 'MongoDB Connected' : 'In-Memory Mode'
  });
});

// ── Admin credentials (from env)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'vishwa81251@gmail.com';
const ADMIN_PASS = process.env.ADMIN_PASS || '9247467111';

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
    db: isMongoConnected ? 'mongodb' : 'in-memory',
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

// ── DELETE /api/orders/all — Admin clears ALL orders (fresh start)
// Requires the admin token in the Authorization header for security.
app.delete('/api/orders/all', async (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();

  // Only allow if token starts with 'jwt_owner_session_' (set at login)
  if (!token.startsWith('jwt_owner_session_')) {
    return res.status(403).json({ error: 'Forbidden. Admin authentication required.' });
  }

  let mongoDeleted = 0;
  let memoryDeleted = 0;

  // Clear MongoDB
  if (isMongoConnected) {
    try {
      const result = await Order.deleteMany({});
      mongoDeleted = result.deletedCount;
    } catch (e) {
      console.error('Error clearing MongoDB orders:', e.message);
      return res.status(500).json({ error: 'Failed to clear MongoDB orders: ' + e.message });
    }
  }

  // Clear in-memory store
  memoryDeleted = orders.length;
  orders = [];

  console.log(`🗑️  Admin cleared all orders. MongoDB: ${mongoDeleted} deleted, In-memory: ${memoryDeleted} deleted.`);
  return res.json({
    success: true,
    message: `All orders cleared successfully. Fresh start! 🚀`,
    mongoDeleted,
    memoryDeleted,
  });
});

// ── Fallback in-memory orders store
let orders = [];

// Helper function to check if UTR was already used for another order
async function isUtrDuplicate(utr, currentOrderId) {
  if (!utr) return false;
  const cleanUtr = utr.trim().toLowerCase();

  // Check MongoDB DB if active
  if (isMongoConnected) {
    try {
      const match = await Order.findOne({
        utrNumber: { $regex: new RegExp(`^${cleanUtr}$`, 'i') },
        orderId: { $ne: currentOrderId }
      }).lean();
      if (match) {
        return true;
      }
    } catch (e) {
      console.error('Error checking duplicate UTR in MongoDB:', e);
    }
  }

  // Check in-memory store
  return orders.some(
    o => o.utrNumber && 
         o.utrNumber.trim().toLowerCase() === cleanUtr && 
         o.orderId !== currentOrderId
  );
}

// Helper function to insert/update order in MongoDB & Memory
async function persistOrder(order) {
  const phone = order.customer && order.customer.phone ? order.customer.phone.trim().toLowerCase() : '';
  const orderToSave = {
    ...order,
    phone: phone || order.phone || '',
    utrNumber: order.utrNumber || 'DIRECT_UPI_PAYMENT',
    status: order.status || 'PLACED',
    paymentStatus: order.paymentStatus || 'PAID_VIA_UPI',
    createdAt: order.createdAt || new Date()
  };

  if (isMongoConnected) {
    try {
      await Order.findOneAndUpdate(
        { orderId: order.orderId },
        { $set: orderToSave },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Order ${order.orderId} saved to MongoDB`);
    } catch (e) {
      console.error('Error saving order to MongoDB:', e);
    }
  }

  orders = orders.filter(o => o.orderId !== order.orderId);
  orders.unshift(orderToSave);
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
  if (isMongoConnected) {
    try {
      const mongoOrders = await Order.find().sort({ createdAt: -1 }).lean();
      return res.json(mongoOrders);
    } catch (e) {
      console.error('Error fetching orders from MongoDB:', e);
    }
  }
  return res.json(orders);
});

// GET /api/orders/:query — track order by orderId / phone / UTR
app.get('/api/orders/:query', async (req, res) => {
  const q = req.params.query.trim();
  const qRegex = new RegExp(`^${q}$`, 'i');

  if (isMongoConnected) {
    try {
      const mongoOrder = await Order.findOne({
        $or: [
          { orderId: { $regex: qRegex } },
          { phone: { $regex: qRegex } },
          { 'customer.phone': { $regex: qRegex } },
          { utrNumber: { $regex: qRegex } },
        ],
      }).lean();
      if (mongoOrder) {
        return res.json(mongoOrder);
      }
    } catch (e) {
      console.error('Error querying MongoDB:', e);
    }
  }

  const qLower = q.toLowerCase();
  const found = orders.find(o =>
    (o.orderId && o.orderId.toLowerCase() === qLower) ||
    (o.customer && o.customer.phone && o.customer.phone.toLowerCase() === qLower) ||
    (o.phone && o.phone.toLowerCase() === qLower) ||
    (o.utrNumber && o.utrNumber.toLowerCase() === qLower)
  );
  if (!found) return res.status(404).json({ error: 'Order not found' });
  res.json(found);
});

// PUT /api/orders/:orderId/status — owner updates status, sends receipt email on DELIVERED
app.put('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status, paymentStatus } = req.body;

  let orderObj = null;

  if (isMongoConnected) {
    try {
      orderObj = await Order.findOne({ orderId }).lean();
    } catch (e) {
      console.error('Error fetching order from MongoDB:', e);
    }
  }

  if (!orderObj) {
    orderObj = orders.find(o => o.orderId === orderId);
  }

  if (!orderObj) return res.status(404).json({ error: 'Order not found' });

  const alreadySent = orderObj.receiptEmailSent || false;
  if (status) orderObj.status = status;
  if (paymentStatus) orderObj.paymentStatus = paymentStatus;

  let emailFields = {};

  // Auto-send delivery receipt (Email + WhatsApp to phone number) when transitioning to DELIVERED
  if (status === 'DELIVERED') {
    // Send WhatsApp delivery receipt to customer's phone number
    sendCustomerDeliveredWhatsAppReceipt(orderObj).catch(err => {
      console.warn('⚠️ WhatsApp delivered receipt error:', err.message);
    });

    if (!alreadySent) {
      const emailResult = await sendDeliveredReceiptEmail(orderObj);
      if (emailResult.success) {
        emailFields = {
          receiptEmailSent: true,
          receiptEmailSentAt: new Date().toISOString(),
          receiptEmailStatus: 'SENT',
          receiptEmailError: null,
        };
      } else {
        emailFields = {
          receiptEmailSent: false,
          receiptEmailStatus: 'FAILED',
          receiptEmailError: emailResult.error || emailResult.message || 'Email delivery failed',
        };
      }
      Object.assign(orderObj, emailFields);
    }
  }

  if (isMongoConnected) {
    try {
      await Order.findOneAndUpdate(
        { orderId },
        { $set: { ...orderObj, ...emailFields } },
        { new: true }
      );
    } catch (e) {
      console.error('Error updating status in MongoDB:', e);
    }
  }

  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...orderObj, ...emailFields };
  }

  res.json({ success: true, order: orderObj });
});

// POST /api/orders/:orderId/resend-receipt — admin manually retries delivery receipt email
app.post('/api/orders/:orderId/resend-receipt', async (req, res) => {
  const { orderId } = req.params;
  let orderObj = null;

  if (isMongoConnected) {
    try {
      orderObj = await Order.findOne({ orderId }).lean();
    } catch (e) {
      console.error('Error fetching order for resend in MongoDB:', e);
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

  if (isMongoConnected) {
    try {
      await Order.findOneAndUpdate(
        { orderId },
        {
          $set: {
            receiptEmailSent: orderObj.receiptEmailSent,
            receiptEmailSentAt: orderObj.receiptEmailSentAt,
            receiptEmailStatus: orderObj.receiptEmailStatus,
            receiptEmailError: orderObj.receiptEmailError,
          },
        }
      );
    } catch (e) {
      console.error('Error persisting resend result in MongoDB:', e);
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

  if (isMongoConnected) {
    try {
      const updated = await Order.findOneAndUpdate(
        { orderId },
        { $set: { review } },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ error: 'Order not found.' });
      }
    } catch (e) {
      console.error('Error saving review in MongoDB:', e);
      return res.status(500).json({ error: 'Failed to save review.' });
    }
  }

  // Sync in-memory store
  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx !== -1) {
    orders[idx].review = review;
  } else if (!isMongoConnected) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  return res.json({ success: true, review });
});

// ── GET /api/stats/rating — Returns average star rating + review count
app.get('/api/stats/rating', async (req, res) => {
  let reviews = [];

  if (isMongoConnected) {
    try {
      const ordersWithReview = await Order.find({ 'review.rating': { $exists: true, $ne: null } }, { review: 1 }).lean();
      reviews = ordersWithReview.map(o => o.review).filter(Boolean);
    } catch (e) {
      console.error('Error fetching ratings from MongoDB:', e);
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

  if (isMongoConnected) {
    try {
      allData = await Order.find().sort({ createdAt: -1 }).lean();
    } catch (e) {
      console.error('Error fetching analytics from MongoDB:', e);
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
    if (isMongoConnected) {
      await Order.deleteMany({});
      console.log('🧹 MongoDB orders collection cleared');
    }
    orders = [];
    return res.json({ success: true, message: 'All order history has been deleted' });
  } catch (e) {
    console.error('Error clearing MongoDB orders:', e);
    return res.status(500).json({ error: 'Failed to clear orders: ' + e.message });
  }
});

// GET /api/admin/orders — owner fetches all orders
app.get('/api/admin/orders', async (req, res) => {
  if (isMongoConnected) {
    try {
      const mongoOrders = await Order.find().sort({ createdAt: -1 }).lean();
      return res.json(mongoOrders);
    } catch (e) {
      console.error('Error fetching orders from MongoDB:', e);
    }
  }
  res.json(orders);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PJR Swagrooha Foods API running on port ${PORT}`);
});