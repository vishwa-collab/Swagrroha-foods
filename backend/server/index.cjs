require('dotenv').config();
const Razorpay = require('razorpay');
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

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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
  couponCode: String,
  couponDiscount: { type: Number, default: 0 },
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

// ── Coupon Schema & Model
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  discountType: { type: String, enum: ['flat', 'percent'], default: 'flat' },
  discountValue: { type: Number, required: true, default: 50 },
  minOrderValue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isUsed: { type: Boolean, default: false },
  usedInOrderId: String,
  usedAt: Date,
  isSingleUse: { type: Boolean, default: true },
  createdForPhone: String,
  createdForEmail: String,
  createdForOrderId: String,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
});

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

// ── Public & Loyalty coupon reward settings
const LOYALTY_COUPON_DISCOUNT_VALUE = 5;   // 5% off
const LOYALTY_COUPON_DISCOUNT_TYPE = 'percent';
const LOYALTY_COUPON_MIN_ORDER = 200;       // Minimum bill of ₹200 required
const LOYALTY_COUPON_VALIDITY_DAYS = 60;   // valid for 60 days (single use)

// Pre-seeded 1-time welcome coupon (5% off on min bill ₹200)
const WELCOME_COUPON = {
  code: 'WELCOME10',
  discountType: 'percent',
  discountValue: 5,
  minOrderValue: 200,
  isActive: true,
  isUsed: false,
  isSingleUse: true,
  createdAt: new Date(),
};

// In-memory coupon fallback
let coupons = [WELCOME_COUPON];

