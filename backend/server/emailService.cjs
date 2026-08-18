const nodemailer = require('nodemailer');
const axios = require('axios');
const dns = require('dns');

// Force IPv4 DNS resolution first (fixes ENETUNREACH errors on cloud hosts like Render)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Generates a professional HTML email receipt for the customer.
 * Includes all order details: ID, customer info, items, totals, payment info, status, and delivery date.
 */
function generateReceiptHtml(order, isDelivered) {
  const customer = order.customer || {};
  const area = order.area || {};
  const items = order.items || [];

  // Delivery date display
  let deliveryDateStr = 'Upcoming Saturday';
  if (order.deliveryDate) {
    if (typeof order.deliveryDate === 'object' && order.deliveryDate.formattedDate) {
      deliveryDateStr = `${order.deliveryDate.dayOfWeekName || ''} (${order.deliveryDate.formattedDate})`;
    } else if (typeof order.deliveryDate === 'string') {
      deliveryDateStr = order.deliveryDate;
    }
  }

  const deliveredAt = isDelivered ? new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null;
  const orderedAt = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const paymentMethod = order.paymentMethod || (order.utrNumber ? 'UPI Scanner / PhonePe / GPay' : 'Online');
  const paymentStatus = order.paymentStatus || 'PAID';
  const orderStatus   = order.status || (isDelivered ? 'DELIVERED' : 'PLACED');
  const utrDisplay    = order.utrNumber && !['SCREENSHOT_PROVED', 'DIRECT_UPI_PAYMENT'].includes((order.utrNumber||'').toUpperCase())
                        ? order.utrNumber : 'Screenshot / Online Verified';

  const itemsTableRows = items.map(item => {
    const pName  = item.product ? item.product.name : (item.productName || item.name || 'Item');
    const weight = (item.selectedWeightLabel || item.weightLabel) ? ` (${item.selectedWeightLabel || item.weightLabel})` : '';
    const qty    = item.quantity || 1;
    const price  = (item.unitPrice || 0) * qty;
    return `
      <tr>
        <td style="padding:11px 10px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;font-weight:600;">${pName}<span style="color:#64748b;font-weight:normal;font-size:12px;">${weight}</span></td>
        <td style="padding:11px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:14px;color:#475569;">${qty}</td>
        <td style="padding:11px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:14px;color:#334155;">&#8377;${(item.unitPrice||0).toFixed(2)}</td>
        <td style="padding:11px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:14px;color:#059669;font-weight:700;">&#8377;${price.toFixed(2)}</td>
      </tr>`;
  }).join('');

  const statusBannerBg   = isDelivered ? '#ecfdf5' : '#eff6ff';
  const statusBannerBdr  = isDelivered ? '#a7f3d0' : '#bfdbfe';
  const statusBannerTxt  = isDelivered ? '#065f46' : '#1d4ed8';
  const statusBannerSub  = isDelivered ? '#047857' : '#1e40af';
  const statusIcon       = isDelivered ? '&#10003;' : '&#128222;';
  const statusTitle      = isDelivered ? 'Your Order Has Been Delivered!' : 'Order Received & Confirmed!';
  const statusSubtitle   = isDelivered
    ? 'Thank you for choosing PJR Swagrooha Foods! We hope you enjoy your authentic homemade food.'
    : 'We have received your order. Our team will verify your payment and begin preparing your order shortly.';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PJR Swagrooha Foods - Order Receipt</title></head>
<body style="margin:0;padding:20px;background-color:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
<div style="max-width:650px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.10);border:1px solid #e2e8f0;">

  <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 24px;text-align:center;">
    <div style="display:inline-block;background:#d97706;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:10px;">Authentic Homemade Delicacies</div>
    <h1 style="margin:0;font-size:28px;font-weight:900;color:#f59e0b;">PJR Swagrooha Foods</h1>
    <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Official Order Receipt</p>
  </div>

  <div style="padding:24px;">
    <div style="background:${statusBannerBg};border:1px solid ${statusBannerBdr};border-radius:12px;padding:16px;text-align:center;margin-bottom:22px;">
      <span style="font-size:22px;">${statusIcon}</span>
      <span style="font-size:16px;font-weight:800;color:${statusBannerTxt};margin-left:8px;">${statusTitle}</span>
      <p style="margin:4px 0 0;font-size:13px;color:${statusBannerSub};">${statusSubtitle}</p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:22px;">
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #cbd5e1;padding-bottom:10px;margin-bottom:12px;">
        <span style="font-size:15px;font-weight:900;color:#0f172a;">Order ID: #${order.orderId}</span>
        <span style="font-size:12px;color:#64748b;">Placed: ${orderedAt}</span>
      </div>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#475569;font-weight:700;width:150px;">Customer Name:</td><td style="padding:4px 0;color:#0f172a;font-weight:600;">${customer.name || 'Valued Customer'}</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-weight:700;">Phone Number:</td><td style="padding:4px 0;color:#0f172a;">${customer.phone || 'N/A'}</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-weight:700;">Email Address:</td><td style="padding:4px 0;color:#0f172a;">${customer.email || 'N/A'}</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-weight:700;">Delivery Zone:</td><td style="padding:4px 0;color:#0f172a;font-weight:600;">${area.name || customer.areaId || 'Hyderabad Area'}</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-weight:700;">Delivery Address:</td><td style="padding:4px 0;color:#0f172a;">${customer.address || 'N/A'}</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-weight:700;">Scheduled Delivery:</td><td style="padding:4px 0;color:#059669;font-weight:700;">${deliveryDateStr}</td></tr>
        ${isDelivered ? `<tr><td style="padding:4px 0;color:#475569;font-weight:700;">Delivered On:</td><td style="padding:4px 0;color:#0f172a;">${deliveredAt}</td></tr>` : ''}
        <tr><td style="padding:4px 0;color:#475569;font-weight:700;">Payment Method:</td><td style="padding:4px 0;color:#0f172a;">${paymentMethod}</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-weight:700;">UTR / Txn ID:</td><td style="padding:4px 0;color:#0f172a;font-family:monospace;">${utrDisplay}</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-weight:700;">Order Status:</td><td style="padding:4px 0;"><span style="background:${isDelivered?'#ecfdf5':'#eff6ff'};color:${isDelivered?'#065f46':'#1d4ed8'};font-size:12px;font-weight:800;padding:3px 10px;border-radius:10px;">${orderStatus}</span></td></tr>
      </table>
    </div>

    <h3 style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 12px;padding-bottom:6px;border-bottom:2px solid #d97706;">Ordered Items</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
      <thead><tr style="background:#f1f5f9;text-align:left;font-size:12px;color:#475569;font-weight:700;text-transform:uppercase;">
        <th style="padding:10px;">Item</th>
        <th style="padding:10px;text-align:center;">Qty</th>
        <th style="padding:10px;text-align:right;">Unit Price</th>
        <th style="padding:10px;text-align:right;">Total</th>
      </tr></thead>
      <tbody>${itemsTableRows}</tbody>
    </table>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:22px;font-size:14px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#64748b;">Item Subtotal:</span><span style="font-weight:600;">&#8377;${(order.subtotal||0).toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;padding-bottom:10px;border-bottom:1px dashed #cbd5e1;margin-bottom:10px;"><span style="color:#64748b;">Delivery Charge:</span><span style="font-weight:600;">&#8377;${(order.deliveryCharge||0).toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:900;color:#059669;"><span>Grand Total Paid:</span><span>&#8377;${(order.totalAmount||0).toFixed(2)}</span></div>
    </div>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;text-align:center;color:#166534;font-size:13px;font-weight:800;">
      &#128274; Payment Status: ${paymentStatus} (VERIFIED &amp; CONFIRMED)
    </div>
  </div>

  <div style="background:#f8fafc;padding:20px 24px;text-align:center;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-weight:700;color:#334155;">PJR Swagrooha Foods &#8212; Pure Homemade Goodness</p>
    <p style="margin:4px 0 0;">Questions? Call / WhatsApp: <strong>+91 8125154114</strong></p>
    <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">This is an automated system-generated receipt. Please do not reply to this email.</p>
  </div>
</div>
</body></html>`;
}

/**
 * Sends an automatic order confirmation/placement receipt email to the customer.
 * Called when a new order is placed (POST /api/orders).
 */
async function sendCustomerEmailReceipt(order) {
  const customerEmail = order.customer && order.customer.email ? order.customer.email.trim() : null;
  const ownerEmail = (process.env.OWNER_EMAIL || process.env.GMAIL_USER || '').trim();

  // Always send to owner as CC/BCC for record
  const recipients = [];
  if (customerEmail && customerEmail.includes('@')) {
    recipients.push(customerEmail);
  }
  if (ownerEmail && ownerEmail.includes('@') && ownerEmail !== customerEmail) {
    recipients.push(ownerEmail);
  }

  if (recipients.length === 0) {
    console.log('ℹ️ No valid recipients found. Skipping email receipt.');
    return { success: false, message: 'No valid recipient email configured' };
  }

  const htmlBody = generateReceiptHtml(order, false);
  const subject = `Order Received #${order.orderId} - PJR Swagrooha Foods`;

  console.log('\n========================================');
  console.log('📧 ORDER CONFIRMATION EMAIL DISPATCH');
  console.log('Recipients:', recipients.join(', '));
  console.log('Order ID:', order.orderId);
  console.log('========================================\n');

  return _dispatchEmail(recipients, subject, htmlBody);
}

