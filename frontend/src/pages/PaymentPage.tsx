import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { IMAGES } from '../assets/images';
import { 
  Phone, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  MessageCircle, 
  ExternalLink,
  QrCode,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  Lock,
  Hash
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
    isUtrUsed,
    clearCart,
    showToast
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');

  const upiId = '8125154114@ybl';
  const phonePeNumber = '8125154114';
  const businessWhatsAppNumber = '918125154114';

  const copyNumber = () => {
    navigator.clipboard.writeText(phonePeNumber);
    setCopied(true);
    showToast('PhonePe / GPay number copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate unique Order ID
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  // Construct Direct UPI Payment Links with pre-filled exact money
  const upiNote = encodeURIComponent(`Order ${orderId}`);
  const payeeName = encodeURIComponent('PJR Swagrooha Foods');

  // Generic UPI link supported by PhonePe, GPay, Paytm, BHIM, Cred
  const directUpiUrl = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${grandTotal}&cu=INR&tn=${upiNote}`;
  
  // App-specific Intent Links
  const phonePeDeepLink = `phonepe://pay?pa=${upiId}&pn=${payeeName}&am=${grandTotal}&cu=INR&tn=${upiNote}`;
  const gPayDeepLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${grandTotal}&cu=INR&tn=${upiNote}`;
  const paytmDeepLink = `paytmmp://pay?pa=${upiId}&pn=${payeeName}&am=${grandTotal}&cu=INR&tn=${upiNote}`;

  // Formatted WhatsApp receipt text to send after payment
  const itemsTextList = cart.map(item => (
    `• ${item.product.name} (${item.selectedWeightLabel}) x${item.quantity} - ₹${item.unitPrice * item.quantity}`
  )).join('\n');

  const formattedWhatsAppMessage = 
`🚀 *New Order Placed — PJR Swagrooha Foods*

*Order ID:* ${orderId}
*Name:* ${customerDetails.name}
*Phone:* ${customerDetails.phone}
*Delivery Area:* ${selectedArea.name}
*Address:* ${customerDetails.address}
*Delivery Date:* ${deliveryDateInfo.dayOfWeekName} (${deliveryDateInfo.formattedDate})

📦 *Items:*
${itemsTextList}

🚚 *Delivery Charge:* ₹${deliveryCharge}
💰 *Total Paid:* ₹${grandTotal}
💳 *Payment:* Paid via PhonePe / GPay ✅`;

  const whatsappUrl = `https://wa.me/${businessWhatsAppNumber}?text=${encodeURIComponent(formattedWhatsAppMessage)}`;

  // Handle direct payment click (opens PhonePe / GPay with pre-filled money & saves order)
  const handleDirectUpiPayment = async (deepLink: string, appName: string) => {
    setIsSubmitting(true);
    showToast(`Opening ${appName} with exact amount ₹${grandTotal}...`);

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
      paymentMethod: appName,
      createdAt: new Date().toISOString(),
    };

    // Save order on backend DB & state
    await addOrder(newOrder);

    // Launch UPI app (PhonePe / GPay / Paytm)
    window.location.href = deepLink;

    setTimeout(() => {
      clearCart();
      setIsSubmitting(false);
      // Open WhatsApp chat with pre-filled order receipt
      window.open(whatsappUrl, '_blank');
      setActiveTab('confirmation');
    }, 1200);
  };

  // Submit with UTR Number (Optional verification step)
  const handleConfirmWithUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError('');

    const cleanUtr = utrNumber.trim();
    if (cleanUtr && isUtrUsed(cleanUtr)) {
      setUtrError('⚠️ This UTR has already been submitted for another order.');
      return;
    }

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
      utrNumber: cleanUtr || `UPI-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const res = await addOrder(newOrder);
    if (!res.success) {
      setUtrError(res.message || 'Error confirming order.');
      setIsSubmitting(false);
      return;
    }

    clearCart();
    setIsSubmitting(false);
    window.open(whatsappUrl, '_blank');
    setActiveTab('confirmation');
  };

  if (cart.length === 0) {
    setActiveTab('cart');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('checkout')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Step 2 of 2: Pay via PhonePe / GPay
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Pay Directly in PhonePe / GPay</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Tap your preferred payment app below. The exact amount <strong className="text-slate-900 font-black">₹{grandTotal}</strong> will open pre-filled automatically!
        </p>
      </div>

      {/* Main Payment Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center">
        
        {/* Exact Payable Amount Badge */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl max-w-sm mx-auto space-y-1 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 block">Exact Money to Pay</span>
          <p className="text-4xl font-black text-white">₹{grandTotal}</p>
          <p className="text-[11px] text-slate-400">Order #{orderId} • Items (₹{subtotal}) + Delivery (₹{deliveryCharge})</p>
        </div>

        {/* 🚀 DIRECT PHONEPE & GPAY PAYMENT BUTTONS */}
        <div className="max-w-md mx-auto space-y-3 pt-2">
          
          {/* PhonePe Direct Pay Button */}
          <button
            type="button"
            onClick={() => handleDirectUpiPayment(phonePeDeepLink, 'PhonePe')}
            disabled={isSubmitting}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-purple-700/30 hover:scale-[1.02] active:scale-95 transition-all text-base flex items-center justify-between gap-3 border border-purple-500/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">🟣</div>
              <div className="text-left">
                <span className="text-sm font-black block">Pay ₹{grandTotal} on PhonePe</span>
                <span className="text-[10px] text-purple-200 font-medium">Opens PhonePe app with exact money pre-filled</span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 shrink-0 text-purple-200" />
          </button>

          {/* Google Pay Direct Pay Button */}
          <button
            type="button"
            onClick={() => handleDirectUpiPayment(gPayDeepLink, 'Google Pay')}
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-slate-900/30 hover:scale-[1.02] active:scale-95 transition-all text-base flex items-center justify-between gap-3 border border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">🔵</div>
              <div className="text-left">
                <span className="text-sm font-black block">Pay ₹{grandTotal} on Google Pay</span>
                <span className="text-[10px] text-slate-300 font-medium">Opens GPay app directly with ₹{grandTotal}</span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 shrink-0 text-slate-300" />
          </button>

          {/* Paytm / Any UPI App Direct Button */}
          <button
            type="button"
            onClick={() => handleDirectUpiPayment(paytmDeepLink, 'Paytm / UPI App')}
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg hover:scale-[1.01] active:scale-95 transition-all text-sm flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-emerald-100" />
              <span className="font-bold">Pay via Paytm / Any Installed UPI App</span>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-200" />
          </button>

        </div>

        {/* QR Code Section for Desktop / Secondary Scan */}
        <div className="pt-4 border-t border-slate-100 max-w-md mx-auto space-y-4">
          <div className="text-center space-y-1">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-center gap-1">
              <QrCode className="w-4 h-4 text-amber-500" /> Or Scan PhonePe QR to Pay Exact Money
            </h4>
            <p className="text-[11px] text-slate-500">Scan with PhonePe or Google Pay camera app</p>
          </div>

          <div className="relative inline-block border-4 border-amber-500 rounded-3xl p-3 bg-white shadow-xl max-w-[220px] mx-auto">
            <img 
              src={IMAGES.qrCode} 
              alt="PJR Swagrooha Foods PhonePe UPI QR" 
              className="w-48 h-48 object-contain rounded-2xl mx-auto"
            />
            <div className="mt-2 text-[10px] font-extrabold text-amber-700 uppercase tracking-wider flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> PhonePe / GPay UPI QR
            </div>
          </div>

          {/* PhonePe Number Display */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-left">
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">PhonePe / GPay Number</span>
              <span className="font-black text-slate-900 text-base">{phonePeNumber}</span>
            </div>
            <button
              type="button"
              onClick={copyNumber}
              className="bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 flex items-center gap-1 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 📲 CONFIRM ORDER & SEND DETAILS TO WHATSAPP BUTTON */}
        <div className="bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-500/80 max-w-md mx-auto space-y-4 text-left">
          <div className="flex items-center gap-2 text-emerald-950">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-black">Completed Payment? Confirm Order & Send WhatsApp Receipt</h4>
              <p className="text-xs text-emerald-700">Click below to save order & open WhatsApp chat with owner.</p>
            </div>
          </div>

          {utrError && (
            <div className="bg-red-100 text-red-700 p-2.5 rounded-xl text-xs font-bold">
              {utrError}
            </div>
          )}

          <form onSubmit={handleConfirmWithUtr} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> Optional: UPI UTR / Txn Ref Number
              </label>
              <input
                type="text"
                placeholder="e.g. 234567890123 (Optional)"
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                  setUtrError('');
                }}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span>{isSubmitting ? 'Saving Order...' : 'Confirm Order & Send on WhatsApp'}</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
