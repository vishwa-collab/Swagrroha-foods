const axios = require('axios');

/**
 * Formats a clean, professional WhatsApp order notification message for the OWNER.
 * @param {Object} order - Placed order object
 * @returns {string} Formatted text message
 */
function formatOrderMessage(order) {
  const customer = order.customer || {};
  const area = order.area || {};
  const items = order.items || [];
  const deliveryDate = order.deliveryDate ? `${order.deliveryDate.dayOfWeek}, ${order.deliveryDate.formattedDate}` : 'Upcoming Saturday';

  let itemsListStr = items.map(item => {
    const pName = item.product ? item.product.name : (item.name || 'Item');
    const weight = item.selectedWeightLabel ? ` (${item.selectedWeightLabel})` : '';
    const qty = item.quantity || 1;
    const price = item.unitPrice ? item.unitPrice * qty : 0;
    return `  • ${pName}${weight} x${qty} (₹${price})`;
  }).join('\n');

  if (!itemsListStr) {
    itemsListStr = '  • Order Items';
  }

  const paymentRef = order.razorpayPaymentId || order.utrNumber || 'Online Payment';

  return `🚀 *New Order Received — PJR Swagrooha Foods*

*Order ID:* ${order.orderId}
*Customer Name:* ${customer.name || 'Valued Customer'}
*Phone Number:* ${customer.phone || 'N/A'}
*Email:* ${customer.email || 'N/A'}
*Delivery Area:* ${area.name || customer.areaId || 'Hyderabad'}
*Delivery Date:* ${deliveryDate}
*Delivery Address:* ${customer.address || 'N/A'}

📦 *Order Items:*
${itemsListStr}

💵 *Subtotal:* ₹${order.subtotal || 0}
🚚 *Delivery Charge:* ₹${order.deliveryCharge || 0}
💰 *Total Amount:* ₹${order.totalAmount || order.grandTotal || 0}
💳 *Payment Status:* Paid ✅ (${paymentRef})
📦 *Order Status:* PLACED

_Thank you for ordering with PJR Swagrooha Foods!_`;
}

/**
 * Formats a WhatsApp receipt message for the CUSTOMER.
 * @param {Object} order - Placed order object
 * @returns {string} Formatted receipt text
 */
function formatCustomerReceiptMessage(order) {
  const customer = order.customer || {};
  const area = order.area || {};
  const items = order.items || [];
  const deliveryDate = order.deliveryDate
    ? `${order.deliveryDate.dayOfWeekName || order.deliveryDate.dayOfWeek || 'Saturday'} (${order.deliveryDate.formattedDate || ''})`
    : 'Upcoming Saturday';

  let itemsListStr = items.map(item => {
    const pName = item.product ? item.product.name : (item.name || 'Item');
    const weight = item.selectedWeightLabel ? ` (${item.selectedWeightLabel})` : '';
    const qty = item.quantity || 1;
    const price = item.unitPrice ? item.unitPrice * qty : 0;
    return `  • ${pName}${weight} x${qty} — ₹${price}`;
  }).join('\n');

  if (!itemsListStr) itemsListStr = '  • Order Items';

  const paymentRef = order.utrNumber || order.razorpayPaymentId || 'UPI Payment';

  return `✅ *Order Confirmed — PJR Swagrooha Foods*

Hi ${customer.name || 'Valued Customer'}! Your order has been received and confirmed. 🎉

🧾 *Order Receipt #${order.orderId}*
━━━━━━━━━━━━━━━━━━━━━━━

📦 *Items Ordered:*
${itemsListStr}

━━━━━━━━━━━━━━━━━━━━━━━
💵 Subtotal: ₹${order.subtotal || 0}
🚚 Delivery Charge: ₹${order.deliveryCharge || 0}
💰 *Total Paid: ₹${order.totalAmount || 0}*
💳 Payment Ref (UTR): ${paymentRef}

📍 Delivery To: ${customer.address || 'N/A'}, ${area.name || 'Hyderabad'}
📅 Scheduled Delivery: ${deliveryDate}

For queries, call/WhatsApp owner: +91 8125154114

_Thank you for ordering with PJR Swagrooha Foods! 🙏_`;
}