/**
 * Sends a delivery confirmation receipt email to the customer.
 * Called when the admin marks an order as DELIVERED.
 */
async function sendDeliveredReceiptEmail(order) {
  const customerEmail = (
    (order.customer && order.customer.email) ||
    order.email ||
    order.customerEmail ||
    ''
  ).trim();

  if (!customerEmail || !customerEmail.includes('@')) {
    console.log('ℹ️ Customer email not available for delivered receipt. Order ID:', order.orderId);
    return { success: false, message: 'Customer email not available or invalid', receiptEmailStatus: 'FAILED' };
  }

  const ownerEmail = (process.env.OWNER_EMAIL || process.env.GMAIL_USER || '').trim();
  const recipients = [customerEmail];
  if (ownerEmail && ownerEmail.includes('@') && ownerEmail.toLowerCase() !== customerEmail.toLowerCase()) {
    recipients.push(ownerEmail);
  }

  const htmlBody = generateReceiptHtml(order, true);
  const subject = `Your Order #${order.orderId} Has Been Delivered! - PJR Swagrooha Foods`;

  console.log('\n========================================');
  console.log('📧 DELIVERY RECEIPT EMAIL DISPATCH');
  console.log('Customer Email:', customerEmail);
  console.log('Recipients:', recipients.join(', '));
  console.log('Order ID:', order.orderId);
  console.log('========================================\n');

  const result = await _dispatchEmail(recipients, subject, htmlBody);
  result.receiptEmailStatus = result.success ? 'SENT' : 'FAILED';
  return result;
}

