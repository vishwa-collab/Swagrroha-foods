import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { IMAGES } from '../assets/images';
import { 
  QrCode, 
  Copy, 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Phone,
  FileCheck,
  Lock,
  Hash,
  Info
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

  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [utrError, setUtrError] = useState('');

  const phonePeNumber = '8125154114';

  const copyNumber = () => {
    navigator.clipboard.writeText(phonePeNumber);
    setCopied(true);
    showToast('PhonePe / GPay number copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError('');

    const cleanUtr = utrNumber.trim();

    if (!cleanUtr) {
      setUtrError('Please enter your 12-digit UPI Transaction ID (UTR Number).');
      return;
    }

    if (cleanUtr.length < 10) {
      setUtrError('UTR / Transaction ID is too short. Standard UPI UTR numbers are 12 digits (e.g. 234567890123).');
      return;
    }

    if (isUtrUsed(cleanUtr)) {
      setUtrError('⚠️ Reusing UTR Numbers is strictly prohibited! This UTR has already been submitted for another order.');
      return;
    }

    setIsSubmitting(true);

    const orderId = 'PJR-' + Math.floor(100000 + Math.random() * 900000);

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
      paymentStatus: 'PENDING_VERIFICATION',
      utrNumber: cleanUtr,
      createdAt: new Date().toISOString(),
    };

    // Save order through context store & backend REST API
    const res = await addOrder(newOrder);

    if (!res.success) {
      setUtrError(res.message || 'Error submitting order UTR. Please check and try again.');
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
      
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('checkout')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Step 2 of 2: Pay via UPI & Submit UTR
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Scan, Pay & Submit UTR Number</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Scan PhonePe QR below or pay to <strong className="text-slate-900 font-black">8125154114</strong>, then enter your 12-digit UTR Transaction ID.
        </p>
      </div>

      {/* No COD Warning Banner */}
      <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200 flex items-center justify-center gap-2 text-xs font-bold text-amber-900 text-center">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>⚠️ Cash on Delivery (COD) is Not Available. Pay via PhonePe / GPay and enter UTR to confirm order.</span>
      </div>

      {/* Main Payment Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center">
        
        {/* Total Amount Badge */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl max-w-sm mx-auto space-y-1 shadow-md">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-300">Exact Payment Amount</span>
          <p className="text-3xl font-black text-white">₹{grandTotal}</p>
          <p className="text-[11px] text-slate-400">Includes Items ₹{subtotal} + Delivery ({selectedArea.name}) ₹{deliveryCharge}</p>
        </div>

        {/* PhonePe QR Code Display */}
        <div className="relative inline-block border-4 border-brand-500 rounded-3xl p-3 bg-white shadow-xl max-w-[260px] mx-auto">
          <img 
            src={IMAGES.qrCode} 
            alt="PJR Swagrooha Foods PhonePe UPI QR" 
            className="w-56 h-56 object-contain rounded-2xl mx-auto"
          />
          <div className="mt-2 text-[11px] font-extrabold text-brand-600 uppercase tracking-wider flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> PhonePe / GPay Scanner
          </div>
        </div>

        {/* PhonePe Number Copy Block */}
        <div className="max-w-sm mx-auto bg-brand-50/80 p-3.5 rounded-2xl border border-brand-200 flex items-center justify-between gap-3 shadow-sm">
          <div className="text-left overflow-hidden">
            <span className="text-[10px] font-extrabold text-brand-700 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3 text-brand-600" /> PhonePe / GPay Number
            </span>
            <span className="font-black text-slate-900 text-lg tracking-wider block">{phonePeNumber}</span>
          </div>
          <button
            onClick={copyNumber}
            type="button"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* MANDATORY UTR TRANSACTION ID FORM BLOCK */}
        <form onSubmit={handlePaidSubmit} className="max-w-md mx-auto bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 text-left border border-slate-800">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Hash className="w-4 h-4 text-amber-400" />
              Enter UPI Transaction ID (UTR) <span className="text-red-400">*</span>
            </h4>
            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded uppercase">
              Mandatory
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            After paying ₹{grandTotal} on PhonePe or GPay, open payment details and copy the <strong className="text-amber-300">12-Digit UTR Number / Transaction ID</strong> (e.g. <strong className="text-white font-mono">234567890123</strong>).
          </p>

          {/* SAFETY / FRAUD WARNING MESSAGE */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-[11px] font-bold text-amber-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              ⚠️ <strong>Important Owner Safety Rule:</strong> Please enter the correct UTR number. Fake or duplicate payment details will lead to immediate order cancellation.
            </span>
          </div>

          {utrError && (
            <div className="bg-red-500/20 text-red-300 p-3 rounded-xl border border-red-500/40 text-xs font-bold">
              {utrError}
            </div>
          )}

          {/* UTR Input Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              12-Digit UTR / Transaction Ref Number
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                required
                maxLength={18}
                placeholder="e.g. 234567890123"
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                  setUtrError('');
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 text-amber-300 font-mono font-black text-sm rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-600 tracking-wider"
              />
            </div>
            <p className="text-[10px] text-slate-400">Found in PhonePe ➔ History ➔ Payment Details ➔ UTR / Transaction ID</p>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? 'Verifying UTR...' : 'Submit UTR & Confirm Order'}</span>
          </button>

        </form>

      </div>

    </div>
  );
};
