const axios = require('axios');

/**
 * Formats a clean, professional WhatsApp order notification message.
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
 * Triggers WhatsApp notification to owner & customer.
 * Supported providers (via env WHATSAPP_PROVIDER):
 * - 'meta': WhatsApp Cloud API (Graph API)
 * - 'twilio': Twilio WhatsApp Messaging
 * - 'ultramsg': UltraMsg API
 * - 'webhook': Generic HTTP Webhook endpoint
 * If unconfigured, logs the notification message clearly.
 */
async function sendWhatsAppNotification(order) {
  const message = formatOrderMessage(order);
  const targetPhone = process.env.OWNER_WHATSAPP_NUMBER || process.env.WHATSAPP_RECIPIENT || '918125154114';
  const provider = (process.env.WHATSAPP_PROVIDER || 'auto').toLowerCase();

  console.log('\n========================================');
  console.log('📲 TRIGGERING WHATSAPP ORDER NOTIFICATION');
  console.log('Recipient:', targetPhone);
  console.log('----------------------------------------');
  console.log(message);
  console.log('========================================\n');

  try {
    // 1. Meta WhatsApp Cloud API
    if (provider === 'meta' || (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)) {
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const token = process.env.WHATSAPP_ACCESS_TOKEN;
      const cleanPhone = targetPhone.replace(/\D/g, '');

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`,
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

    // 2. Twilio WhatsApp API
    if (provider === 'twilio' || (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const cleanPhone = targetPhone.replace(/\D/g, '');
      const toNumber = `whatsapp:+${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`;

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

    // 3. UltraMsg API
    if (provider === 'ultramsg' || (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN)) {
      const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
      const token = process.env.ULTRAMSG_TOKEN;
      const cleanPhone = targetPhone.replace(/\D/g, '');

      const response = await axios.post(
        `https://api.ultramsg.com/${instanceId}/messages/chat`,
        {
          token: token,
          to: cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`,
          body: message
        }
      );
      console.log('✅ WhatsApp sent via UltraMsg:', response.data);
      return { success: true, provider: 'ultramsg', data: response.data };
    }

    // 4. Custom Webhook Endpoint
    if (process.env.WHATSAPP_WEBHOOK_URL) {
      const response = await axios.post(process.env.WHATSAPP_WEBHOOK_URL, {
        event: 'order_paid',
        recipient: targetPhone,
        message: message,
        order: order
      });
      console.log('✅ WhatsApp notification posted to Webhook:', response.data);
      return { success: true, provider: 'webhook', data: response.data };
    }

    console.log('ℹ️ WhatsApp API credentials not detected. Notification simulated & logged to server output.');
    return { success: true, provider: 'simulated_log', message: 'Logged to server console' };
  } catch (err) {
    console.error('❌ Error sending WhatsApp notification:', err.response ? err.response.data : err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  formatOrderMessage,
  sendWhatsAppNotification
};