/**
 * Sends WhatsApp notification to admin via CallMeBot (free).
 *
 * HOW TO SET UP CallMeBot (one-time, free):
 * 1. Save +34 644 59 77 16 in your phone contacts as "CallMeBot"
 * 2. Send this WhatsApp message to that number:
 *    I allow callmebot to send me messages
 * 3. You'll receive an API key (e.g. 123456)
 * 4. Set env vars on Render:
 *    CALLMEBOT_PHONE  = 918125154114   (admin phone with country code, no +)
 *    CALLMEBOT_APIKEY = <your api key>
 *
 * Alternatively, you can still use Meta/Twilio/UltraMsg by setting their env vars.
 */
async function sendWhatsAppNotification(order) {
  const message = formatOrderMessage(order);

  // ── Resolve admin phone & provider ──────────────────────────────────────
  const targetPhone = (
    process.env.OWNER_WHATSAPP_NUMBER ||
    process.env.WHATSAPP_RECIPIENT ||
    process.env.CALLMEBOT_PHONE ||
    '918125154114'
  ).replace(/\D/g, '');

  const provider = (process.env.WHATSAPP_PROVIDER || 'auto').toLowerCase();

  console.log('\n========================================');
  console.log('📲 TRIGGERING WHATSAPP ORDER NOTIFICATION');
  console.log('Recipient (Admin):', targetPhone);
  console.log('----------------------------------------');
  console.log(message);
  console.log('========================================\n');

  try {
    // ── 1. CallMeBot (Free — recommended) ───────────────────────────────
    if (
      provider === 'callmebot' ||
      (provider === 'auto' && process.env.CALLMEBOT_APIKEY)
    ) {
      const apiKey = process.env.CALLMEBOT_APIKEY;
      const phone  = targetPhone.startsWith('91') ? targetPhone : `91${targetPhone}`;
      const encodedMsg = encodeURIComponent(message);

      const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMsg}&apikey=${apiKey}`;

      const response = await axios.get(url, { timeout: 10000 });
      console.log('✅ WhatsApp sent via CallMeBot to admin:', phone, response.data);
      return { success: true, provider: 'callmebot', data: response.data };
    }

    // ── 2. Meta WhatsApp Cloud API ───────────────────────────────────────
    if (provider === 'meta' || (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)) {
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const token   = process.env.WHATSAPP_ACCESS_TOKEN;
      const cleanPhone = targetPhone.startsWith('91') ? targetPhone : `91${targetPhone}`;

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ WhatsApp sent via Meta Cloud API:', response.data);
      return { success: true, provider: 'meta', data: response.data };
    }

    // ── 3. Twilio WhatsApp API ───────────────────────────────────────────
    if (provider === 'twilio' || (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)) {
      const sid        = process.env.TWILIO_ACCOUNT_SID;
      const authToken  = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const cleanPhone = targetPhone.startsWith('91') ? targetPhone : '91' + targetPhone;
      const toNumber   = `whatsapp:+${cleanPhone}`;

      const authHeader = Buffer.from(`${sid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('From', fromNumber);
      params.append('To', toNumber);
      params.append('Body', message);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        params.toString(),
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      console.log('✅ WhatsApp sent via Twilio:', response.data.sid);
      return { success: true, provider: 'twilio', data: response.data };
    }

    // ── 4. UltraMsg API ─────────────────────────────────────────────────
    if (provider === 'ultramsg' || (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN)) {
      const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
      const token      = process.env.ULTRAMSG_TOKEN;
      const cleanPhone = targetPhone.startsWith('91') ? targetPhone : `91${targetPhone}`;

      const response = await axios.post(
        `https://api.ultramsg.com/${instanceId}/messages/chat`,
        { token, to: cleanPhone, body: message }
      );
      console.log('✅ WhatsApp sent via UltraMsg:', response.data);
      return { success: true, provider: 'ultramsg', data: response.data };
    }

    // ── 5. Custom Webhook Endpoint ───────────────────────────────────────
    if (process.env.WHATSAPP_WEBHOOK_URL) {
      const response = await axios.post(process.env.WHATSAPP_WEBHOOK_URL, {
        event: 'order_paid',
        recipient: targetPhone,
        message,
        order
      });
      console.log('✅ WhatsApp notification posted to Webhook:', response.data);
      return { success: true, provider: 'webhook', data: response.data };
    }

    // ── No provider configured ───────────────────────────────────────────
    console.log('⚠️  No WhatsApp API credentials detected.');
    console.log('   To enable automatic admin WhatsApp alerts, set env vars on Render:');
    console.log('   CALLMEBOT_PHONE  = 918125154114');
    console.log('   CALLMEBOT_APIKEY = <your CallMeBot API key>');
    console.log('   (Get your free API key at https://www.callmebot.com/blog/free-api-whatsapp-messages/)');
    return { success: false, provider: 'none', message: 'No WhatsApp provider configured. Set CALLMEBOT_APIKEY on Render.' };

  } catch (err) {
    console.error('❌ Error sending WhatsApp notification:', err.response ? JSON.stringify(err.response.data) : err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a WhatsApp order receipt to the CUSTOMER automatically.
 * Uses the same provider cascade as the owner notification.
 * For CallMeBot: the customer must have previously sent "I allow callmebot to send me messages"
 * to +34 644 59 77 16 on WhatsApp (one-time activation).
 * For UltraMsg/Twilio/Meta: works without any prior activation.
 */
async function sendCustomerWhatsAppReceipt(order) {
  const customer = order.customer || {};
  const rawPhone = (customer.phone || '').replace(/\D/g, '');

  if (!rawPhone || rawPhone.length < 10) {
    console.log('ℹ️ Customer phone not provided or invalid. Skipping customer WhatsApp receipt.');
    return { success: false, message: 'No valid customer phone number' };
  }

  // Normalise: add India country code if missing
  const customerPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

  const message = formatCustomerReceiptMessage(order);

  console.log('\n========================================');
  console.log('📲 SENDING WHATSAPP RECEIPT TO CUSTOMER');
  console.log('Customer Phone:', customerPhone);
  console.log('Order ID:', order.orderId);
  console.log('========================================\n');

  try {
    // ── 1. CallMeBot — customer must have activated CallMeBot first ──────
    if (process.env.CALLMEBOT_APIKEY && process.env.CALLMEBOT_CUSTOMER_APIKEY) {
      // Use a separate customer API key if set
      const apiKey = process.env.CALLMEBOT_CUSTOMER_APIKEY;
      const encodedMsg = encodeURIComponent(message);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${customerPhone}&text=${encodedMsg}&apikey=${apiKey}`;
      const response = await axios.get(url, { timeout: 10000 });
      console.log('✅ Customer WhatsApp receipt sent via CallMeBot:', customerPhone, response.data);
      return { success: true, provider: 'callmebot_customer', data: response.data };
    }

    // ── 2. UltraMsg — works for any WhatsApp number, no opt-in needed ───
    if (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN) {
      const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
      const token      = process.env.ULTRAMSG_TOKEN;

      const response = await axios.post(
        `https://api.ultramsg.com/${instanceId}/messages/chat`,
        { token, to: customerPhone, body: message }
      );
      console.log('✅ Customer WhatsApp receipt sent via UltraMsg:', customerPhone, response.data);
      return { success: true, provider: 'ultramsg', data: response.data };
    }

    // ── 3. Meta WhatsApp Cloud API ───────────────────────────────────────
    if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const token   = process.env.WHATSAPP_ACCESS_TOKEN;

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: customerPhone,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Customer WhatsApp receipt sent via Meta Cloud API:', response.data);
      return { success: true, provider: 'meta', data: response.data };
    }

    // ── 4. Twilio WhatsApp API ───────────────────────────────────────────
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const sid        = process.env.TWILIO_ACCOUNT_SID;
      const authToken  = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const toNumber   = `whatsapp:+${customerPhone}`;

      const authHeader = Buffer.from(`${sid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('From', fromNumber);
      params.append('To', toNumber);
      params.append('Body', message);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        params.toString(),
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      console.log('✅ Customer WhatsApp receipt sent via Twilio:', response.data.sid);
      return { success: true, provider: 'twilio', data: response.data };
    }

    // ── No API configured — log wa.me link as fallback info ─────────────
    const waLink = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
    console.log('ℹ️ No WhatsApp API configured for customer receipt.');
    console.log('   Fallback wa.me link (open manually):', waLink);
    console.log('   To enable automatic customer WhatsApp receipts, set one of:');
    console.log('   - ULTRAMSG_INSTANCE_ID + ULTRAMSG_TOKEN (recommended, no opt-in)');
    console.log('   - WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID (Meta Cloud API)');
    console.log('   - TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN');
    return {
      success: false,
      provider: 'none',
      message: 'No WhatsApp API configured for customer receipt. Set ULTRAMSG_INSTANCE_ID + ULTRAMSG_TOKEN on Render.',
      waLink,
    };

  } catch (err) {
    console.error('❌ Error sending customer WhatsApp receipt:', err.response ? JSON.stringify(err.response.data) : err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Formats a delivery receipt message for the CUSTOMER.
 * @param {Object} order - Placed order object
 * @returns {string} Formatted delivered receipt text
 */
function formatDeliveredReceiptMessage(order) {
  const customer = order.customer || {};
  const area = order.area || {};
  const items = order.items || [];

  let itemsListStr = items.map(item => {
    const pName = item.product ? item.product.name : (item.name || 'Item');
    const weight = item.selectedWeightLabel ? ` (${item.selectedWeightLabel})` : '';
    const qty = item.quantity || 1;
    const price = item.unitPrice ? item.unitPrice * qty : 0;
    return `  • ${pName}${weight} x${qty} — ₹${price}`;
  }).join('\n');

  if (!itemsListStr) itemsListStr = '  • Order Items';

  const paymentRef = order.utrNumber || order.razorpayPaymentId || 'UPI Payment';

  return `🎉 *Order Delivered — PJR Swagrooha Foods*

Hi ${customer.name || 'Valued Customer'}! Your homemade food order has been successfully DELIVERED! 🚚✅

🧾 *Delivery Receipt #${order.orderId}*
━━━━━━━━━━━━━━━━━━━━━━━
📦 *Items Delivered:*
${itemsListStr}
━━━━━━━━━━━━━━━━━━━━━━━
💵 Subtotal: ₹${order.subtotal || 0}
🚚 Delivery Charge: ₹${order.deliveryCharge || 0}
💰 *Total Paid: ₹${order.totalAmount || 0} (PAID ✅)*
💳 Payment Ref (UTR): ${paymentRef}

📍 Delivered To: ${customer.address || 'N/A'}, ${area.name || 'Hyderabad'}

⭐ *How was your experience?*
Please rate your food and share your feedback with us:
https://swagrroha-foods.onrender.com/track?orderId=${order.orderId}

For queries, call/WhatsApp us: +91 8125154114

_Thank you for choosing PJR Swagrooha Foods! Enjoy your authentic homemade treats! 🙏_`;
}

/**
 * Sends a WhatsApp delivery receipt to the CUSTOMER when an order is marked DELIVERED.
 */
async function sendCustomerDeliveredWhatsAppReceipt(order) {
  const customer = order.customer || {};
  const rawPhone = (customer.phone || '').replace(/\D/g, '');

  if (!rawPhone || rawPhone.length < 10) {
    return { success: false, message: 'No valid customer phone number' };
  }

  const customerPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  const message = formatDeliveredReceiptMessage(order);

  console.log('\n========================================');
  console.log('📲 SENDING DELIVERY RECEIPT ON WHATSAPP');
  console.log('Customer Phone:', customerPhone);
  console.log('Order ID:', order.orderId);
  console.log('========================================\n');

  try {
    if (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN) {
      const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
      const token      = process.env.ULTRAMSG_TOKEN;
      const response = await axios.post(
        `https://api.ultramsg.com/${instanceId}/messages/chat`,
        { token, to: customerPhone, body: message }
      );
      return { success: true, provider: 'ultramsg', data: response.data };
    }

    if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const token   = process.env.WHATSAPP_ACCESS_TOKEN;
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: customerPhone,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { success: true, provider: 'meta', data: response.data };
    }

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const sid        = process.env.TWILIO_ACCOUNT_SID;
      const authToken  = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const toNumber   = `whatsapp:+${customerPhone}`;
      const authHeader = Buffer.from(`${sid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('From', fromNumber);
      params.append('To', toNumber);
      params.append('Body', message);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        params.toString(),
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return { success: true, provider: 'twilio', data: response.data };
    }

    const waLink = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
    return {
      success: false,
      provider: 'none',
      message: 'No automatic WhatsApp API configured. Use 1-click wa.me link.',
      waLink,
    };
  } catch (err) {
    console.error('❌ Error sending delivered WhatsApp receipt:', err.response ? JSON.stringify(err.response.data) : err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  formatOrderMessage,
  formatCustomerReceiptMessage,
  formatDeliveredReceiptMessage,
  sendWhatsAppNotification,
  sendCustomerWhatsAppReceipt,
  sendCustomerDeliveredWhatsAppReceipt,
};

