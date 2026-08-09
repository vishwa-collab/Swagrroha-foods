import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Hash,
  Copy,
  Check,
  MessageCircle,
  PhoneCall
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
  const [appClicked, setAppClicked] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  const [upiCopied, setUpiCopied] = useState(false);

  // Owner UPI & Contact Info
  const upiNumber = '8125154114';
  const upiId = '8125154114@ybl';
  const bankingName = 'PJR Swagrooha Foods';

  // Unique Order ID
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  // Direct UPI Intent Link (Works for PhonePe & Google Pay)
  const upiIntentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(bankingName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('Order ' + orderId)}`;

  const handleAppClick = () => {
    setAppClicked(true);
    showToast('Opening payment app... Pay ₹' + grandTotal + ' to ' + bankingName);
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setUpiCopied(true);
    showToast('UPI ID (8125154114@ybl) copied to clipboard!');
    setTimeout(() => setUpiCopied(false), 2500);
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setUtrError('Please enter your 12-digit UTR / Transaction ID from PhonePe or Google Pay.');
      return;
    }

    if (cleanUtr.length < 6) {
      setUtrError('Please enter a valid Transaction ID / UTR number.');
      return;
    }

    setIsSubmitting(true);
    setUtrError('');

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
      paymentMethod: 'PhonePe / GPay Direct',
      utrNumber: cleanUtr,
      createdAt: new Date().toISOString(),
    };

    const addRes = await addOrder(newOrder);
    if (!addRes.success) {
      setUtrError(addRes.message || 'Error confirming order.');
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
          Step 2 of 2: PhonePe / Google Pay
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Pay via PhonePe or Google Pay</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Pay directly to <strong className="text-slate-900 font-black">{bankingName}</strong> ({upiNumber}). Enter Transaction ID to instantly get WhatsApp receipt!
        </p>
      </div>

      {/* Main Payment Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center max-w-md mx-auto">
        
        {/* Exact Payable Amount Badge */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl mx-auto space-y-1 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 block">Total Amount Payable</span>
          <p className="text-5xl font-black text-white py-2">₹{grandTotal}</p>
          <p className="text-[11px] text-slate-400">Order #{orderId} • Items (₹{subtotal}) + Delivery (₹{deliveryCharge})</p>
        </div>

        {/* UPI Details Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">UPI / Phone Number</span>
            <button
              onClick={copyUpiId}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-all"
            >
              {upiCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{upiCopied ? 'Copied' : 'Copy UPI ID'}</span>
            </button>
          </div>
          <p className="font-mono font-black text-slate-900 text-base">{upiId}</p>
          <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" /> Number: <strong className="text-slate-900">{upiNumber}</strong> ({bankingName})
          </p>
        </div>

        {/* STEP 1: Pay Buttons */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 justify-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${appClicked ? 'bg-emerald-500 text-white' : 'bg-purple-700 text-white'}`}>
              {appClicked ? '✓' : '1'}
            </div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Step 1: Open Payment App</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PhonePe Button */}
            <a
              href={upiIntentUrl}
              onClick={handleAppClick}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black py-4 px-4 rounded-2xl shadow-lg shadow-purple-700/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 no-underline border border-purple-500/40"
            >
              <span className="text-base">🟣</span>
              <span>Pay via PhonePe</span>
              <ExternalLink className="w-4 h-4 text-purple-200" />
            </a>

            {/* Google Pay Button */}
            <a
              href={upiIntentUrl}
              onClick={handleAppClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-4 rounded-2xl shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 no-underline border border-blue-400/40"
            >
              <span className="text-base">🔵</span>
              <span>Pay via Google Pay</span>
              <ExternalLink className="w-4 h-4 text-blue-200" />
            </a>
          </div>
        </div>

        {/* STEP 2: Enter UTR / Transaction ID */}
        <div className="pt-2 text-left space-y-3">
          <div className="flex items-center gap-2 justify-center mb-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${utrNumber.trim() ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
              2
            </div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Step 2: Enter Transaction ID (UTR)</span>
          </div>

          <div className="bg-amber-50 rounded-3xl p-5 border-2 border-amber-300 space-y-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                After paying ₹<strong>{grandTotal}</strong> in PhonePe / GPay, copy the 12-digit <strong>UTR / Transaction ID</strong> from app history and paste it below.
              </p>
            </div>

            {utrError && (
              <div className="bg-red-100 text-red-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-red-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {utrError}
              </div>
            )}

            <form onSubmit={handleConfirmOrder} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-amber-600" /> UTR / Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 345678901234"
                  value={utrNumber}
                  onChange={(e) => {
                    setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                    setUtrError('');
                  }}
                  className="w-full px-3.5 py-3 text-sm font-mono font-bold bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !utrNumber.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                <span>{isSubmitting ? 'Confirming Order...' : 'Confirm Order & Get WhatsApp Receipt'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};