/**
 * Internal dispatcher — tries Resend → Brevo → Gmail SMTP in order.
 * Never exposes credentials in response.
 */
async function _dispatchEmail(recipients, subject, htmlBody) {
  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
  const pass = (process.env.GMAIL_PASS || process.env.SMTP_PASS || '').trim();

  // ── 1. Resend HTTPS API ──────────────────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: process.env.EMAIL_FROM || 'PJR Swagrooha Foods <onboarding@resend.dev>',
          to: recipients,
          subject,
          html: htmlBody,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log('✅ Email sent via Resend to:', recipients.join(', '), response.data);
      return { success: true, provider: 'resend', recipients, id: response.data.id };
    } catch (resendErr) {
      console.error('❌ Resend API failed:', resendErr.response ? JSON.stringify(resendErr.response.data) : resendErr.message);
    }
  }

  // ── 2. Brevo (Sendinblue) HTTPS API ─────────────────────────────────────────
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = user || 'vishwa81251@gmail.com';
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: process.env.EMAIL_FROM_NAME || 'PJR Swagrooha Foods', email: senderEmail },
          to: recipients.map(email => ({ email })),
          subject,
          htmlContent: htmlBody,
        },
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log('✅ Email sent via Brevo to:', recipients.join(', '), response.data);
      return { success: true, provider: 'brevo', recipients, messageId: response.data.messageId };
    } catch (brevoErr) {
      console.error('❌ Brevo API failed:', brevoErr.response ? JSON.stringify(brevoErr.response.data) : brevoErr.message);
    }
  }

  // ── 3. Gmail SMTP (Nodemailer) ───────────────────────────────────────────────
  if (user && pass) {
    const cleanPass = pass.replace(/\s+/g, '');
    // Try Port 465 (SSL) first, then fallback to Port 587 (TLS) if blocked
    const configs = [
      { port: 465, secure: true, label: 'Port 465 (SSL)' },
      { port: 587, secure: false, label: 'Port 587 (TLS)' }
    ];

    let lastError = null;
    for (const cfg of configs) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: cfg.port,
          secure: cfg.secure,
          auth: { user: user.trim(), pass: cleanPass },
          connectionTimeout: 10000,
          socketTimeout: 10000,
          family: 4,
          tls: { rejectUnauthorized: false },
        });

        const info = await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'PJR Swagrooha Foods'}" <${user.trim()}>`,
          to: recipients.join(', '),
          subject,
          html: htmlBody,
        });

        console.log(`✅ Email sent via Gmail SMTP [${cfg.label}] to:`, recipients.join(', '), info.messageId);
        return { success: true, provider: 'gmail_smtp', recipients, messageId: info.messageId };
      } catch (gmailErr) {
        lastError = gmailErr;
        console.warn(`⚠️ Gmail SMTP [${cfg.label}] attempt failed:`, gmailErr.message);
      }
    }

    return {
      success: false,
      provider: 'gmail_smtp_failed',
      error: lastError?.message || 'SMTP connection failed',
      message: 'Gmail SMTP authentication/connection failed. Please ensure a 16-character Google App Password is used for GMAIL_PASS (not standard account password), or configure RESEND_API_KEY for HTTPS delivery.',
    };
  }

  console.log('ℹ️ No email provider credentials configured. Please set GMAIL_USER + GMAIL_PASS or RESEND_API_KEY.');
  return { 
    success: false, 
    message: 'Email credentials not configured. Please set GMAIL_PASS (Google App Password) in your .env or Render environment variables.' 
  };
}

module.exports = {
  sendCustomerEmailReceipt,
  sendDeliveredReceiptEmail,
  generateReceiptHtml
};
