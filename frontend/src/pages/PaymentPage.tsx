import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { IMAGES } from '../assets/images';
import { 
  CreditCard, 
  ShieldCheck, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  QrCode, 
  Copy, 
  Check, 
  Phone, 
  Lock, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Hash
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
    createRazorpayOrder,
    verifyRazorpayPayment,
    isUtrUsed,
    clearCart,
    showToast
  } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showManualUtr, setShowManualUtr] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const phonePeNumber = '8125154114';

  const copyNumber = () => {
    navigator.clipboard.writeText(phonePeNumber);
    setCopied(true);
    showToast('PhonePe / GPay number copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  // 🚀 MAIN RAZORPAY CHECKOUT HANDLER
  const handleRazorpayPayment = async () => {
    setErrorMessage('');
    setIsProcessing(true);

    const tempOrderId = 'PJR-' + Math.floor(100000 + Math.random() * 900000);

    const draftOrder: PlacedOrder = {
      orderId: tempOrderId,
      customer: customerDetails,
      area: selectedArea,
      items: cart,
      subtotal,
      deliveryCharge,
      totalAmount: grandTotal,
      deliveryDate: deliveryDateInfo,
      status: 'PLACED',
      paymentStatus: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Create order on backend API
      const rzpRes = await createRazorpayOrder(grandTotal, tempOrderId);

      if (!rzpRes.success || !rzpRes.razorpayOrderId) {
        setErrorMessage(rzpRes.error || 'Failed to initialize payment gateway. Please try again.');
        setIsProcessing(false);
        return;
      }

      // If Razorpay SDK script is loaded in window
      if (window.Razorpay) {
        const options = {
          key: rzpRes.keyId || 'rzp_test_demo_key',
          amount: grandTotal * 100,
          currency: 'INR',
          name: 'PJR Swagrooha Foods',
          description: `Order ${tempOrderId} - Scheduled Delivery`,
          image: IMAGES.logo,
          order_id: rzpRes.razorpayOrderId,
          handler: async (response: any) => {
            showToast('Verifying payment details...');
            
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id || rzpRes.razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || '',
              order: draftOrder
            });

            if (verifyRes.success) {
              clearCart();
              showToast('Payment Successful! Order Confirmed ✅');
              setIsProcessing(false);
              setActiveTab('confirmation');
            } else {
              setErrorMessage(verifyRes.error || 'Payment verification failed. Please contact support.');
              setIsProcessing(false);
            }
          },
          prefill: {
            name: customerDetails.name,
            contact: customerDetails.phone,
          },
          theme: {
            color: '#f59e0b',
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              showToast('Payment cancelled');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setIsProcessing(false);
          setErrorMessage(`Payment failed: ${response.error.description || 'Transaction unsuccessful'}`);
        });
        rzp.open();
      } else {
        // Fallback demo simulator if SDK script is blocked or offline
        showToast('Processing demo Razorpay transaction...');
        setTimeout(async () => {
          const verifyRes = await verifyRazorpayPayment({
            razorpay_order_id: rzpRes.razorpayOrderId || `order_demo_${Date.now()}`,
            razorpay_payment_id: `pay_demo_${Date.now()}`,
            razorpay_signature: 'demo_signature',
            order: draftOrder
          });

          if (verifyRes.success) {
            clearCart();
            showToast('Payment Successful! Order Confirmed ✅');
            setIsProcessing(false);
            setActiveTab('confirmation');
          } else {
            setErrorMessage('Payment verification failed');
            setIsProcessing(false);
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error('Razorpay payment error:', err);
      setErrorMessage('Unexpected error opening Razorpay payment popup. Please try again.');
      setIsProcessing(false);
    }
  };

  // Legacy Manual UTR Submit fallback
  const handleManualUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 10) {
      setErrorMessage('Please enter a valid 12-digit UPI UTR Transaction ID.');
      return;
    }

    if (isUtrUsed(cleanUtr)) {
      setErrorMessage('⚠️ This UTR has already been submitted for another order.');
      return;
    }

    setIsProcessing(true);
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

    const res = await addOrder(newOrder);
    if (!res.success) {
      setErrorMessage(res.message || 'Error submitting order UTR.');
      setIsProcessing(false);
      return;
    }

    clearCart();
    setIsProcessing(false);
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
          Back to Customer Details
        </button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Step 2 of 2: Instant Secure Payment
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Pay & Confirm Your Order</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Fast & secure payment powered by <strong className="text-slate-900 font-extrabold">Razorpay Payment Gateway</strong>
        </p>
      </div>

      {/* Main Payment Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center">
        
        {/* Total Amount Badge */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl max-w-sm mx-auto space-y-1 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400">Total Payable Amount</span>
          <p className="text-4xl font-black text-white">₹{grandTotal}</p>
          <p className="text-[11px] text-slate-400">Items (₹{subtotal}) + Delivery to {selectedArea.name} (₹{deliveryCharge})</p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 🌟 RECOMMENDED RAZORPAY PAYMENT GATEWAY BUTTON */}
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={handleRazorpayPayment}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all text-base flex items-center justify-center gap-3 border border-amber-400/30 disabled:opacity-75"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting to Razorpay...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 text-amber-100" />
                <span>Pay ₹{grandTotal} Now via Razorpay</span>
              </>
            )}
          </button>

          {/* Payment Method Badges */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Supported Payment Options</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="bg-white text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1">
                📱 Google Pay
              </span>
              <span className="bg-white text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1">
                🟣 PhonePe
              </span>
              <span className="bg-white text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1">
                💙 Paytm / BHIM UPI
              </span>
              <span className="bg-white text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1">
                💳 Cards & Netbanking
              </span>
            </div>
          </div>
        </div>

        {/* Security & Automation Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left">
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-black text-emerald-950">Instant Confirmation</h5>
              <p className="text-[10px] text-emerald-700 font-medium">Automatic payment verification & instant WhatsApp receipt sent to backend.</p>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-black text-blue-950">100% Bank Encrypted</h5>
              <p className="text-[10px] text-blue-700 font-medium">Secured by 256-bit SSL encryption via Razorpay RBI compliant gateway.</p>
            </div>
          </div>
        </div>

        {/* Expandable Manual QR Scan & UTR Entry Fallback */}
        <div className="pt-4 border-t border-slate-100 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setShowManualUtr(!showManualUtr)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Alternative: Direct PhonePe QR Scan / Manual UTR</span>
            {showManualUtr ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showManualUtr && (
            <div className="mt-4 p-5 bg-slate-50 rounded-3xl border border-slate-200 text-left space-y-4">
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-600 font-medium">Scan QR or pay to <strong>8125154114</strong>, then submit your 12-digit UTR below:</p>
                
                <div className="relative inline-block border-2 border-amber-500 rounded-2xl p-2 bg-white shadow-md max-w-[200px] mx-auto">
                  <img src={IMAGES.qrCode} alt="PhonePe QR" className="w-44 h-44 object-contain rounded-xl mx-auto" />
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-800">PhonePe / GPay: {phonePeNumber}</span>
                  <button
                    onClick={copyNumber}
                    type="button"
                    className="text-[11px] font-bold text-amber-600 flex items-center gap-1 hover:text-amber-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleManualUtrSubmit} className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">12-Digit UTR Transaction ID</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 234567890123"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl shadow-md"
                >
                  Submit UTR & Confirm
                </button>
              </form>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