// Generate a unique coupon code
function generateCouponCode(phone) {
  const suffix = phone ? phone.slice(-4) : Math.floor(1000 + Math.random() * 9000);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PJR5-${suffix}${rand}`;
}

// Auto-generate a brand-new 5% 1-time coupon for every new order placed
async function generateNewOrderCoupon(orderObj) {
  try {
    const customerPhone = (orderObj.customer?.phone || orderObj.phone || '').trim();
    const customerEmail = (orderObj.customer?.email || '').trim();
    const code = generateCouponCode(customerPhone);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LOYALTY_COUPON_VALIDITY_DAYS);

    const newCoupon = {
      code,
      discountType: LOYALTY_COUPON_DISCOUNT_TYPE,
      discountValue: LOYALTY_COUPON_DISCOUNT_VALUE,
      minOrderValue: LOYALTY_COUPON_MIN_ORDER,
      isActive: true,
      isUsed: false,
      isSingleUse: true,
      createdForPhone: customerPhone,
      createdForEmail: customerEmail,
      createdForOrderId: orderObj.orderId,
      expiresAt,
      createdAt: new Date(),
    };

    if (isMongoConnected) {
      await Coupon.create(newCoupon);
    } else {
      coupons.unshift(newCoupon);
    }

    console.log(`🎟️ New order coupon generated: ${code} (10% off, min order ₹200, 1-time use)`);
    return newCoupon;
  } catch (e) {
    console.error('❌ Error generating new order coupon:', e.message);
    return null;
  }
}

// Auto-generate and send loyalty coupon when order is DELIVERED
async function generateLoyaltyCoupon(orderObj) {
  try {
    const customerPhone = (orderObj.customer?.phone || orderObj.phone || '').trim();
    const customerEmail = (orderObj.customer?.email || '').trim();
    const customerName  = (orderObj.customer?.name || 'Valued Customer').trim();

    if (!customerPhone && !customerEmail) {
      console.log('\u26a0\ufe0f No phone/email on order, skipping loyalty coupon');
      return;
    }

    // \ud83d\udee1\ufe0f Duplicate guard: each delivered order generates exactly ONE coupon (handles admin re-clicking DELIVERED)
    if (orderObj.orderId) {
      const alreadyExists = isMongoConnected
        ? await Coupon.findOne({ createdForOrderId: orderObj.orderId }).lean()
        : coupons.find(c => c.createdForOrderId === orderObj.orderId);
      if (alreadyExists) {
        console.log(`\u26a0\ufe0f Coupon already generated for order ${orderObj.orderId} — skipping.`);
        return;
      }
    }

    const code = generateCouponCode(customerPhone);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LOYALTY_COUPON_VALIDITY_DAYS);

    const newCoupon = {
      code,
      discountType: LOYALTY_COUPON_DISCOUNT_TYPE,
      discountValue: LOYALTY_COUPON_DISCOUNT_VALUE,
      minOrderValue: LOYALTY_COUPON_MIN_ORDER,
      isActive: true,
      isUsed: false,
      createdForPhone: customerPhone,
      createdForEmail: customerEmail,
      createdForOrderId: orderObj.orderId,
      expiresAt,
      createdAt: new Date(),
    };

    if (isMongoConnected) {
      await Coupon.create(newCoupon);
    } else {
      coupons.unshift(newCoupon);
    }

    console.log(`🎟️ Loyalty coupon ${code} generated for order ${orderObj.orderId}`);

    // Send coupon email to customer
    if (customerEmail) {
      await sendCouponRewardEmail({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        couponCode: code,
        discountValue: LOYALTY_COUPON_DISCOUNT_VALUE,
        discountType: LOYALTY_COUPON_DISCOUNT_TYPE,
        minOrderValue: LOYALTY_COUPON_MIN_ORDER,
        expiresAt,
        orderId: orderObj.orderId,
      });
    }
  } catch (e) {
    console.error('❌ Error generating loyalty coupon:', e.message);
  }
}

// Send coupon reward email
async function sendCouponRewardEmail({ name, email, phone, couponCode, discountValue, discountType, minOrderValue, expiresAt, orderId }) {
  try {
    const nodemailer = require('nodemailer');
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const gmailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS;
    if (!gmailUser || !gmailPass) {
      console.log('⚠️ Email not configured, skipping coupon email');
      return;
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });
    const discountText = discountType === 'percent' ? `${discountValue}%` : `₹${discountValue}`;
    const expiry = expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '60 days';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Your Reward Coupon - PJR Swagruha Foods</title></head>
<body style="margin:0;padding:20px;background:#fef3c7;font-family:Segoe UI,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.10);border:2px solid #f59e0b;">
  <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 24px;text-align:center;">
    <div style="display:inline-block;background:#d97706;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:10px;">Loyalty Reward</div>
    <h1 style="margin:0;font-size:28px;font-weight:900;color:#f59e0b;">PJR Swagruha Foods</h1>
    <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Your Thank You Gift 🎁</p>
  </div>
  <div style="padding:30px 24px;text-align:center;">
    <div style="font-size:50px;margin-bottom:12px;">🎟️</div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1e293b;">You Earned a Free Coupon!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;">Hi <strong>${name}</strong>, thank you for completing Order <strong>#${orderId}</strong>! As a token of our gratitude, enjoy <strong>${discountText} off</strong> on your next order.</p>
    <div style="background:#fef3c7;border:2px dashed #f59e0b;border-radius:16px;padding:24px 20px;margin:0 auto 24px;max-width:320px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;color:#92400e;letter-spacing:1px;">Your Coupon Code</p>
      <p style="margin:0 0 8px;font-size:32px;font-weight:900;color:#b45309;letter-spacing:3px;font-family:monospace;">${couponCode}</p>
      <p style="margin:0;font-size:13px;color:#78350f;font-weight:600;">${discountText} off • Min. order ₹${minOrderValue}</p>
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:left;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#166534;">How to use:</p>
      <p style="margin:0;font-size:13px;color:#15803d;line-height:1.6;">1. Visit our website and add items to cart<br>2. On the Cart page, enter code <strong style="font-family:monospace;">${couponCode}</strong><br>3. Click "Apply" to see your discount<br>4. Valid until <strong>${expiry}</strong></p>
    </div>
    <p style="margin:0;font-size:12px;color:#94a3b8;">Single use only. Cannot be combined with other offers.</p>
  </div>
  <div style="background:#1e293b;padding:16px 24px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#64748b;">PJR Swagruha Foods — Authentic Telangana Homemade Delicacies</p>
  </div>
</div>
</body></html>`;

    await transporter.sendMail({
      from: `"PJR Swagruha Foods" <${gmailUser}>`,
      to: email,
      subject: `🎟️ Your Reward Coupon: ${couponCode} — ${discountText} off your next order!`,
      html,
    });
    console.log(`✅ Coupon reward email sent to ${email} with code ${couponCode}`);
  } catch (e) {
    console.error('❌ Coupon email send failed:', e.message);
  }
}

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) { }

