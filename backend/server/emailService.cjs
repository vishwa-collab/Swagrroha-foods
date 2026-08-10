const nodemailer = require('nodemailer');
const axios = require('axios');
const dns = require('dns');

// Force IPv4 DNS resolution first (fixes ENETUNREACH errors on cloud hosts like Render)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Generates clean HTML email receipt content for customer
 */
function generateReceiptHtml(order) {
  const customer = order.customer || {};
  const area = order.area || {};
  const items = order.items || [];
  const deliveryDate = order.deliveryDate ? `${order.deliveryDate.dayOfWeekName || order.deliveryDate.dayOfWeek || 'Saturday'} (${order.deliveryDate.formattedDate || ''})` : 'Upcoming Saturday';

  let itemsTableRows = items.map(item => {
    const pName = item.product ? item.product.name : (item.name || 'Item');
    const weight = item.selectedWeightLabel ? ` (${item.selectedWeightLabel})` : '';
    const qty = item.quantity || 1;
    const price = item.unitPrice ? item.unitPrice * qty : 0;
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${pName}${weight}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">x${qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: bold;">₹${price}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #059669; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px;">PJR Swagrooha Foods</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Official Homemade Order Receipt</p>
      </div>
      
      <div style="padding: 24px;">
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a;">Order #${order.orderId}</h2>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Customer Name:</strong> ${customer.name || 'Customer'}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Phone Number:</strong> ${customer.phone || 'N/A'}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Delivery Zone:</strong> ${area.name || 'Hyderabad'}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Delivery Address:</strong> ${customer.address || 'N/A'}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #059669; font-weight: bold;"><strong>Scheduled Delivery:</strong> ${deliveryDate}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Transaction ID (UTR):</strong> ${order.utrNumber || 'N/A'}</p>
        </div>

        <h3 style="font-size: 15px; color: #0f172a; border-bottom: 2px solid #059669; padding-bottom: 6px; margin-bottom: 12px;">Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left;">
              <th style="padding: 10px;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
          </tbody>
        </table>

        <div style="border-top: 2px dashed #cbd5e1; padding-top: 12px; font-size: 14px; color: #0f172a;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Subtotal:</span>
            <span>₹${order.subtotal || 0}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Delivery Charge:</span>
            <span>₹${order.deliveryCharge || 0}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #059669; border-top: 1px solid #e2e8f0; padding-top: 8px;">
            <span>Total Amount Paid:</span>
            <span>₹${order.totalAmount || 0}</span>
          </div>
        </div>

        <div style="margin-top: 24px; padding: 12px; background-color: #f0fdf4; border-radius: 8px; text-align: center; color: #166534; font-size: 12px; font-weight: bold;">
          ✅ Payment Status: PAID & VERIFIED VIA UPI
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">Thank you for ordering with PJR Swagrooha Foods!</p>
        <p style="margin: 4px 0 0 0;">For support / queries, contact owner at +91 8125154114</p>
      </div>
    </div>
  `;
}

/**
 * Automatically emails the customer order receipt to their Gmail.
 * The receipt is always sent to the CUSTOMER's email — never to the owner's email.
 */
async function sendCustomerEmailReceipt(order) {
  const customerEmail = order.customer && order.customer.email ? order.customer.email.trim() : null;
  const ownerEmail = (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim().toLowerCase();

  if (!customerEmail || !customerEmail.includes('@')) {
    console.log('ℹ️ Customer email not provided or invalid. Skipping email receipt.');
    return { success: false, message: 'No valid customer email provided by customer' };
  }

  // Safety guard: never send receipt to owner's email — only to the customer
  if (ownerEmail && customerEmail.toLowerCase() === ownerEmail) {
    console.warn('⚠️ Receipt blocked: customer email matches owner email. Please ensure customer enters their own email.');
    return { success: false, message: 'Customer email must not be the same as owner/sender email' };
  }

  const htmlBody = generateReceiptHtml(order);

  console.log('\n========================================');
  console.log('📧 SENDING ORDER RECEIPT TO CUSTOMER EMAIL');
  console.log('Customer Email (Recipient):', customerEmail);
  console.log('Sender (Owner Gmail):', ownerEmail || 'Not configured');
  console.log('Order ID:', order.orderId);
  console.log('========================================\n');

  try {
    const user = process.env.GMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.GMAIL_PASS || process.env.SMTP_PASS;

    // ── 1. Gmail Nodemailer SMTP (Direct delivery to customer email) ──────────
    if (user && pass) {
      const cleanPass = pass.replace(/\s+/g, '');
      
      // Try service: 'gmail' first (most reliable in Node.js)
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: user.trim(),
            pass: cleanPass,
          },
          connectionTimeout: 10000,
          socketTimeout: 10000,
          tls: {
            rejectUnauthorized: false
          }
        });

        const info = await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'PJR Swagrooha Foods'}" <${user.trim()}>`,
          to: customerEmail,
          subject: `Order Receipt #${order.orderId} - PJR Swagrooha Foods`,
          html: htmlBody,
        });

        console.log('✅ Email receipt automatically sent via Gmail to customer:', customerEmail, info.messageId);
        return { success: true, provider: 'gmail_smtp', recipient: customerEmail, messageId: info.messageId };
      } catch (gmailErr) {
        console.warn('⚠️ Gmail service transport failed, trying direct SMTP port 587 fallback:', gmailErr.message);
        
        // Fallback: SMTP port 587 with STARTTLS
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // TLS via STARTTLS
          auth: {
            user: user.trim(),
            pass: cleanPass,
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const info = await fallbackTransporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'PJR Swagrooha Foods'}" <${user.trim()}>`,
          to: customerEmail,
          subject: `Order Receipt #${order.orderId} - PJR Swagrooha Foods`,
          html: htmlBody,
        });

        console.log('✅ Email receipt sent via Gmail SMTP 587 fallback to customer:', customerEmail, info.messageId);
        return { success: true, provider: 'gmail_smtp_587', recipient: customerEmail, messageId: info.messageId };
      }
    }

    // ── 2. Resend HTTPS API Fallback ──────────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: process.env.EMAIL_FROM || 'PJR Swagrooha Foods <onboarding@resend.dev>',
          to: [customerEmail],
          subject: `Order Receipt #${order.orderId} - PJR Swagrooha Foods`,
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
      console.log('✅ Email receipt sent via Resend API to customer:', customerEmail, response.data);
      return { success: true, provider: 'resend', recipient: customerEmail, id: response.data.id };
    }

    // ── 3. Brevo (Sendinblue) HTTPS API Fallback ─────────────────────────────
    if (process.env.BREVO_API_KEY) {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: process.env.EMAIL_FROM_NAME || 'PJR Swagrooha Foods', email: user || 'vishwa81251@gmail.com' },
          to: [{ email: customerEmail }],
          subject: `Order Receipt #${order.orderId} - PJR Swagrooha Foods`,
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
      console.log('✅ Email receipt sent via Brevo API to customer:', customerEmail, response.data);
      return { success: true, provider: 'brevo', recipient: customerEmail, messageId: response.data.messageId };
    }

    console.log('ℹ️ Email credentials missing in environment variables.');
    return { success: false, message: 'No email provider credentials configured in environment variables' };
  } catch (err) {
    console.error('❌ Error sending customer email receipt:', err.response ? JSON.stringify(err.response.data) : err.message);
    return { success: false, error: err.response ? err.response.data : err.message };
  }
}

module.exports = {
  sendCustomerEmailReceipt,
  generateReceiptHtml
};
