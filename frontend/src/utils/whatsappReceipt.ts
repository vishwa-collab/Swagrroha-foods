import { PlacedOrder } from '../context/CartContext';

/**
 * Generates an official WhatsApp delivery receipt text message for the customer.
 */
export function getWhatsAppDeliveredReceiptText(order: PlacedOrder): string {
  const customerName = order.customer?.name || 'Valued Customer';
  const items = order.items || [];
  
  const itemsList = items.map(item => {
    const name = item.product?.name || (item as any).name || 'Item';
    const weight = item.selectedWeightLabel ? ` (${item.selectedWeightLabel})` : '';
    const qty = item.quantity || 1;
    const price = item.unitPrice ? item.unitPrice * qty : 0;
    return `  • ${name}${weight} x${qty} — ₹${price}`;
  }).join('\n') || '  • Homemade Sweets / Pickles';

  const utr = order.utrNumber || 'Online UPI Verified';
  const address = order.customer?.address || 'Hyderabad';
  const areaName = order.area?.name || 'Hyderabad Zone';

  return `🎉 *Order Delivered — PJR Swagrooha Foods*

Hi ${customerName}! Your delicious homemade food order has been successfully *DELIVERED*! 🚚✅

🧾 *Official Receipt #${order.orderId}*
━━━━━━━━━━━━━━━━━━━━━━━
📦 *Items Delivered:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━━━━
💵 Subtotal: ₹${order.subtotal || 0}
🚚 Delivery Charge: ₹${order.deliveryCharge || 0}
💰 *Total Paid: ₹${order.totalAmount || 0} (PAID ✅)*
💳 Payment: Paid via UPI ✅

📍 Delivered To: ${address}, ${areaName}

⭐ *How was your experience?*
Please rate your food & leave feedback on our tracking page:
https://swagrroha-foods.onrender.com/track?orderId=${order.orderId}

For queries, call/WhatsApp us: +91 8125154114

_Thank you for choosing PJR Swagrooha Foods! Enjoy your authentic Telugu homemade treats! 🙏_`;
}

/**
 * Generates the full wa.me link to send the delivery receipt to the customer's phone number.
 */
export function getWhatsAppDeliveredReceiptLink(order: PlacedOrder): string {
  const rawPhone = (order.customer?.phone || (order as any).phone || '').replace(/\D/g, '');
  const phone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  const text = getWhatsAppDeliveredReceiptText(order);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates an order confirmation receipt text for PLACED / CONFIRMED orders.
 */
export function getWhatsAppPlacedReceiptLink(order: PlacedOrder): string {
  const customerName = order.customer?.name || 'Valued Customer';
  const items = order.items || [];
  
  const itemsList = items.map(item => {
    const name = item.product?.name || (item as any).name || 'Item';
    const weight = item.selectedWeightLabel ? ` (${item.selectedWeightLabel})` : '';
    const qty = item.quantity || 1;
    const price = item.unitPrice ? item.unitPrice * qty : 0;
    return `  • ${name}${weight} x${qty} — ₹${price}`;
  }).join('\n') || '  • Homemade Sweets / Pickles';

  const utr = order.utrNumber || 'Online UPI Verified';
  const address = order.customer?.address || 'Hyderabad';
  const areaName = order.area?.name || 'Hyderabad Zone';
  const deliveryDateStr = order.deliveryDate
    ? (typeof order.deliveryDate === 'object' && (order.deliveryDate as any).formattedDate
        ? `${(order.deliveryDate as any).dayOfWeekName || ''} (${(order.deliveryDate as any).formattedDate})`
        : String(order.deliveryDate))
    : 'Upcoming Saturday';

  const text = `✅ *Order Confirmed — PJR Swagrooha Foods*

Hi ${customerName}! Your order has been confirmed! 🎉

🧾 *Order Receipt #${order.orderId}*
━━━━━━━━━━━━━━━━━━━━━━━
📦 *Items Ordered:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━━━━
💵 Subtotal: ₹${order.subtotal || 0}
🚚 Delivery Charge: ₹${order.deliveryCharge || 0}
💰 *Total Paid: ₹${order.totalAmount || 0} (PAID ✅)*
💳 Payment: Paid via UPI ✅

📍 Delivery Address: ${address}, ${areaName}
📅 Scheduled Delivery: ${deliveryDateStr}

Track your order anytime:
https://swagrroha-foods.onrender.com/track?orderId=${order.orderId}

For queries, call/WhatsApp us: +91 8125154114

_Thank you for ordering with PJR Swagrooha Foods! 🙏_`;

  const rawPhone = (order.customer?.phone || (order as any).phone || '').replace(/\D/g, '');
  const phone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