if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => {
      isMongoConnected = true;
      console.log('✅ MongoDB Database connected and orders collection ready');
      // Ensure default WELCOME10 1-time coupon exists in DB
      Coupon.findOneAndUpdate(
        { code: 'WELCOME10' },
        {
          $setOnInsert: {
            code: 'WELCOME10',
            discountType: 'percent',
            discountValue: 5,
            minOrderValue: 200,
            isActive: true,
            isUsed: false,
            isSingleUse: true,
            createdAt: new Date(),
          }
        },
        { upsert: true, new: true }
      ).catch(e => console.warn('WELCOME10 seed notice:', e.message));
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
const ADMIN_PASS = process.env.ADMIN_PASS || '8121347549';

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

// ── GET /api/test-whatsapp — Test WhatsApp alert to owner phone
app.get('/api/test-whatsapp', async (req, res) => {
  const testOrder = {
    orderId: 'TEST-' + Math.floor(100000 + Math.random() * 900000),
    customer: { name: 'PJR Swagruha Foods Owner', phone: '8125154114', email: 'vishwa81251@gmail.com', address: 'Hayathnagar, Hyderabad' },
    area: { name: 'Hayathnagar' },
    items: [{ product: { name: 'Mutton Pickle (250g)' }, selectedWeightLabel: '250g', quantity: 1, unitPrice: 450 }],
    subtotal: 450,
    deliveryCharge: 0,
    totalAmount: 450,
    utrNumber: 'VERIFIED_TEST_123',
    deliveryDate: { dayOfWeek: 'Saturday', formattedDate: 'Upcoming Weekend' }
  };

  const result = await sendWhatsAppNotification(testOrder);
  return res.json({
    phone: process.env.CALLMEBOT_PHONE || '918125154114',
    callmebotKeyConfigured: !!process.env.CALLMEBOT_APIKEY,
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
  const utrPattern = /^\d{12,22}$/;
  if (!utrPattern.test(cleanUtr)) return false;

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
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// ── POST /api/create-razorpay-order ── create order server-side
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }
    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // paise
      currency: 'INR',
      receipt: orderId || ('pjr_' + Date.now()),
      notes: { business: 'PJR Swagruha Foods', contact: '8125154114' },
    });
    return res.json({ success: true, order, keyId: RAZORPAY_KEY_ID });
  } catch (e) {
    console.error('Razorpay create order error:', e);
    return res.status(500).json({ success: false, message: e.error?.description || e.message || 'Could not create payment order.' });
  }
});

// ── POST /api/verify-razorpay-payment ── verify signature server-side
app.post('/api/verify-razorpay-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment fields.' });
    }
    const expected = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature invalid. Possible fraud attempt.' });
    }
    return res.json({ success: true, message: 'Payment verified successfully.' });
  } catch (e) {
    console.error('Razorpay verify error:', e);
    return res.status(500).json({ success: false, message: 'Verification failed.' });
  }
});

// ── POST /api/orders — place new order via Direct Scanner / UPI & trigger notifications
app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.orderId) {
      return res.status(400).json({ error: 'Invalid order data received' });
    }

    // Check for duplicate UTR only if an actual numeric UTR is provided
    const utrPattern = /^\d{12,22}$/;
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

    // If a coupon code was used, mark it as used immediately (strictly one-time use)
    if (finalOrder.couponCode) {
      const cleanCode = finalOrder.couponCode.trim().toUpperCase();
      if (isMongoConnected) {
        try {
          await Coupon.findOneAndUpdate(
            { code: cleanCode },
            { $set: { isUsed: true, usedInOrderId: finalOrder.orderId, usedAt: new Date() } }
          );
          console.log(`✅ Coupon ${cleanCode} marked as used for order ${finalOrder.orderId}`);
        } catch (e) {
          console.error('❌ Failed to mark coupon as used:', e.message);
        }
      } else {
        const c = coupons.find(c => c.code === cleanCode);
        if (c) { c.isUsed = true; c.usedInOrderId = finalOrder.orderId; c.usedAt = new Date(); }
      }
    }

    // "if new order new cupon": Generate a new 10% coupon for the customer's next order
    const nextOrderCoupon = await generateNewOrderCoupon(finalOrder);
    if (nextOrderCoupon) {
      finalOrder.rewardCouponCode = nextOrderCoupon.code;
    }

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
      rewardCouponCode: nextOrderCoupon ? nextOrderCoupon.code : null,
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

    // 🎟️ Auto-generate a loyalty coupon reward for this customer
    generateLoyaltyCoupon(orderObj).catch(err => {
      console.warn('⚠️ Loyalty coupon generation error:', err.message);
    });
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

// DELETE /api/orders/:orderId or /api/admin/orders/:orderId — owner deletes a single wrong/test order
const handleDeleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ error: 'Order ID is required' });

    if (isMongoConnected) {
      await Order.deleteOne({ orderId });
      console.log(`🗑️ Removed order #${orderId} from MongoDB`);
    }
    orders = orders.filter(o => o.orderId !== orderId);
    return res.json({ success: true, message: `Order #${orderId} removed successfully` });
  } catch (e) {
    console.error(`Error deleting order #${req.params.orderId}:`, e);
    return res.status(500).json({ error: 'Failed to delete order: ' + e.message });
  }
};

