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

  const paymentRef = order.utrNumber || 'Online Payment';

  return `🚀 *New Order Received — PJR Swagruha Foods*

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

_Thank you for ordering with PJR Swagruha Foods!_`;
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
    return `  • ${pName}${weight} x${qty} — \u20b9${price}`;
  }).join('\n');

  if (!itemsListStr) itemsListStr = '  • Order Items';

  const paymentRef = order.utrNumber && order.utrNumber !== 'DIRECT_UPI_PAYMENT' ? order.utrNumber : null;
  const paymentMethod = order.paymentMethod || 'Online Payment';
  const paymentLine = paymentRef
    ? `Paid via ${paymentMethod} ✅\n💳 Transaction Ref: ${paymentRef}`
    : `Paid via ${paymentMethod} ✅`;

  return `✅ *Payment Successful! Order Confirmed*

Hi ${customer.name || 'Valued Customer'}! 🎉 Your payment was received and your order is confirmed!

🧾 *Order Receipt #${order.orderId}*
━━━━━━━━━━━━━━━━━━━━━━━

📦 *Items Ordered:*
${itemsListStr}

━━━━━━━━━━━━━━━━━━━━━━━
💵 Subtotal: \u20b9${order.subtotal || 0}
🚚 Delivery Charge: \u20b9${order.deliveryCharge || 0}
💰 *Total Paid: \u20b9${order.totalAmount || 0}*
💳 ${paymentLine}

📍 Delivery To: ${customer.address || 'N/A'}, ${area.name || 'Hyderabad'}
📅 Scheduled Delivery: ${deliveryDate}

For queries, call/WhatsApp: +91 8125154114

_Thank you for ordering from PJR Swagruha Foods! 🙏_`;
}

/**
 * Sends WhatsApp notification to admin via Fonnte (free).
 * Set FONNTE_TOKEN env var on Render to enable.
 */
async function sendWhatsAppNotification(order) {
  const message = formatOrderMessage(order);

  const targetPhone = (
    process.env.OWNER_WHATSAPP_NUMBER ||
    '918125154114'
  ).replace(/\D/g, '');

  const cleanPhone = targetPhone.startsWith('91') ? targetPhone : `91${targetPhone}`;

  console.log('\n========================================');
  console.log('📲 TRIGGERING WHATSAPP ORDER NOTIFICATION');
  console.log('Recipient (Admin):', cleanPhone);
  console.log('========================================\n');

  try {
    if (process.env.FONNTE_TOKEN) {
      const response = await axios.post(
        'https://api.fonnte.com/send',
        { target: cleanPhone, message, countryCode: '91' },
        { headers: { 'Authorization': process.env.FONNTE_TOKEN } }
      );
      console.log('✅ WhatsApp sent via Fonnte to owner:', cleanPhone, response.data);
      return { success: true, provider: 'fonnte', data: response.data };
    }

    // Fallback: generate wa.me link
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    console.log('ℹ️ FONNTE_TOKEN not set. Add it on Render to enable auto WhatsApp.');
    return { success: false, provider: 'none', message: 'FONNTE_TOKEN not configured.', waLink };

  } catch (err) {
    console.error('❌ Error sending WhatsApp to owner:', err.response ? JSON.stringify(err.response.data) : err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a WhatsApp order receipt to the CUSTOMER automatically via Fonnte.
 */
async function sendCustomerWhatsAppReceipt(order) {
  const customer = order.customer || {};
  const rawPhone = (customer.phone || '').replace(/\D/g, '');

  if (!rawPhone || rawPhone.length < 10) {
    console.log('ℹ️ Customer phone not provided or invalid. Skipping customer WhatsApp receipt.');
    return { success: false, message: 'No valid customer phone number' };
  }

  const customerPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  const message = formatCustomerReceiptMessage(order);

  console.log('\n========================================');
  console.log('📲 SENDING WHATSAPP RECEIPT TO CUSTOMER');
  console.log('Customer Phone:', customerPhone);
  console.log('Order ID:', order.orderId);
  console.log('========================================\n');

  try {
    if (process.env.FONNTE_TOKEN) {
      const response = await axios.post(
        'https://api.fonnte.com/send',
        { target: customerPhone, message, countryCode: '91' },
        { headers: { 'Authorization': process.env.FONNTE_TOKEN } }
      );
      console.log('✅ Customer WhatsApp receipt sent via Fonnte:', customerPhone, response.data);
      return { success: true, provider: 'fonnte', data: response.data };
    }

    const waLink = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
    console.log('ℹ️ FONNTE_TOKEN not set. Add it on Render to enable auto customer WhatsApp receipts.');
    return { success: false, provider: 'none', message: 'FONNTE_TOKEN not configured.', waLink };

  } catch (err) {
    console.error('❌ Error sending customer WhatsApp receipt:', err.response ? JSON.stringify(err.response.data) : err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Formats a delivery receipt message for the CUSTOMER.
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

  return `🎉 *Order Delivered — PJR Swagruha Foods*

Hi ${customer.name || 'Valued Customer'}! Your homemade food order has been successfully DELIVERED! 🚚✅

🧾 *Delivery Receipt #${order.orderId}*
━━━━━━━━━━━━━━━━━━━━━━━
📦 *Items Delivered:*
${itemsListStr}
━━━━━━━━━━━━━━━━━━━━━━━
💵 Subtotal: ₹${order.subtotal || 0}
🚚 Delivery Charge: ₹${order.deliveryCharge || 0}
💰 *Total Paid: ₹${order.totalAmount || 0} (PAID ✅)*
💳 Payment: Paid via UPI ✅

📍 Delivered To: ${customer.address || 'N/A'}, ${area.name || 'Hyderabad'}

⭐ *How was your experience?*
Please rate your food and share your feedback with us:
https://swagrroha-foods.onrender.com/track?orderId=${order.orderId}

For queries, call/WhatsApp us: +91 8125154114

_Thank you for choosing PJR Swagruha Foods! Enjoy your authentic homemade treats! 🙏_`;
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
    if (process.env.FONNTE_TOKEN) {
      const response = await axios.post(
        'https://api.fonnte.com/send',
        { target: customerPhone, message, countryCode: '91' },
        { headers: { 'Authorization': process.env.FONNTE_TOKEN } }
      );
      console.log('✅ Customer delivery receipt sent via Fonnte:', customerPhone, response.data);
      return { success: true, provider: 'fonnte', data: response.data };
    }

    const waLink = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
    return { success: false, provider: 'none', message: 'FONNTE_TOKEN not configured.', waLink };

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
