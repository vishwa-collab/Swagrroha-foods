import React, { useState, useRef } from 'react';
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
  FileCheck,
  Eye,
  CheckCircle2,
  RefreshCw,
  Maximize2,
  Smartphone,
  Zap,
  Lock
} from 'lucide-react';

// Razorpay loaded via CDN in index.html
declare global {
  interface Window {
    Razorpay: any;
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://swagrroha-foods.onrender.com';

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

  const [paymentOption, setPaymentOption] = useState<'razorpay' | 'screenshot' | 'utr'>('razorpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [razorpayError, setRazorpayError] = useState('');
  
  // Option: Screenshot Upload
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [screenshotSize, setScreenshotSize] = useState<string>('');
  const [screenshotTime, setScreenshotTime] = useState<string>('');
  const [screenshotError, setScreenshotError] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Option: UTR Number
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScreenshotError('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setScreenshotError('Image file is too large. Please select a screenshot under 100MB.');
      return;
    }
    setScreenshotError('');
    setIsProcessingImage(true);
    setScreenshotName(file.name);
    setScreenshotSize(formatFileSize(file.size));
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setScreenshotTime(nowTime);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
          else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setScreenshotBase64(canvas.toDataURL('image/jpeg', 0.90));
        } else {
          setScreenshotBase64(event.target?.result as string);
        }
        setIsProcessingImage(false);
        showToast(`Payment screenshot attached successfully (${formatFileSize(file.size)})! ✅`);
      };
      img.onerror = () => { setIsProcessingImage(false); setScreenshotError('Unable to process this image.'); };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => { setIsProcessingImage(false); setScreenshotError('Failed to read image file.'); };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotBase64(null);
    setScreenshotName('');
    setScreenshotSize('');
    setScreenshotTime('');
    setScreenshotError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── RAZORPAY UPI INTENT PAYMENT ──
  const handleRazorpayPayment = async () => {
    setRazorpayError('');
    setIsSubmitting(true);

    try {
      // 1. Create Razorpay order on backend
      const orderRes = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Could not create payment order.');
      }

      const { orderId: rzpOrderId, keyId } = await orderRes.json();

      // 2. Open Razorpay UPI Intent checkout
      const options = {
        key: keyId,
        amount: grandTotal * 100,
        currency: 'INR',
        name: 'PJR Swagrooha Foods',
        description: `Order ${orderId} — ${bankingName}`,
        image: IMAGES.logo,
        order_id: rzpOrderId,
        prefill: {
          name: customerDetails.name,
          contact: customerDetails.phone || upiNumber,
          email: customerDetails.email || '',
          method: 'upi',
        },
        // Show ONLY UPI apps — PhonePe, GPay, Paytm, BHIM
        config: {
          display: {
            blocks: {
              upi_apps: {
                name: 'Pay via UPI App',
                instruments: [
                  { method: 'upi', flows: ['intent', 'qr'] },
                ],
              },
            },
            sequence: ['block.upi_apps'],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async function (response: any) {
          // 3. Verify payment on backend
          try {
            const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: grandTotal,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              setRazorpayError('Payment verification failed. Please contact support.');
              setIsSubmitting(false);
              return;
            }

            // 4. Save order to backend
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
              paymentStatus: 'PAID_VIA_RAZORPAY',
              paymentMethod: 'Razorpay UPI Intent',
              utrNumber: response.razorpay_payment_id,
              createdAt: new Date().toISOString(),
            };

            const addRes = await addOrder(newOrder);
            if (!addRes.success) {
              setRazorpayError(addRes.message || 'Order save failed. Please contact support.');
              setIsSubmitting(false);
              return;
            }

            clearCart();
            showToast('🎉 Payment successful! Order placed.');
            setActiveTab('confirmation');
          } catch (err: any) {
            setRazorpayError('Payment verification error: ' + err.message);
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            showToast('Payment cancelled. Please try again.');
          },
        },
        theme: { color: '#FF6B35' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setRazorpayError('Payment failed: ' + (response.error?.description || 'Unknown error'));
        setIsSubmitting(false);
      });
      rzp.open();

    } catch (err: any) {
      setRazorpayError(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ── UPI/SCREENSHOT ORDER SUBMISSION ──
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalUtr = '';
    let finalProof = '';

    if (paymentOption === 'screenshot') {
      if (!screenshotBase64) { setScreenshotError('Please select and upload your payment success screenshot.'); return; }
      finalProof = screenshotBase64;
      finalUtr = utrNumber.trim() || 'SCREENSHOT_PROVED';
    } else {
      const cleanUtr = utrNumber.trim();
      const utrPattern = /^\d{8,22}$/;
      if (!cleanUtr) { setUtrError('Please enter your 12‑digit UTR / Transaction ID.'); return; }
      if (!utrPattern.test(cleanUtr)) { setUtrError('UTR must contain only numbers and be 8 to 22 digits long.'); return; }
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

    const waWindow = window.open(`https://wa.me/918125154114?text=${encodeURIComponent(waText)}`, '_blank');

    const addRes = await addOrder(newOrder);
    if (!addRes.success) {
      const err = addRes.message || 'Unable to place your order. Please try again.';
      if (paymentOption === 'screenshot') setScreenshotError(err);
      else setUtrError(err);
      showToast(err);
      setIsSubmitting(false);
      if (waWindow) waWindow.close();
      return;
    }

    clearCart();
    setIsSubmitting(false);
    setActiveTab('confirmation');
  };

  if (cart.length === 0) { setActiveTab('cart'); return null; }

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
          100% Secure Payment
        </span>
      </div>

      {/* Title Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Choose Your Payment Method</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Pay securely via UPI apps (PhonePe, GPay) or scan the QR code below.
        </p>
      </div>

      {/* Amount Badge */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl mx-auto max-w-md text-center space-y-1 shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>
        <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 block">Total Amount Payable</span>
        <p className="text-5xl font-black text-white py-2">₹{grandTotal}</p>
        <p className="text-[11px] text-slate-400">Order #{orderId} • Items (₹{subtotal}) + Delivery (₹{deliveryCharge})</p>
      </div>

      {/* ── PAYMENT METHOD SELECTOR ── */}
      <div className="max-w-md mx-auto space-y-3">
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block text-center">
          Choose Payment Method:
        </label>

        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          {/* Option 1: Razorpay UPI Intent */}
          <button
            type="button"
            onClick={() => setPaymentOption('razorpay')}
            className={`py-3 px-2 rounded-xl font-extrabold text-[11px] flex flex-col items-center justify-center gap-1 transition-all ${
              paymentOption === 'razorpay'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>PhonePe / GPay</span>
          </button>

          {/* Option 2: Screenshot */}
          <button
            type="button"
            onClick={() => setPaymentOption('screenshot')}
            className={`py-3 px-2 rounded-xl font-extrabold text-[11px] flex flex-col items-center justify-center gap-1 transition-all ${
              paymentOption === 'screenshot'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Screenshot</span>
          </button>

          {/* Option 3: UTR */}
          <button
            type="button"
            onClick={() => setPaymentOption('utr')}
            className={`py-3 px-2 rounded-xl font-extrabold text-[11px] flex flex-col items-center justify-center gap-1 transition-all ${
              paymentOption === 'utr'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>UTR Number</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-4">

        {/* ── RAZORPAY UPI INTENT PANEL ── */}
        {paymentOption === 'razorpay' && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 border-2 border-orange-300 space-y-5 shadow-sm">
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shrink-0 shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">Instant UPI Payment</h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Click below → Choose PhonePe or GPay → Exact <strong>₹{grandTotal}</strong> pre-filled → Enter UPI PIN → Done ✅
                </p>
              </div>
            </div>

            {/* Supported UPI Apps */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { name: 'PhonePe', color: 'bg-purple-600', emoji: '📱' },
                { name: 'GPay', color: 'bg-blue-600', emoji: '🔵' },
                { name: 'Paytm', color: 'bg-sky-500', emoji: '💙' },
                { name: 'BHIM', color: 'bg-orange-600', emoji: '🇮🇳' },
              ].map(app => (
                <div key={app.name} className="bg-white rounded-xl p-2 border border-slate-200 shadow-sm">
                  <span className="text-xl block">{app.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-700 block mt-0.5">{app.name}</span>
                </div>
              ))}
            </div>

            {/* UPI ID reference */}
            <div className="bg-white rounded-2xl p-3 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Paying to</span>
                <p className="font-mono font-black text-slate-900 text-sm">{upiId}</p>
                <p className="text-[11px] text-slate-500">{bankingName}</p>
              </div>
              <Lock className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>

            {razorpayError && (
              <div className="bg-red-100 text-red-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{razorpayError}</span>
              </div>
            )}

            {/* PAY NOW BUTTON */}
            <button
              type="button"
              onClick={handleRazorpayPayment}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Smartphone className="w-5 h-5" />
              <span>
                {isSubmitting ? 'Opening Payment...' : `Pay ₹${grandTotal} via PhonePe / GPay`}
              </span>
            </button>

            <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Secured by Razorpay • 256-bit SSL Encryption
            </p>
          </div>
        )}

        {/* ── SCREENSHOT + UTR: Show QR code when these options selected ── */}
        {(paymentOption === 'screenshot' || paymentOption === 'utr') && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-5 text-center">

            {/* QR Code */}
            <div className="bg-gradient-to-b from-slate-50 to-emerald-50/50 p-5 rounded-3xl border-2 border-emerald-500/30 space-y-3 shadow-inner">
              <div className="flex items-center justify-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
                <QrCode className="w-5 h-5 text-emerald-600" />
                Official UPI Scanner QR Photo
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-md inline-block border border-slate-200">
                <img 
                  src={IMAGES.qrCode} 
                  alt="PJR Swagrooha Foods QR Code Scanner" 
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl mx-auto"
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 font-bold block">Accepts PhonePe, GPay, Paytm, BHIM &amp; all UPI Apps</span>
                <span className="text-xs font-black text-slate-900 block">{bankingName}</span>
              </div>
            </div>

            {/* UPI ID Card */}
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

            {/* Form for Screenshot or UTR */}
            <form onSubmit={handleConfirmOrder} className="space-y-4 text-left">

              {/* ── SCREENSHOT UPLOAD ── */}
              {paymentOption === 'screenshot' && (
                <div className="bg-emerald-50/80 rounded-3xl p-5 border-2 border-emerald-300/80 space-y-4 shadow-sm">
                  <div className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                      Pay via QR/UPI above → Upload your payment screenshot below.
                    </p>
                  </div>

                  {screenshotError && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-200">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{screenshotError}</span>
                    </div>
                  )}

                  {isProcessingImage && (
                    <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-emerald-400 text-center space-y-2 animate-pulse">
                      <RefreshCw className="w-7 h-7 mx-auto text-emerald-600 animate-spin" />
                      <p className="text-xs font-black text-slate-800">Processing Screenshot...</p>
                    </div>
                  )}

                  {!screenshotBase64 && !isProcessingImage && (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDragging ? 'border-emerald-600 bg-emerald-100/70 scale-[1.02]' : 'border-emerald-400 hover:border-emerald-600 bg-white hover:bg-emerald-50/50 shadow-sm'
                      }`}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-800 block">Click to Browse or Drag &amp; Drop Screenshot</span>
                      <span className="text-[11px] text-slate-500 block mt-1">Supports PNG, JPG, JPEG, WEBP • <strong className="text-emerald-700 font-extrabold">Up to 100MB</strong></span>
                    </div>
                  )}

                  {screenshotBase64 && !isProcessingImage && (
                    <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-md p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-black text-emerald-900">Screenshot Attached ✅</span>
                        </div>
                        <button type="button" onClick={handleRemoveScreenshot} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1 text-[11px] font-bold">
                          <X className="w-3.5 h-3.5" />Remove
                        </button>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border border-emerald-200 max-h-56 flex justify-center bg-slate-950/5 p-1 group">
                        <img src={screenshotBase64} alt="Payment Screenshot Proof" className="object-contain max-h-52 rounded-lg shadow-sm" />
                        <button type="button" onClick={() => setPreviewModalOpen(true)} className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-extrabold text-xs backdrop-blur-[2px]">
                          <Maximize2 className="w-4 h-4" /><span>Click to Zoom</span>
                        </button>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-slate-400 text-[10px] uppercase font-bold block">File Name</span><span className="font-mono font-bold text-slate-800 truncate block" title={screenshotName}>{screenshotName}</span></div>
                        <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Size & Time</span><span className="font-bold text-emerald-700 block">{screenshotSize || 'High-Res'} {screenshotTime ? `• ${screenshotTime}` : ''}</span></div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button type="button" onClick={() => setPreviewModalOpen(true)} className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /><span>Preview</span>
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 border border-emerald-200">
                          <RefreshCw className="w-3 h-3" /><span>Change</span>
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Optional UTR / Note</label>
                    <input type="text" placeholder="Optional 12-digit UTR if available" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              )}

              {/* ── UTR INPUT ── */}
              {paymentOption === 'utr' && (
                <div className="bg-amber-50 rounded-3xl p-5 border-2 border-amber-300 space-y-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      After paying ₹<strong>{grandTotal}</strong> via PhonePe or GPay, copy the 12-digit <strong>UTR / Transaction ID</strong> and paste below.
                    </p>
                  </div>

                  {utrError && (
                    <div className="bg-red-100 text-red-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{utrError}
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
                      onChange={(e) => { setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, '')); setUtrError(''); }}
                      className="w-full px-3.5 py-3 text-sm font-mono font-bold bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-inner"
                    />
                  </div>
                </div>
              )}

              {/* SUBMIT (for Screenshot / UTR options) */}
              <button
                type="submit"
                disabled={isSubmitting || (paymentOption === 'screenshot' ? !screenshotBase64 : !utrNumber.trim())}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                <span>
                  {isSubmitting ? 'Verifying & Submitting Order...' : 'Submit Order & Get WhatsApp Receipt'}
                </span>
              </button>

            </form>
          </div>
        )}
      </div>

      {/* ── SCREENSHOT PREVIEW MODAL ── */}
      {previewModalOpen && screenshotBase64 && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewModalOpen(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Payment Screenshot Preview</h3>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{screenshotName}</p>
                </div>
              </div>
              <button type="button" onClick={() => setPreviewModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center overflow-auto max-h-[calc(80vh-100px)]">
              <img src={screenshotBase64} alt="Full Payment Screenshot Preview" className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md border border-slate-200 bg-white" />
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Attached Proof Ready ({screenshotSize})
              </span>
              <button type="button" onClick={() => setPreviewModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow">Done</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
