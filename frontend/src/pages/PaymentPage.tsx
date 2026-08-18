import React, { useState } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { IMAGES } from '../assets/images';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  Hash,
  Copy,
  Check,
  MessageCircle,
  PhoneCall,
  QrCode,
  Upload,
  Image as ImageIcon,
  X,
  FileCheck
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

  // Use the delivery slot the customer chose on CheckoutPage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chosenDeliveryDate = (customerDetails as any)._deliveryDate || deliveryDateInfo;

  const [paymentOption, setPaymentOption] = useState<'screenshot' | 'utr'>('screenshot');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Option 1 State (Screenshot Upload)
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [screenshotError, setScreenshotError] = useState<string>('');

  // Option 2 State (UTR Number)
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');

  const [upiCopied, setUpiCopied] = useState(false);

  // Owner UPI & Contact Info
  const upiNumber = '8125154114';
  const upiId = '8125154114@ybl';
  const bankingName = 'PJR Swagrooha Foods';

  // Unique Order ID
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setUpiCopied(true);
    showToast('UPI ID (8125154114@ybl) copied to clipboard!');
    setTimeout(() => setUpiCopied(false), 2500);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScreenshotError('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setScreenshotError('Image file is too large. Please select a screenshot under 10MB.');
      return;
    }

    setScreenshotError('');
    setScreenshotName(file.name);

    // Compress & Convert to Base64 using Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
          setScreenshotBase64(dataUrl);
        } else {
          setScreenshotBase64(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotBase64(null);
    setScreenshotName('');
    setScreenshotError('');
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalUtr = '';
    let finalProof = '';

    if (paymentOption === 'screenshot') {
      // Option 1: Screenshot
      if (!screenshotBase64) {
        setScreenshotError('Please select and upload your payment success screenshot.');
        return;
      }
      finalProof = screenshotBase64;
      finalUtr = utrNumber.trim() || 'SCREENSHOT_PROVED';
    } else {
      // Option 2: UTR Number
      const cleanUtr = utrNumber.trim();
      const utrPattern = /^\d{8,22}$/;
      if (!cleanUtr) {
        setUtrError('Please enter your 12‑digit UTR / Transaction ID from PhonePe, GPay, or Paytm.');
        return;
      }
      if (!utrPattern.test(cleanUtr)) {
        setUtrError('UTR must contain only numbers and be 8 to 22 digits long.');
        return;
      }
      finalUtr = cleanUtr;
    }

    setIsSubmitting(true);
    setUtrError('');
    setScreenshotError('');

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
      paymentMethod: paymentOption === 'screenshot' ? 'Payment Screenshot Proof' : 'UPI UTR Verification',
      utrNumber: finalUtr,
      paymentProof: finalProof,
      createdAt: new Date().toISOString(),
    };

    // ── Build WhatsApp message BEFORE any await so popup is not browser-blocked ──
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
      `💳 *Payment Method:* ${paymentOption === 'screenshot' ? 'Paid ✅ (Screenshot Uploaded)' : `Paid ✅ (UTR: ${finalUtr})`}\n\n` +
      `_Thank you for ordering with PJR Swagrooha Foods!_`;

    // Open owner WhatsApp immediately
    const waWindow = window.open(`https://wa.me/918125154114?text=${encodeURIComponent(waText)}`, '_blank');

    // ── Save order to backend ──
    const addRes = await addOrder(newOrder);
    if (!addRes.success) {
      const err = addRes.message || 'Unable to place your order. Please try again.';
      if (paymentOption === 'screenshot') {
        setScreenshotError(err);
      } else {
        setUtrError(err);
      }
      showToast(err);
      setIsSubmitting(false);
      if (waWindow) waWindow.close();
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
          Scan QR &amp; Pay
        </span>
      </div>

      {/* Title Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Scan &amp; Pay via PhonePe / GPay</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Scan the QR Code photo or pay to <strong className="text-slate-900 font-black">{upiNumber}</strong>. Submit Screenshot or UTR to complete order.
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

        {/* PROMINENT SCANNER QR PHOTO */}
        <div className="bg-gradient-to-b from-slate-50 to-emerald-50/50 p-6 rounded-3xl border-2 border-emerald-500/30 space-y-4 shadow-inner">
          <div className="flex items-center justify-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
            <QrCode className="w-5 h-5 text-emerald-600" />
            Official UPI Scanner QR Photo
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-md inline-block border border-slate-200">
            <img 
              src={IMAGES.qrCode} 
              alt="PJR Swagrooha Foods QR Code Scanner" 
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl mx-auto"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-bold block">Accepts PhonePe, GPay, Paytm, BHIM &amp; all UPI Apps</span>
            <span className="text-xs font-black text-slate-900 block">{bankingName}</span>
          </div>
        </div>

        {/* Phone Number & UPI ID Card */}
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
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" /> PhonePe / GPay Number: <strong className="text-slate-900 font-black">{upiNumber}</strong>
          </p>
        </div>

        {/* PAYMENT VERIFICATION OPTION SELECTOR TABS */}
        <div className="space-y-4 pt-2 text-left">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block text-center">
            Choose Payment Proof Method:
          </label>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setPaymentOption('screenshot')}
              className={`py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                paymentOption === 'screenshot'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Option 1: Screenshot</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentOption('utr')}
              className={`py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                paymentOption === 'utr'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Option 2: UTR Number</span>
            </button>
          </div>

          <form onSubmit={handleConfirmOrder} className="space-y-4">

            {/* ── OPTION 1: UPLOAD PAYMENT SCREENSHOT ── */}
            {paymentOption === 'screenshot' && (
              <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-emerald-300 space-y-4">
                <div className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                    Customer pays through PhonePe/GPay ➔ Upload payment-success screenshot below. Owner will verify amount in PhonePe/bank account.
                  </p>
                </div>

                {screenshotError && (
                  <div className="bg-red-100 text-red-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {screenshotError}
                  </div>
                )}

                {!screenshotBase64 ? (
                  <label className="border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-white rounded-2xl p-6 text-center block cursor-pointer transition-all hover:bg-emerald-50/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                    <span className="text-xs font-extrabold text-slate-800 block">Click to Upload Payment Screenshot</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Supports PNG, JPG, JPEG, WEBP (PhonePe / GPay)</span>
                  </label>
                ) : (
                  <div className="bg-white p-3 rounded-2xl border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        {screenshotName || 'Screenshot Uploaded'}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-all"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-slate-200 max-h-48 flex justify-center bg-slate-50">
                      <img
                        src={screenshotBase64}
                        alt="Payment Screenshot Proof"
                        className="object-contain max-h-48"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Optional UTR / Note
                  </label>
                  <input
                    type="text"
                    placeholder="Optional 12-digit UTR if available"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* ── OPTION 2: 12-DIGIT UTR INPUT ── */}
            {paymentOption === 'utr' && (
              <div className="bg-amber-50 rounded-3xl p-5 border-2 border-amber-300 space-y-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    After transferring ₹<strong>{grandTotal}</strong> via PhonePe or GPay, copy the 12-digit <strong>UTR / Transaction ID</strong> from payment history and paste below.
                  </p>
                </div>

                {utrError && (
                  <div className="bg-red-100 text-red-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {utrError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-amber-600" /> 12-Digit UTR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 405678901234"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                      setUtrError('');
                    }}
                    className="w-full px-3.5 py-3 text-sm font-mono font-bold bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting || (paymentOption === 'screenshot' ? !screenshotBase64 : !utrNumber.trim())}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span>
                {isSubmitting
                  ? 'Verifying & Submitting Order...'
                  : 'Submit Order & Get WhatsApp Receipt'
                }
              </span>
            </button>

          </form>
        </div>

      </div>

    </div>
  );
};
