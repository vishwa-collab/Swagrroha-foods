import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import {
  ArrowLeft, ShieldCheck, Sparkles, AlertCircle, CreditCard,
  Zap, Lock, CheckCircle2, QrCode, Download, Copy, Check, Smartphone,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://swagrroha-foods.onrender.com';
const RAZORPAY_KEY_ID = (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || 'rzp_live_Tb0kqqroUwypkp';

export const PaymentPage: React.FC = () => {
  const { cart, selectedArea, subtotal, deliveryCharge, grandTotal, setActiveTab, customerDetails, deliveryDateInfo, addOrder, clearCart, showToast } = useCart();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chosenDeliveryDate = (customerDetails as any)._deliveryDate || deliveryDateInfo;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [hasTappedUpi, setHasTappedUpi] = useState(false);
  const upiId = '8125154114@ybl';
  const payeeName = 'Ganji Vishwateja';
  const upiNumber = '8125154114';
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));
  const rawUpiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('PJR Order ' + orderId)}`;
  const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=15&data=${encodeURIComponent(rawUpiUri)}`;

  const copyToClipboard = (text: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text; el.setAttribute('readonly', '');
      el.style.position = 'fixed'; el.style.left = '-9999px';
      document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    } catch (e) { console.warn('copy error', e); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(() => {});
  };

  const buildOrder = (paymentMethod: string, utrNumber: string): PlacedOrder => ({
    orderId, customer: customerDetails, area: selectedArea, items: cart,
    subtotal, deliveryCharge, totalAmount: grandTotal, deliveryDate: chosenDeliveryDate,
    status: 'PLACED', paymentStatus: 'VERIFIED_PAID', paymentMethod, utrNumber,
    paymentProof: '', createdAt: new Date().toISOString(),
  });

  const finalizeOrder = async (newOrder: PlacedOrder) => {
    const addRes = await addOrder(newOrder);
    if (!addRes.success) {
      const err = addRes.message || 'Unable to save order. Contact us on WhatsApp.';
      setOrderError(err); showToast(err); setIsSubmitting(false); return;
    }
    clearCart(); setIsSubmitting(false);
    showToast('🎉 Order placed & payment verified!');
    setActiveTab('confirmation');
  };

  const handleRazorpayPayment = async () => {
    setIsSubmitting(true); setOrderError('');
    await new Promise<void>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).Razorpay) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(); script.onerror = () => resolve();
      document.body.appendChild(script);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).Razorpay) {
      setOrderError('Could not load payment gateway. Check internet & retry.');
      setIsSubmitting(false); return;
    }
    let rzpOrder: { id: string; amount: number };
    let activeKeyId = RAZORPAY_KEY_ID;
    try {
      const res = await fetch(`${API_BASE}/api/create-razorpay-order`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal, orderId }),
      });
      const data = await res.json();
      if (!data.success || !data.order?.id) throw new Error(data.message || 'Server could not create payment order.');
      rzpOrder = data.order;
      if (data.keyId) activeKeyId = data.keyId;
    } catch (e: unknown) {
      setOrderError(e instanceof Error ? e.message : 'Could not start payment. Please retry.');
      setIsSubmitting(false); return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new (window as any).Razorpay({
      key: activeKeyId, amount: rzpOrder.amount, currency: 'INR',
      name: 'PJR Swagruha Foods', description: `Order ${orderId} — Rs.${grandTotal}`,
      order_id: rzpOrder.id,
      prefill: { name: customerDetails.name, contact: customerDetails.phone, email: customerDetails.email || '' },
      notes: { order_id: orderId, address: customerDetails.address },
      theme: { color: '#f97316' },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        try {
          const verifyRes = await fetch(`${API_BASE}/api/verify-razorpay-payment`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const result = await verifyRes.json();
          if (!result.success) {
            setOrderError('Payment done but verification failed. WhatsApp us with ID: ' + response.razorpay_payment_id);
            setIsSubmitting(false); return;
          }
          const itemsText = cart.map(i => `  • ${i.product.name} (${i.selectedWeightLabel}) x${i.quantity} (₹${i.unitPrice * i.quantity})`).join('\n');
          const waText = `*Order Receipt — PJR Swagruha Foods* 🧾\n\n` +
            `*Order ID:* ${orderId}\n` +
            `*Customer:* ${customerDetails.name}\n` +
            `*Phone:* ${customerDetails.phone}\n` +
            `*Address:* ${customerDetails.address}, ${selectedArea.name}\n` +
            `*Delivery Date:* ${chosenDeliveryDate.dayOfWeekName || ''} (${chosenDeliveryDate.formattedDate || ''})\n\n` +
            `*Items:*\n${itemsText}\n\n` +
            `*Total Paid:* ₹${grandTotal} ✅ (Razorpay Online)\n` +
            `*Payment ID:* ${response.razorpay_payment_id}\n\n` +
            `_Thank you for ordering with PJR Swagruha Foods!_ 🙏`;
          try {
            window.open(`https://wa.me/918125154114?text=${encodeURIComponent(waText)}`, '_blank');
          } catch (err) {
            console.warn('Could not auto-open WhatsApp:', err);
          }
          await finalizeOrder(buildOrder('Razorpay (UPI/Card/NetBanking)', response.razorpay_payment_id));
        } catch {
          setOrderError('Verification error. WhatsApp us with payment ID: ' + response.razorpay_payment_id);
          setIsSubmitting(false);
        }
      },
      modal: { ondismiss: () => { setIsSubmitting(false); showToast('Payment cancelled. Try again when ready.'); } },
    });
    rzp.on('payment.failed', (r: { error: { description: string } }) => {
      setOrderError('Payment failed: ' + (r.error?.description || 'Please retry.')); setIsSubmitting(false);
    });
    rzp.open();
  };

  const handleZeroPaymentTest = async () => {
    setIsSubmitting(true);
    setOrderError('');
    const itemsText = cart.map(i => `  • ${i.product.name} (${i.selectedWeightLabel}) x${i.quantity} (₹${i.unitPrice * i.quantity})`).join('\n');
    const waText = `*Order Receipt — PJR Swagruha Foods* 🧾\n\n` +
      `*Order ID:* ${orderId}\n` +
      `*Customer:* ${customerDetails.name}\n` +
      `*Phone:* ${customerDetails.phone}\n` +
      `*Address:* ${customerDetails.address}, ${selectedArea.name}\n` +
      `*Delivery Date:* ${chosenDeliveryDate.dayOfWeekName || ''} (${chosenDeliveryDate.formattedDate || ''})\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total Paid:* ₹0 ✅ (Free Test Check)\n` +
      `*Payment Ref:* ZERO_PAYMENT_TEST\n\n` +
      `_Thank you for ordering with PJR Swagruha Foods!_ 🙏`;
    try {
      window.open(`https://wa.me/918125154114?text=${encodeURIComponent(waText)}`, '_blank');
    } catch (err) {
      console.warn('Could not auto-open WhatsApp:', err);
    }
    await finalizeOrder({
      ...buildOrder('Free Test Check (₹0)', 'ZERO_PAYMENT_TEST'),
      totalAmount: 0,
    });
  };


  const handleConfirmUpiOrder = async () => {
    setIsSubmitting(true); setOrderError('');
    const itemsText = cart.map(i => `  * ${i.product.name} (${i.selectedWeightLabel}) x${i.quantity} (Rs.${i.unitPrice * i.quantity})`).join('\n');
    const waText = `New Order - PJR Swagruha Foods\n\nOrder ID: ${orderId}\nCustomer: ${customerDetails.name}\nPhone: ${customerDetails.phone}\nEmail: ${customerDetails.email || 'N/A'}\nArea: ${selectedArea.name}\nAddress: ${customerDetails.address}\n\nItems:\n${itemsText}\n\nSubtotal: Rs.${subtotal} | Delivery: ${deliveryCharge === 0 ? 'FREE' : `Rs.${deliveryCharge}`} | Total: Rs.${grandTotal}\nDelivery: ${chosenDeliveryDate.dayOfWeekName} (${chosenDeliveryDate.formattedDate})\nPayment: Direct UPI QR Self-Confirmed\nPlease verify Rs.${grandTotal} received before dispatching.`;
    window.open(`https://wa.me/918125154114?text=${encodeURIComponent(waText)}`, '_blank');
    await finalizeOrder(buildOrder('Direct UPI QR', 'DIRECT_UPI_PAYMENT'));
  };

  const openUpiApp = (app: 'phonepe' | 'gpay' | 'paytm' | 'any') => {
    setHasTappedUpi(true); copyToClipboard(upiNumber);
    if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) { showToast('Scan the QR code on your phone.'); return; }
    if (app === 'any') { window.location.href = rawUpiUri; return; }
    const pkg = app === 'phonepe' ? 'com.phonepe.app' : app === 'gpay' ? 'com.google.android.apps.nbu.paisa.user' : 'net.one97.paytm';
    window.location.href = `intent://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR#Intent;scheme=upi;package=${pkg};end`;
  };

  if (cart.length === 0) { setActiveTab('cart'); return null; }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={() => setActiveTab('checkout')} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Address Details
        </button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Secure Payment
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Complete Payment</span><Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Pay securely via Razorpay — supports <strong className="text-slate-700">PhonePe, Google Pay, Paytm, Cards and Net Banking</strong>.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-w-md mx-auto">
        <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-1 shadow-xl relative overflow-hidden text-center">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/20 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-orange-400 block">Total Amount Payable</span>
          <p className="text-5xl font-black text-white py-2">Rs.{grandTotal}</p>
          <p className="text-[11px] text-slate-400">Order #{orderId}</p>
        </div>

        {orderError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-semibold leading-relaxed">{orderError}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recommended</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <button type="button" disabled={isSubmitting} onClick={handleRazorpayPayment}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 px-6 rounded-2xl shadow-xl shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all text-base flex items-center justify-center gap-3">
            <CreditCard className="w-5 h-5" />
            <span>{isSubmitting ? 'Opening Payment...' : `Pay Rs.${grandTotal} Securely`}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleZeroPaymentTest}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-2xl border border-slate-200 text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <span>⚡ Test Order with ₹0 (Instant Free Check)</span>
          </button>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {['PhonePe', 'Google Pay', 'Paytm', 'UPI', 'Cards', 'Net Banking'].map(m => (
              <span key={m} className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">{m}</span>
            ))}
          </div>
          <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>256-bit SSL encrypted - Order saved only after verified payment</span>
          </p>
        </div>

        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
                <QrCode className="w-3.5 h-3.5" /> Or Scan QR (manual fallback)
                <span className="text-slate-300 group-open:rotate-180 transition-transform inline-block">v</span>
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </summary>
          <div className="bg-gradient-to-b from-orange-50/60 to-amber-50/40 rounded-3xl border-2 border-orange-200/50 p-5 space-y-4 mt-2 text-center">
            <div className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
              <Zap className="w-3.5 h-3.5 fill-white" /><span>Rs.{grandTotal} Pre-filled in QR</span>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-lg inline-block border-2 border-slate-200">
              <img src={dynamicQrCodeUrl} alt={`UPI QR for Rs.${grandTotal}`} className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl mx-auto" />
            </div>
            <button type="button"
              onClick={async () => {
                try {
                  const blob = await (await fetch(dynamicQrCodeUrl)).blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `PJR-QR-Rs${grandTotal}.png`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                } catch { window.open(dynamicQrCodeUrl, '_blank'); }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all">
              <Download className="w-4 h-4" /> Download QR to Gallery
            </button>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl px-3 py-2.5 text-left text-[11px] text-purple-800 font-semibold">
              PhonePe: Download QR then PhonePe then Scanner then Upload from Gallery then Select then Pay!
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'PhonePe', app: 'phonepe' as const, bg: 'bg-[#5f259f] hover:bg-[#4d1d82]' },
                { label: 'GPay', app: 'gpay' as const, bg: 'bg-[#1a73e8] hover:bg-[#1557b0]' },
                { label: 'Paytm', app: 'paytm' as const, bg: 'bg-[#002970] hover:bg-[#001d52]' },
              ].map(({ label, app, bg }) => (
                <button key={app} type="button" onClick={() => openUpiApp(app)} className={`${bg} py-3 px-2 text-white rounded-2xl text-xs font-extrabold flex flex-col items-center gap-1 shadow-md active:scale-95 transition-all`}>
                  <Smartphone className="w-4 h-4" /><span>{label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-3 py-2 text-left">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">UPI / Mobile</span>
                <span className="text-xs font-black font-mono text-slate-800">{upiNumber} ({payeeName})</span>
              </div>
              <button type="button"
                onClick={() => { copyToClipboard(upiNumber); setCopiedNumber(true); setHasTappedUpi(true); showToast(`Copied ${upiNumber}!`); setTimeout(() => setCopiedNumber(false), 3000); }}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl text-xs font-bold flex items-center gap-1 transition-all">
                {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNumber ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            {hasTappedUpi && (
              <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-300 space-y-3 text-left">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">After paying <strong>Rs.{grandTotal}</strong> via QR, tap below to confirm:</p>
                </div>
                <button type="button" disabled={isSubmitting} onClick={handleConfirmUpiOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl shadow-md active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Placing Order...' : 'I Have Paid - Confirm Order'}
                </button>
              </div>
            )}
            {!hasTappedUpi && <p className="text-[11px] text-slate-400 text-center animate-pulse">Scan QR or tap app button above, then confirm</p>}
          </div>
        </details>
      </div>
    </div>
  );
};
