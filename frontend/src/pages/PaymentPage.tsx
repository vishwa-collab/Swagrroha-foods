import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  MessageCircle, 
  ExternalLink,
  Sparkles,
  Hash,
  AlertCircle
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
  const [phonePeOpened, setPhonePeOpened] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');

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
    setPhonePeOpened(true);
    showToast(`Opening PhonePe to pay ₹${grandTotal} to ${bankingName}...`);
  };

  // After payment, confirm order with UTR and send to WhatsApp
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError('');

    const cleanUtr = utrNumber.trim();

    if (!cleanUtr) {
      setUtrError('Please enter your UTR / Transaction ID from PhonePe payment receipt.');
      return;
    }

    if (cleanUtr.length < 6) {
      setUtrError('UTR number seems too short. Please enter the full transaction reference.');
      return;
    }

    if (isUtrUsed(cleanUtr)) {
      setUtrError('This UTR has already been used for another order.');
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
      paymentMethod: 'PhonePe',
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
          Step 2 of 2: Pay via PhonePe
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Pay via PhonePe</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Tap the button below to open PhonePe and pay <strong className="text-slate-900 font-black">₹{grandTotal}</strong> to <strong className="text-purple-700 font-black">{bankingName}</strong>. After payment, enter UTR to get your WhatsApp receipt.
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

        {/* STEP 1: PhonePe Pay Button */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${phonePeOpened ? 'bg-emerald-500 text-white' : 'bg-purple-700 text-white'}`}>
              {phonePeOpened ? '✓' : '1'}
            </div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Pay on PhonePe</span>
          </div>
          <a
            href={phonePeUrl}
            onClick={handlePhonePeClick}
            className={`w-full font-black py-5 px-6 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-base flex items-center justify-between gap-3 border no-underline ${
              phonePeOpened
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400/40 shadow-emerald-600/30'
                : 'bg-purple-700 hover:bg-purple-800 text-white border-purple-500/40 shadow-purple-700/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                {phonePeOpened ? '✅' : '🟣'}
              </div>
              <div className="text-left">
                <span className="text-base font-black block">
                  {phonePeOpened ? `PhonePe Opened — Pay ₹${grandTotal}` : `Pay ₹${grandTotal} via PhonePe`}
                </span>
                <span className={`text-[10px] font-medium ${phonePeOpened ? 'text-emerald-200' : 'text-purple-200'}`}>
                  {phonePeOpened ? 'Complete payment in PhonePe, then enter UTR below' : `Opens PhonePe → Pay to ${bankingName} (${upiNumber})`}
                </span>
              </div>
            </div>
            <ExternalLink className={`w-5 h-5 shrink-0 ${phonePeOpened ? 'text-emerald-200' : 'text-purple-200'}`} />
          </a>
        </div>

        {/* STEP 2: Enter UTR after payment */}
        <div className={`max-w-md mx-auto transition-all duration-500 ${phonePeOpened ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2 pointer-events-none'}`}>
          <div className="flex items-center gap-2 justify-center mb-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${phonePeOpened ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-500'}`}>
              2
            </div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Enter Transaction ID (UTR)</span>
          </div>

          <div className="bg-amber-50 rounded-3xl p-6 border-2 border-amber-400/60 space-y-4 text-left">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-slate-900">Enter UTR to verify payment</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  Open PhonePe → Transaction History → Find the payment → Copy the <strong>UTR / Transaction ID</strong> and paste it below.
                </p>
              </div>
            </div>

            {utrError && (
              <div className="bg-red-100 text-red-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {utrError}
              </div>
            )}

            <form onSubmit={handleConfirmOrder} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" /> UTR / Transaction ID <span className="text-red-500">*</span>
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
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !utrNumber.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                <span>{isSubmitting ? 'Verifying & Saving...' : 'Confirm Payment & Send WhatsApp Receipt'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
