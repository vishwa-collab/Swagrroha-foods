import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  MessageCircle, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const { 
    cart, 
    selectedArea, 
    subtotal, 
    deliveryCharge, 
    grandTotal, 
    setActiveTab, 
    customerDetails,
    deliveryDateInfo,
    addOrder,
    clearCart,
    showToast
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  // Payment Account Details
  const upiNumber = '8125154114';
  const upiId = '8125154114@axl';
  const bankingName = 'Ganji Vishwateja';

  // Generate unique Order ID
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  // PhonePe Direct Payment Deep Link
  const payeeNameEncoded = encodeURIComponent(bankingName);
  const upiNoteEncoded = encodeURIComponent(`PJR Food Order ${orderId}`);
  const phonePeUrl = `phonepe://pay?pa=${upiId}&pn=${payeeNameEncoded}&am=${grandTotal}&cu=INR&tn=${upiNoteEncoded}`;

  // When user taps PhonePe button
  const handlePhonePeClick = () => {
    showToast(`Opening PhonePe to pay ₹${grandTotal} to ${bankingName}...`);
    setHasPaid(true);
  };

  // After payment, confirm order and send to WhatsApp
  const handleConfirmOrder = async () => {
    setIsSubmitting(true);

    const newOrder: PlacedOrder = {
      orderId,
      customer: customerDetails,
      area: selectedArea,
      items: cart,
      subtotal,
      deliveryCharge,
      totalAmount: grandTotal,
      deliveryDate: deliveryDateInfo,
      status: 'PLACED',
      paymentStatus: 'PAID_VIA_UPI',
      paymentMethod: 'PhonePe',
      createdAt: new Date().toISOString(),
    };

    const res = await addOrder(newOrder);
    if (!res.success) {
      showToast(res.message || 'Error confirming order.');
      setIsSubmitting(false);
      return;
    }

    clearCart();
    setIsSubmitting(false);
    setActiveTab('confirmation');
  };

  if (cart.length === 0) {
    setActiveTab('cart');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('checkout')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Address Details
        </button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Step 2 of 2: Pay via PhonePe
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Pay via PhonePe</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Tap the button below to open PhonePe and pay exactly <strong className="text-slate-900 font-black">₹{grandTotal}</strong> to <strong className="text-purple-700 font-black">{bankingName}</strong>.
        </p>
      </div>

      {/* Main Payment Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center">
        
        {/* Exact Payable Amount Badge */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl max-w-sm mx-auto space-y-1 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 block">Exact Amount to Pay</span>
          <p className="text-4xl font-black text-white">₹{grandTotal}</p>
          <p className="text-[11px] text-slate-400">Order #{orderId} • Items (₹{subtotal}) + Delivery (₹{deliveryCharge})</p>
        </div>

        {/* 🟣 Direct PhonePe Pay Button */}
        <div className="max-w-md mx-auto pt-2">
          <a
            href={phonePeUrl}
            onClick={handlePhonePeClick}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black py-5 px-6 rounded-2xl shadow-xl shadow-purple-700/30 hover:scale-[1.02] active:scale-95 transition-all text-base flex items-center justify-between gap-3 border border-purple-500/40 no-underline"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🟣</div>
              <div className="text-left">
                <span className="text-base font-black block">Pay ₹{grandTotal} via PhonePe</span>
                <span className="text-[10px] text-purple-200 font-medium">Opens PhonePe → Pay to {bankingName} ({upiNumber})</span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 shrink-0 text-purple-200" />
          </a>
        </div>

        {/* ✅ After Payment - Confirm Order */}
        <div className={`bg-emerald-50 rounded-3xl p-6 border-2 max-w-md mx-auto space-y-4 text-center transition-all ${hasPaid ? 'border-emerald-500 opacity-100' : 'border-slate-200 opacity-60'}`}>
          <div className="flex items-center justify-center gap-2 text-emerald-950">
            <CheckCircle2 className={`w-6 h-6 shrink-0 ${hasPaid ? 'text-emerald-600' : 'text-slate-400'}`} />
            <div>
              <h4 className="text-sm font-black">Payment Completed?</h4>
              <p className="text-xs text-emerald-700">After paying on PhonePe, tap below to confirm your order & send details to WhatsApp.</p>
            </div>
          </div>

          <button
            onClick={handleConfirmOrder}
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <span>{isSubmitting ? 'Saving Order...' : 'Confirm Order & Send to WhatsApp'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
