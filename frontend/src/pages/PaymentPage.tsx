import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import {
  ArrowLeft, ShieldCheck, Sparkles, AlertCircle, CreditCard,
  Lock, MapPin, Clock, PhoneCall,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://swagrroha-foods.onrender.com';
const RAZORPAY_KEY_ID = (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || 'rzp_live_Tb0kqqroUwypkp';

export const PaymentPage: React.FC = () => {
  const { cart, selectedArea, subtotal, deliveryCharge, grandTotal, setActiveTab, customerDetails, deliveryDateInfo, addOrder, clearCart, showToast, appliedCoupon, couponDiscount } = useCart();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chosenDeliveryDate = (customerDetails as any)._deliveryDate || deliveryDateInfo;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  const buildOrder = (paymentMethod: string, utrNumber: string, actualPaidAmount?: number): PlacedOrder => ({
    orderId, customer: customerDetails, area: selectedArea, items: cart,
    subtotal, deliveryCharge,
    couponCode: appliedCoupon ? appliedCoupon.code : undefined,
    couponDiscount: couponDiscount || 0,
    totalAmount: actualPaidAmount !== undefined ? actualPaidAmount : grandTotal, deliveryDate: chosenDeliveryDate,
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
            setOrderError('Payment done but verification failed. Please contact us with ID: ' + response.razorpay_payment_id);
            setIsSubmitting(false); return;
          }
          await finalizeOrder(buildOrder('Razorpay (UPI/Card/NetBanking)', response.razorpay_payment_id, grandTotal));
        } catch {
          setOrderError('Verification error. Please contact us with payment ID: ' + response.razorpay_payment_id);
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

  if (cart.length === 0) { setActiveTab('cart'); return null; }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up">
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
        {/* Delivery Details Verification Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5 text-slate-700">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5 text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              {selectedArea.name} ({selectedArea.tier} Zone)
            </span>
            <span className="text-orange-600 font-extrabold">Delivery: ₹{deliveryCharge}</span>
          </div>
          {customerDetails.address && (
            <p className="text-[11px] text-slate-500 truncate">
              📍 {customerDetails.address}
            </p>
          )}
          {chosenDeliveryDate && (
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
              <Clock className="w-3 h-3 text-emerald-600" />
              Delivery: {chosenDeliveryDate.formattedDate || chosenDeliveryDate.dayOfWeekName || 'Upcoming Delivery'}
            </p>
          )}
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-1 shadow-xl relative overflow-hidden text-center">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/20 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-orange-400 block">
            Total Amount Payable
          </span>
          <p className="text-5xl font-black text-white py-2">Rs.{grandTotal}</p>
          {appliedCoupon && couponDiscount > 0 && (
            <p className="text-xs font-bold text-emerald-400">
              🎟️ {appliedCoupon.code}: {appliedCoupon.discountValue || 10}% off − ₹{couponDiscount} saved!
            </p>
          )}
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
          <button type="button" disabled={isSubmitting} onClick={() => handleRazorpayPayment()}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 px-6 rounded-2xl shadow-xl shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all text-base flex items-center justify-center gap-3">
            <CreditCard className="w-5 h-5" />
            <span>{isSubmitting ? 'Opening Payment...' : `Pay Rs.${grandTotal} Securely`}</span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {['PhonePe', 'Google Pay', 'Paytm', 'UPI', 'Cards', 'Net Banking'].map(m => (
              <span key={m} className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">{m}</span>
            ))}
          </div>
          <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>256-bit SSL encrypted • Instant verification</span>
          </p>

          {/* Try Once Free */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">First Timer?</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              setIsSubmitting(true); setOrderError('');
              await finalizeOrder(buildOrder('Free Trial', 'FREE_TRIAL_ORDER', 0));
            }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Placing Order...' : '🎁 Try Once Free — First Order on Us!'}</span>
          </button>
          <p className="text-center text-[11px] text-amber-600 font-semibold">
            ⚡ One-time offer for new customers only • Pay from your 2nd order
          </p>
        </div>

        {/* Direct Call Assistance Card */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Need help with your order?</span>
          <a
            href="tel:+918125154114"
            className="flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>Call Directly</span>
          </a>
        </div>
      </div>
    </div>
  );
};