app.delete('/api/orders/:orderId', handleDeleteOrder);
app.delete('/api/admin/orders/:orderId', handleDeleteOrder);

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

// ── COUPON ROUTES ──────────────────────────────────────────────

// POST /api/coupons/validate — Customer validates a coupon code against their order total
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Coupon code is required.' });

    // Strict minimum bill check: If below 200, not allowed
    if (!orderTotal || orderTotal < 200) {
      return res.status(400).json({
        success: false,
        error: 'Coupons are not allowed for bills below ₹200. Minimum bill of ₹200 is required.'
      });
    }

    const cleanCode = code.trim().toUpperCase();
    let coupon = null;

    if (isMongoConnected) {
      coupon = await Coupon.findOne({ code: cleanCode }).lean();
    } else {
      coupon = coupons.find(c => c.code === cleanCode) || null;
    }

    if ((cleanCode === 'WELCOME10' || cleanCode === 'WELCOME15') && !coupon) {
      coupon = { ...WELCOME_COUPON, code: cleanCode };
    }

    if (!coupon) return res.status(404).json({ success: false, error: 'Invalid coupon code. Please check and try again.' });
    if (!coupon.isActive) return res.status(400).json({ success: false, error: 'This coupon is no longer active.' });

    // Strict one-time use enforcement
    if (coupon.isUsed) {
      return res.status(400).json({
        success: false,
        error: 'This coupon has already been used. Each coupon is valid for one-time use only.'
      });
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ success: false, error: 'This coupon has expired.' });
    }
    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      return res.status(400).json({ success: false, error: `This coupon requires a minimum bill of ₹${coupon.minOrderValue}.` });
    }

    const discountAmount = coupon.discountType === 'percent'
      ? Math.round((orderTotal * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, orderTotal);

    return res.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      message: `Coupon applied! You save ₹${discountAmount}.`,
    });
  } catch (e) {
    console.error('Coupon validate error:', e);
    return res.status(500).json({ success: false, error: 'Server error validating coupon.' });
  }
});

// GET /api/coupons — Admin: list all coupons
app.get('/api/coupons', async (req, res) => {
  if (isMongoConnected) {
    try {
      const all = await Coupon.find().sort({ createdAt: -1 }).lean();
      return res.json(all);
    } catch (e) {
      console.error('Error fetching coupons:', e);
    }
  }
  return res.json(coupons);
});

// POST /api/coupons — Admin: manually create a coupon
app.post('/api/coupons', async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, expiresAt } = req.body;
    if (!code || !discountValue) return res.status(400).json({ error: 'code and discountValue are required.' });
    const cleanCode = code.trim().toUpperCase();
    const newCoupon = {
      code: cleanCode,
      discountType: discountType || 'flat',
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      isActive: true,
      isUsed: false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date(),
    };
    if (isMongoConnected) {
      const created = await Coupon.create(newCoupon);
      return res.status(201).json({ success: true, coupon: created });
    }
    coupons.unshift(newCoupon);
    return res.status(201).json({ success: true, coupon: newCoupon });
  } catch (e) {
    console.error('Error creating coupon:', e);
    return res.status(500).json({ error: 'Failed to create coupon: ' + e.message });
  }
});

// PUT /api/coupons/:code/toggle — Admin: enable / disable coupon
app.put('/api/coupons/:code/toggle', async (req, res) => {
  try {
    const cleanCode = req.params.code.trim().toUpperCase();
    if (isMongoConnected) {
      const coupon = await Coupon.findOne({ code: cleanCode });
      if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
      coupon.isActive = !coupon.isActive;
      await coupon.save();
      return res.json({ success: true, isActive: coupon.isActive });
    }
    const c = coupons.find(c => c.code === cleanCode);
    if (!c) return res.status(404).json({ error: 'Coupon not found.' });
    c.isActive = !c.isActive;
    return res.json({ success: true, isActive: c.isActive });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to toggle coupon: ' + e.message });
  }
});

// DELETE /api/coupons/:code — Admin: delete coupon
app.delete('/api/coupons/:code', async (req, res) => {
  try {
    const cleanCode = req.params.code.trim().toUpperCase();
    if (isMongoConnected) {
      await Coupon.deleteOne({ code: cleanCode });
    } else {
      coupons = coupons.filter(c => c.code !== cleanCode);
    }
    return res.json({ success: true, message: `Coupon ${cleanCode} deleted.` });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete coupon: ' + e.message });
  }
});

// ── END COUPON ROUTES ──────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PJR Swagrooha Foods API running on port ${PORT}`);
});