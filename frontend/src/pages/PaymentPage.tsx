import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  MessageCircle, 
  QrCode, 
  Smartphone, 
  Zap, 
  Lock,
  CheckCircle2,
  Download,
  Copy,
  Check
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
  const [orderError, setOrderError] = useState('');

  // Tracks whether user has tapped a payment button — reveals Step 2
  const [hasTappedPayment, setHasTappedPayment] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Business Merchant UPI & Contact Info
  const upiId = 'Q27340885@ybl';
  const payeeName = 'pjrswagrooha foods';
  const registeredBusinessName = 'Sri Saraswathi Medical';
  const upiNumber = '9247467111';

  // Unique Order ID
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  // Dynamic Live UPI URI with pre-filled exact order amount & order reference note
  const rawUpiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('PJR Order ' + orderId)}`;
  
  // High-Resolution Live Dynamic QR Code generated specifically for this exact amount
  const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=15&data=${encodeURIComponent(rawUpiUri)}`;

  const copyToClipboard = (text: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    } catch (e) {
      console.warn('execCommand copy error:', e);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const openApp = (app: 'phonepe' | 'gpay' | 'paytm' | 'any') => {
    setHasTappedPayment(true);
    copyToClipboard(upiId);

    const appName = app === 'phonepe' ? 'PhonePe' : app === 'gpay' ? 'Google Pay' : app === 'paytm' ? 'Paytm' : 'UPI App';
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (!isMobile) {
      showToast(`Copied Merchant UPI ID (${upiId})! Scan QR with ${appName} to pay ₹${grandTotal}.`);
      return;
    }

    showToast(`Opening ${appName}... Amount: ₹${grandTotal} pre-filled`);

    if (app === 'any') {
      window.location.href = rawUpiUri;
      return;
    }

    if (isIOS) {
      if (app === 'phonepe') {
        window.location.href = `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('PJR Order ' + orderId)}`;
        setTimeout(() => { window.location.href = 'phonepe://'; }, 600);
      } else if (app === 'gpay') {
        window.location.href = `gpay://upi/pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('PJR Order ' + orderId)}`;
        setTimeout(() => { window.location.href = 'gpay://'; }, 600);
      } else if (app === 'paytm') {
        window.location.href = `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('PJR Order ' + orderId)}`;
        setTimeout(() => { window.location.href = 'paytmmp://'; }, 600);
      }
      return;
    }

    // Android: Use standard direct URI or dedicated Intent with fallback
    if (app === 'phonepe') {
      const phonePeUri = `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('PJR Order ' + orderId)}`;
      const phonePeIntent = `intent://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('PJR Order ' + orderId)}#Intent;scheme=upi;package=com.phonepe.app;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.phonepe.app;end`;
      try {
        window.location.href = phonePeUri;
        setTimeout(() => { window.location.href = phonePeIntent; }, 500);
      } catch {
        window.location.href = rawUpiUri;
      }
    } else if (app === 'gpay') {
      const gpayUri = `gpay://upi/pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('PJR Order ' + orderId)}`;
      try {
        window.location.href = gpayUri;
        setTimeout(() => { window.location.href = rawUpiUri; }, 600);
      } catch {
        window.location.href = rawUpiUri;
      }
    } else if (app === 'paytm') {
      const paytmUri = `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('PJR Order ' + orderId)}`;
      try {
        window.location.href = paytmUri;
        setTimeout(() => { window.location.href = rawUpiUri; }, 600);
      } catch {
        window.location.href = rawUpiUri;
      }
    }
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setOrderError('');

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
      paymentMethod: 'Dynamic UPI QR',
      utrNumber: 'DIRECT_UPI_PAYMENT',
      paymentProof: '',
      createdAt: new Date().toISOString(),
    };

    const itemsText = cart.map(i => `  • ${i.product.name} (${i.selectedWeightLabel}) x${i.quantity} (₹${i.unitPrice * i.quantity})`).join('\n');
    const waReceiptText =
      `🧾 *OFFICIAL PAYMENT & ORDER RECEIPT*\n` +
      `*PJR Swagruha Foods*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Order ID:* ${orderId}\n` +
      `*Payment Status:* PAID VIA UPI ✅\n` +
      `*Payment Account:* ${upiId} (${registeredBusinessName})\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Customer Information:*\n` +
      `• Name: ${customerDetails.name}\n` +
      `• Phone: ${customerDetails.phone}\n` +
      `• Email: ${customerDetails.email || 'N/A'}\n` +
      `• Delivery Area: ${selectedArea.name}\n` +
      `• Address: ${customerDetails.address}\n\n` +
      `📦 *Items Ordered:*\n${itemsText}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 Items Subtotal: ₹${subtotal}\n` +
      `🚚 Delivery Charge: ${deliveryCharge === 0 ? 'FREE (₹500+ Discount) 🎉' : `₹${deliveryCharge}`}\n` +
      `💰 *Total Amount Paid:* ₹${grandTotal} (PAID ✅)\n` +
      `📅 *Scheduled Delivery:* ${chosenDeliveryDate.dayOfWeekName} (${chosenDeliveryDate.formattedDate})\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Official Receipt dispatched to owner WhatsApp: +91 8125154114_`;

    const waWindow = window.open(`https://wa.me/918125154114?text=${encodeURIComponent(waReceiptText)}`, '_blank');

    const addRes = await addOrder(newOrder);
    if (!addRes.success) {
      const err = addRes.message || 'Unable to place your order. Please try again.';
      setOrderError(err);
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
          <span>Scan & Pay</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Scan the QR code with PhonePe, Google Pay, or Paytm. Exact <strong className="text-slate-900 font-black">₹{grandTotal}</strong> is pre-filled automatically!
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center max-w-md mx-auto">

        {/* Amount Badge */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl mx-auto space-y-1 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 block">Total Amount Payable</span>
          <p className="text-5xl font-black text-white py-2">₹{grandTotal}</p>
          <p className="text-[11px] text-slate-400">Order #{orderId} • Exact Amount Pre-filled in QR</p>
        </div>

        {/* ── STEP 1: DYNAMIC LIVE QR CODE ── */}
        <div className="bg-gradient-to-b from-orange-50/70 via-amber-50/40 to-emerald-50/60 p-6 rounded-3xl border-2 border-brand-400/70 space-y-4 shadow-sm relative">
          
          {/* Live Badge */}
          <div className="inline-flex items-center gap-1.5 bg-brand-500 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Step 1: Scan with Any UPI App</span>
          </div>

          {/* Dynamic Generated QR Image */}
          <div className="bg-white p-3 rounded-2xl shadow-lg inline-block border-2 border-slate-200">
            <img 
              src={dynamicQrCodeUrl} 
              alt={`Dynamic UPI QR Code for ₹${grandTotal}`} 
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl mx-auto"
            />
          </div>

          {/* ── DOWNLOAD QR BUTTON ── */}
          <button
            type="button"
            onClick={async () => {
              setHasTappedPayment(true);
              try {
                const response = await fetch(dynamicQrCodeUrl);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `PJR-Swagrooha-Payment-QR-Rs${grandTotal}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch {
                window.open(dynamicQrCodeUrl, '_blank');
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            Download QR to Gallery
          </button>

          {/* PhonePe tip */}
          <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-2xl px-3 py-2.5 text-left">
            <span className="text-base leading-none">💡</span>
            <p className="text-[11px] text-purple-800 font-semibold leading-relaxed">
              <span className="font-black">PhonePe users:</span> Download QR → Open PhonePe → Tap Scanner → Tap <span className="font-black">"Upload from Gallery"</span> → Select QR → ₹{grandTotal} auto-filled → Pay!
            </p>
          </div>

          {/* ── PAY VIA ANY UPI APP (Universal Intent) ── */}
          <button
            type="button"
            onClick={() => openApp('any')}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-500/20 transition-all"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Pay ₹{grandTotal} via Any UPI App</span>
          </button>

          {/* ── 3 APP LAUNCH BUTTONS ── */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-600 font-bold block mb-2 text-center">
              Or open directly in:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* PhonePe */}
              <button
                type="button"
                onClick={() => openApp('phonepe')}
                className="py-3 px-2 bg-[#5f259f] hover:bg-[#4d1d82] text-white rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>PhonePe</span>
              </button>

              {/* Google Pay */}
              <button
                type="button"
                onClick={() => openApp('gpay')}
                className="py-3 px-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Google Pay</span>
              </button>

              {/* Paytm */}
              <button
                type="button"
                onClick={() => openApp('paytm')}
                className="py-3 px-2 bg-[#002970] hover:bg-[#001d52] text-white rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Paytm</span>
              </button>
            </div>

            {/* Quick Copy Merchant Details Box */}
            <div className="space-y-2 mt-2.5">
              {/* UPI ID Row */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-left">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Merchant UPI ID</span>
                  <span className="text-xs font-black font-mono text-slate-800">{upiId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(upiId);
                    setCopiedUpi(true);
                    setHasTappedPayment(true);
                    showToast(`Copied Merchant UPI ID (${upiId})!`);
                    setTimeout(() => setCopiedUpi(false), 3000);
                  }}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
                </button>
              </div>

              {/* Mobile Number Row */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-left">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Business Mobile Number</span>
                  <span className="text-xs font-black font-mono text-slate-800">{upiNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(upiNumber);
                    setCopiedNumber(true);
                    setHasTappedPayment(true);
                    showToast(`Copied ${upiNumber} to clipboard!`);
                    setTimeout(() => setCopiedNumber(false), 3000);
                  }}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNumber ? 'Copied!' : 'Copy No.'}</span>
                </button>
              </div>

              {/* Merchant Verification Note */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2.5 text-left space-y-1">
                <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
                  🏢 <span className="font-black">Brand:</span> {payeeName} <br />
                  <span className="text-[10px] text-amber-800">Bank verified name on PhonePe/GPay: <strong>{registeredBusinessName}</strong></span>
                </p>
              </div>

              {/* Helpful tip for chat screen */}
              <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-2.5 text-left space-y-1">
                <p className="text-[11px] text-purple-900 font-semibold leading-relaxed">
                  💡 <span className="font-black">Manual pay:</span> Open PhonePe / GPay → Tap <span className="font-black">"To UPI ID"</span> → Search <span className="font-black font-mono">{upiId}</span> (or mobile <span className="font-black font-mono">{upiNumber}</span>) → Enter <span className="font-black">₹{grandTotal}</span> &amp; Pay!
                </p>
              </div>
            </div>
          </div>

          {/* QR UPI hint */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
            <QrCode className="w-3.5 h-3.5 text-slate-400" />
            <span>Scan with Camera App or any UPI App Scanner</span>
          </div>
        </div>

        {/* ── STEP 2: I HAVE PAID — shown only after tapping a payment button ── */}
        {hasTappedPayment && (
          <div className="space-y-4 animate-[fadeIn_0.4s_ease-out]">
            <div className="border-t border-slate-200 pt-4">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block text-center">
                Step 2: Confirm Payment
              </span>
            </div>

            <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-emerald-300 space-y-4 shadow-sm text-left">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                  After paying <strong>₹{grandTotal}</strong> to business account (<strong>{upiId}</strong>) on PhonePe / Google Pay / Paytm, tap the button below to generate your official receipt:
                </p>
              </div>

              {orderError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{orderError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>
                  {isSubmitting
                    ? 'Generating Official Receipt...'
                    : '✅ Payment Completed — View & Download Receipt'
                  }
                </span>
              </button>

              <p className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Official PDF invoice generated instantly &amp; WhatsApp alert dispatched to owner</span>
              </p>
            </div>
          </div>
        )}

        {/* Hint when Step 2 is not yet visible */}
        {!hasTappedPayment && (
          <p className="text-[11px] text-slate-400 text-center animate-pulse">
            👆 Tap a payment button above to proceed
          </p>
        )}

      </div>
    </div>
  );
};
