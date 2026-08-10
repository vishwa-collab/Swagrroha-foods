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
 * Automatically emails the order receipt ONLY to the store owner's email address.
 * Customer email auto-send is disabled as requested.
 */
async function sendCustomerEmailReceipt(order) {
  const ownerEmail = (process.env.OWNER_EMAIL || process.env.GMAIL_USER || 'vishwa81251@gmail.com').trim();

  if (!ownerEmail || !ownerEmail.includes('@')) {
    console.log('ℹ️ Owner email not configured. Skipping email receipt.');
    return { success: false, message: 'No valid owner email configured' };
  }

  const recipients = [ownerEmail];
  const htmlBody = generateReceiptHtml(order);

  console.log('\n========================================');
  console.log('📧 AUTOMATIC OWNER ORDER RECEIPT DISPATCH');
  console.log('Owner Email (Recipient):', ownerEmail);
  console.log('Order ID:', order.orderId);
  console.log('========================================\n');

  try {
    const user = process.env.GMAIL_USER || process.env.SMTP_USER || ownerEmail;
    const pass = process.env.GMAIL_PASS || process.env.SMTP_PASS;

    // ── 1. Resend HTTPS API (Recommended for Render — uses port 443) ─────────
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await axios.post(
          'https://api.resend.com/emails',
          {
            from: process.env.EMAIL_FROM || 'PJR Swagrooha Foods <onboarding@resend.dev>',
            to: recipients,
            subject: `🚀 New Order Receipt #${order.orderId} - PJR Swagrooha Foods`,
            html: htmlBody,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 8000,
          }
        );
        console.log('✅ Owner Email receipt sent via Resend to:', ownerEmail, response.data);
        return { success: true, provider: 'resend', recipients, id: response.data.id };
      } catch (resendErr) {
        console.error('❌ Resend API failed:', resendErr.response ? JSON.stringify(resendErr.response.data) : resendErr.message);
      }
    }

    // ── 2. Brevo (Sendinblue) HTTPS API (Recommended for Render — uses port 443) ─
    if (process.env.BREVO_API_KEY) {
      try {
        const response = await axios.post(
          'https://api.brevo.com/v3/smtp/email',
          {
            sender: { name: process.env.EMAIL_FROM_NAME || 'PJR Swagrooha Foods', email: user || 'vishwa81251@gmail.com' },
            to: recipients.map(email => ({ email })),
            subject: `🚀 New Order Receipt #${order.orderId} - PJR Swagrooha Foods`,
            htmlContent: htmlBody,
          },
          {
            headers: {
              'api-key': process.env.BREVO_API_KEY,
              'Content-Type': 'application/json',
            },
            timeout: 8000,
          }
        );
        console.log('✅ Owner Email receipt sent via Brevo to:', ownerEmail, response.data);
        return { success: true, provider: 'brevo', recipients, messageId: response.data.messageId };
      } catch (brevoErr) {
        console.error('❌ Brevo API failed:', brevoErr.response ? JSON.stringify(brevoErr.response.data) : brevoErr.message);
      }
    }

    // ── 3. Gmail Nodemailer SMTP ──────────────────────────────────────────────
    if (user && pass) {
      const cleanPass = pass.replace(/\s+/g, '');
      
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: user.trim(),
            pass: cleanPass,
          },
          connectionTimeout: 3000,
          socketTimeout: 3000,
          tls: {
            rejectUnauthorized: false
          }
        });

        const info = await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'PJR Swagrooha Foods'}" <${user.trim()}>`,
          to: recipients.join(', '),
          subject: `🚀 New Order Receipt #${order.orderId} - PJR Swagrooha Foods`,
          html: htmlBody,
        });

        console.log('✅ Owner Email receipt automatically sent via Gmail SMTP to:', ownerEmail, info.messageId);
        return { success: true, provider: 'gmail_smtp', recipients, messageId: info.messageId };
      } catch (gmailErr) {
        console.warn('⚠️ Gmail SMTP failed. Error:', gmailErr.message);
        return { 
          success: false, 
          provider: 'gmail_smtp_blocked', 
          error: 'Gmail SMTP failed. Please add RESEND_API_KEY or BREVO_API_KEY on Render for instant HTTPS email delivery.',
          message: gmailErr.message
        };
      }
    }

    console.log('ℹ️ No email provider credentials configured in environment variables.');
    return { success: false, message: 'No email provider credentials configured in environment variables' };
  } catch (err) {
    console.error('❌ Error sending owner email receipt:', err.response ? JSON.stringify(err.response.data) : err.message);
    return { success: false, error: err.response ? err.response.data : err.message };
  }
}

module.exports = {
  sendCustomerEmailReceipt,
  generateReceiptHtml
};
