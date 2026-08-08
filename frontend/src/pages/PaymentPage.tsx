import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { IMAGES } from '../assets/images';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  MessageCircle, 
  ExternalLink,
  QrCode,
  Copy,
  Check,
  Sparkles,
  Hash,
  Phone
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
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');

  // Payment Account Details
  const upiNumber = '8125154114';
  const upiId = '8125154114@axl';
  const bankingName = 'Ganji Vishwateja';

  const copyNumber = () => {
    navigator.clipboard.writeText(upiNumber);
    setCopiedNumber(true);
    showToast('UPI Number (8125154114) copied!');
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  // Generate unique Order ID
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  // PhonePe Direct Payment Deep Link
  const payeeNameEncoded = encodeURIComponent(bankingName);
  const upiNoteEncoded = encodeURIComponent(`PJR Food Order ${orderId}`);
  const phonePeUrl = `phonepe://pay?pa=${upiId}&pn=${payeeNameEncoded}&am=${grandTotal}&cu=INR&tn=${upiNoteEncoded}`;

  // Manual Confirmation Form handler
  const handleConfirmWithUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError('');

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setUtrError('⚠️ Please enter your UTR / Transaction Reference Number.');
      return;
    }

    if (isUtrUsed(cleanUtr)) {
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
      utrNumber: cleanUtr,
      paymentMethod: 'UPI Scan & Pay',
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
          Step 2 of 2: Scan & Pay
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Scan QR & Pay</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Scan the QR code or use the number below to pay exactly <strong className="text-slate-900 font-black">₹{grandTotal}</strong> to <strong className="text-amber-700 font-black">{bankingName}</strong>.
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
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-purple-700/30 hover:scale-[1.02] active:scale-95 transition-all text-base flex items-center justify-between gap-3 border border-purple-500/40 no-underline"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">🟣</div>
              <div className="text-left">
                <span className="text-sm font-black block">Pay ₹{grandTotal} via PhonePe</span>
                <span className="text-[10px] text-purple-200 font-medium">Opens PhonePe → Pay to {bankingName} ({upiNumber})</span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 shrink-0 text-purple-200" />
          </a>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or scan manually</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* QR Code Section */}
        <div className="pt-2 max-w-md mx-auto space-y-4">
          <div className="text-center space-y-1">
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <QrCode className="w-5 h-5 text-amber-500" /> Scan QR Code to Pay
            </h4>
            <p className="text-[11px] text-slate-500">Open any UPI app and scan the code below</p>
          </div>

          <div className="relative inline-block border-4 border-amber-500 rounded-3xl p-3 bg-white shadow-xl max-w-[220px] mx-auto">
            <img 
              src={IMAGES.qrCode} 
              alt="PJR Swagrooha Foods UPI QR" 
              className="w-48 h-48 object-contain rounded-2xl mx-auto"
            />
            <div className="mt-2 text-[10px] font-extrabold text-amber-700 uppercase tracking-wider flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {bankingName}
            </div>
          </div>

          {/* UPI Phone Number */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-left">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">UPI Mobile Number</span>
                <span className="font-black text-slate-900 text-lg">{upiNumber}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={copyNumber}
              className="bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-300 flex items-center gap-1 shrink-0"
            >
              {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNumber ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* ✅ CONFIRM ORDER with UTR */}
        <div className="bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-500/80 max-w-md mx-auto space-y-4 text-left">
          <div className="flex items-center gap-2 text-emerald-950">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-black">Paid? Enter UTR to Confirm</h4>
              <p className="text-xs text-emerald-700">Enter your UTR / Transaction Reference Number from the payment receipt, then confirm to send your order to WhatsApp.</p>
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
                <Hash className="w-3.5 h-3.5 text-slate-400" /> UTR / Transaction Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 234567890123"
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                  setUtrError('');
                }}
                className="w-full px-3 py-2.5 text-sm font-mono font-bold bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <p className="text-[10px] text-slate-400">Find the UTR in your UPI app's transaction history.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span>{isSubmitting ? 'Saving Order...' : 'Confirm Order & Send to WhatsApp'}</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
