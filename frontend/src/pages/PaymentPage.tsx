import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  MessageCircle, 
  PhoneCall, 
  Smartphone, 
  Zap,
  CheckCircle2,
  Lock
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chosenDeliveryDate = (customerDetails as any)._deliveryDate || deliveryDateInfo;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);
  const [numberCopied, setNumberCopied] = useState(false);

  // Direct Individual UPI & Contact Info
  const upiNumber = '8125154114';
  const upiId = '8125154114@ybl';
  const payeeName = 'Ganji Vishwateja';

  // Unique Order ID
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  // Dynamic Live UPI URI with pre-filled exact order amount
  const rawUpiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR`;
  
  // High-Resolution Live Dynamic QR Code generated specifically for this exact amount
  const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=15&data=${encodeURIComponent(rawUpiUri)}`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setUpiCopied(true);
    showToast('UPI ID (8125154114@ybl) copied!');
    setTimeout(() => setUpiCopied(false), 2500);
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(upiNumber);
    setNumberCopied(true);
    showToast('Phone number (8125154114) copied!');
    setTimeout(() => setNumberCopied(false), 2500);
  };

  const openApp = (app: 'phonepe' | 'gpay' | 'paytm') => {
    copyUpiId();
    showToast(`UPI ID copied! Opening ${app.toUpperCase()}...`);
    if (app === 'phonepe') window.location.href = 'phonepe://';
    else if (app === 'gpay') window.location.href = 'gpay://';
    else if (app === 'paytm') window.location.href = 'paytmmp://';
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newOrder: PlacedOrder = {
      orderId,
      customer: customerDetails,
      area: selectedArea,
      items: cart,
      subtotal,
      deliveryCharge,
      totalAmount: grandTotal,
      deliveryDate: chosenDeliveryDate,
      status: 'PLACED',
      paymentStatus: 'PAID_VIA_UPI',
      paymentMethod: 'Dynamic UPI QR Payment',
      utrNumber: 'DIRECT_UPI_PAYMENT',
      createdAt: new Date().toISOString(),
    };

    const itemsText = cart.map(i => `  • ${i.product.name} (${i.selectedWeightLabel}) x${i.quantity} (₹${i.unitPrice * i.quantity})`).join('\n');
    const waText =
      `🚀 *New Order Received — PJR Swagrooha Foods*\n\n` +
      `*Order ID:* ${orderId}\n` +
      `*Customer Name:* ${customerDetails.name}\n` +
      `*Phone Number:* ${customerDetails.phone}\n` +
      `*Email:* ${customerDetails.email || 'N/A'}\n` +
      `*Delivery Area:* ${selectedArea.name}\n` +
      `*Delivery Address:* ${customerDetails.address}\n\n` +
      `📦 *Order Items:*\n${itemsText}\n\n` +
      `💵 *Subtotal:* ₹${subtotal}\n` +
      `🚚 *Delivery Charge:* ₹${deliveryCharge}\n` +
      `💰 *Total Amount:* ₹${grandTotal}\n` +
      `📅 *Delivery Day:* ${chosenDeliveryDate.dayOfWeekName} (${chosenDeliveryDate.formattedDate})\n` +
      `💳 *Payment:* Direct UPI to ${upiId}\n\n` +
      `_Thank you for ordering with PJR Swagrooha Foods!_`;

    // Open WhatsApp alert to merchant
    const waWindow = window.open(`https://wa.me/918125154114?text=${encodeURIComponent(waText)}`, '_blank');

    const addRes = await addOrder(newOrder);
    if (!addRes.success) {
      const err = addRes.message || 'Unable to place your order. Please try again.';
      showToast(err);
      setIsSubmitting(false);
      if (waWindow) waWindow.close();
      return;
    }

    clearCart();
    setIsSubmitting(false);
    showToast('🎉 Order placed successfully!');
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
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Address Details
        </button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          100% Secure UPI Payment
        </span>
      </div>

      {/* Title Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Scan to Pay &amp; Confirm Order</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Scan the dynamic QR code with any UPI app. Exact <strong className="text-slate-900 font-black">₹{grandTotal}</strong> is pre-filled automatically!
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center max-w-md mx-auto">

        {/* Amount Badge */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl mx-auto space-y-1 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 block">Total Amount Payable</span>
          <p className="text-5xl font-black text-white py-2">₹{grandTotal}</p>
          <p className="text-[11px] text-slate-400">Order #{orderId} • Exact Amount Pre-filled</p>
        </div>

        {/* ── DYNAMIC LIVE QR CODE (Generated in Real-Time with Exact Grand Total) ── */}
        <div className="bg-gradient-to-b from-orange-50/70 via-amber-50/40 to-emerald-50/60 p-6 rounded-3xl border-2 border-brand-400/70 space-y-4 shadow-sm relative">
          
          {/* Live Badge */}
          <div className="inline-flex items-center gap-1.5 bg-brand-500 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Exact ₹{grandTotal} Pre-filled QR</span>
          </div>

          {/* Dynamic Generated QR Image */}
          <div className="bg-white p-3 rounded-2xl shadow-lg inline-block border-2 border-slate-200">
            <img 
              src={dynamicQrCodeUrl} 
              alt={`Dynamic UPI QR Code for ₹${grandTotal}`} 
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl mx-auto"
            />
          </div>

          {/* Supported UPI Apps Badges */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[10px] font-extrabold bg-[#5f259f] text-white px-2 py-0.5 rounded-md shadow-sm">PhonePe</span>
            <span className="text-[10px] font-extrabold bg-[#1a73e8] text-white px-2 py-0.5 rounded-md shadow-sm">Google Pay</span>
            <span className="text-[10px] font-extrabold bg-[#002970] text-white px-2 py-0.5 rounded-md shadow-sm">Paytm</span>
            <span className="text-[10px] font-extrabold bg-emerald-700 text-white px-2 py-0.5 rounded-md shadow-sm">BHIM</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-600 font-bold block">
              Scan with any UPI Scanner or Camera App
            </span>
            <span className="text-xs font-black text-slate-900 block font-mono">
              {payeeName} ({upiId})
            </span>
          </div>
        </div>

        {/* ── PHONE NUMBER & UPI ID WITH 1-CLICK COPY ── */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-3">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Or Transfer directly using UPI Details
          </span>

          {/* Copy Phone Number */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">PhonePe / GPay Number</span>
              <p className="font-mono font-black text-slate-900 text-sm">{upiNumber}</p>
            </div>
            <button
              type="button"
              onClick={copyNumber}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all active:scale-95"
            >
              {numberCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{numberCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Copy UPI ID */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">UPI ID</span>
              <p className="font-mono font-black text-slate-900 text-sm">{upiId}</p>
            </div>
            <button
              type="button"
              onClick={copyUpiId}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all active:scale-95"
            >
              {upiCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{upiCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Quick Open App Buttons */}
          <div className="pt-1">
            <span className="text-[10px] text-slate-500 font-semibold block mb-2 text-center">
              Copy UPI ID and open your preferred app:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => openApp('phonepe')}
                className="py-2.5 px-2 bg-[#5f259f] hover:bg-[#4d1d82] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>PhonePe</span>
              </button>
              <button
                type="button"
                onClick={() => openApp('gpay')}
                className="py-2.5 px-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>GPay</span>
              </button>
              <button
                type="button"
                onClick={() => openApp('paytm')}
                className="py-2.5 px-2 bg-[#002970] hover:bg-[#001d52] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Paytm</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 1-CLICK INSTANT ORDER CONFIRMATION BUTTON ── */}
        <form onSubmit={handleConfirmOrder} className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>
              {isSubmitting
                ? 'Confirming Your Order...'
                : `I Have Paid ₹${grandTotal} — Confirm Order`
              }
            </span>
          </button>

          <p className="text-center text-[11px] text-slate-400 mt-2.5 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>Instant confirmation &amp; WhatsApp invoice generated automatically</span>
          </p>
        </form>

      </div>

    </div>
  );
};
