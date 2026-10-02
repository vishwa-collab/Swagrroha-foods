# 🔒 Razorpay Integration Backup & Reference Guide

> **Archived on**: October 2026  
> **Purpose**: This file contains the complete, battle-tested implementation of the Razorpay Standard Checkout integration for PJR Swagruha Foods. If you ever want to re-enable Razorpay in the future, all frontend and backend code, credentials, dependencies, and setup instructions are fully documented below.

---

## 1. 🔑 Credentials & Environment Variables

### Environment Configuration

Add these to your `.env` or deployment environments (Render, Vercel):

```env
# Backend Environment (.env or Render dashboard)
RAZORPAY_KEY_ID=rzp_live_Tb0kqqroUwypkp
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET_HERE

# Frontend Environment (.env or Vercel dashboard)
VITE_RAZORPAY_KEY_ID=rzp_live_Tb0kqqroUwypkp
```

* **Dashboard URL**: [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
* **Key ID (Live)**: `rzp_live_Tb0kqqroUwypkp`
* **Account**: PJR Swagruha Foods

---

## 2. 📦 Dependencies

### Backend (`backend/server/package.json`)
```bash
npm install razorpay
```
Version used: `^2.9.8`

---

## 3. 🌐 Frontend Script Tag (`frontend/index.html`)

Add this script inside `<head>` or before `</body>` in `frontend/index.html`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## 4. ⚙️ Backend Endpoints (`backend/server/index.cjs`)

### A. Initialization
```javascript
const Razorpay = require('razorpay');
const crypto = require('crypto');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
```

### B. Order Creation Endpoint
```javascript
// POST /api/create-razorpay-order — create order server-side
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // convert to paise
      currency: 'INR',
      receipt: orderId || ('pjr_' + Date.now()),
      notes: { business: 'PJR Swagruha Foods', contact: '8125154114' },
    });
    return res.json({ success: true, order, keyId: RAZORPAY_KEY_ID });
  } catch (e) {
    console.error('Razorpay create order error:', e);
    return res.status(500).json({
      success: false,
      message: e.error?.description || e.message || 'Could not create payment order.'
    });
  }
});
```

### C. Signature Verification Endpoint
```javascript
// POST /api/verify-razorpay-payment — verify signature server-side
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
```

---

## 5. 💻 Frontend React Payment Handler (`PaymentPage.tsx`)

```typescript
const RAZORPAY_KEY_ID = (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || 'rzp_live_Tb0kqqroUwypkp';
const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://swagrroha-foods.onrender.com';

const handleRazorpayPayment = async () => {
  setIsSubmitting(true);
  setOrderError('');

  // 1. Ensure Razorpay checkout script is loaded
  await new Promise<void>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).Razorpay) {
    setOrderError('Could not load payment gateway. Check internet & retry.');
    setIsSubmitting(false);
    return;
  }

  // 2. Create Razorpay order from backend
  let rzpOrder: { id: string; amount: number };
  let activeKeyId = RAZORPAY_KEY_ID;
  try {
    const res = await fetch(`${API_BASE}/api/create-razorpay-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: grandTotal, orderId }),
    });
    const data = await res.json();
    if (!data.success || !data.order?.id) {
      throw new Error(data.message || 'Server could not create payment order.');
    }
    rzpOrder = data.order;
    if (data.keyId) activeKeyId = data.keyId;
  } catch (e: unknown) {
    setOrderError(e instanceof Error ? e.message : 'Could not start payment. Please retry.');
    setIsSubmitting(false);
    return;
  }

  // 3. Open Razorpay Checkout Modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rzp = new (window as any).Razorpay({
    key: activeKeyId,
    amount: rzpOrder.amount,
    currency: 'INR',
    name: 'PJR Swagruha Foods',
    description: `Order ${orderId} — Rs.${grandTotal}`,
    order_id: rzpOrder.id,
    prefill: {
      name: customerDetails.name,
      contact: customerDetails.phone,
      email: customerDetails.email || '',
    },
    notes: {
      order_id: orderId,
      address: customerDetails.address,
    },
    theme: { color: '#f97316' },
    handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
      try {
        // 4. Verify signature on backend
        const verifyRes = await fetch(`${API_BASE}/api/verify-razorpay-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response),
        });
        const result = await verifyRes.json();
        if (!result.success) {
          setOrderError('Payment done but verification failed. Please contact us with ID: ' + response.razorpay_payment_id);
          setIsSubmitting(false);
          return;
        }

        // 5. Finalize order
        await finalizeOrder(buildOrder('Razorpay (UPI/Card/NetBanking)', response.razorpay_payment_id, grandTotal));
      } catch {
        setOrderError('Verification error. Please contact us with payment ID: ' + response.razorpay_payment_id);
        setIsSubmitting(false);
      }
    },
    modal: {
      ondismiss: () => {
        setIsSubmitting(false);
        showToast('Payment cancelled. Try again when ready.');
      },
    },
  });

  rzp.on('payment.failed', (r: { error: { description: string } }) => {
    setOrderError('Payment failed: ' + (r.error?.description || 'Please retry.'));
    setIsSubmitting(false);
  });

  rzp.open();
};
```

---

## 6. 🔄 How to Reactivate Razorpay in the Future

1. **Re-add Script**: Add `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` back to `frontend/index.html`.
2. **Re-add Backend Endpoints**: Copy the two endpoints (`/api/create-razorpay-order` and `/api/verify-razorpay-payment`) back into `backend/server/index.cjs`.
3. **Set Environment Variables**: Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` / host settings.
4. **Update PaymentPage**: Integrate the `handleRazorpayPayment` function into `PaymentPage.tsx`.
