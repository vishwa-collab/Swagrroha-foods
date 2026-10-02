import React, { useState, useRef } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  QrCode,
  Smartphone,
  Lock,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  X,
  Eye,
  RefreshCw,
  PhoneCall,
  CheckCheck,
  Zap,
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
    showToast,
    appliedCoupon,
    couponDiscount,
  } = useCart();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chosenDeliveryDate = (customerDetails as any)._deliveryDate || deliveryDateInfo;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Screenshot Upload State
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [screenshotSize, setScreenshotSize] = useState<string>('');
  const [screenshotTime, setScreenshotTime] = useState<string>('');
  const [screenshotError, setScreenshotError] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isSavingQr, setIsSavingQr] = useState(false);

  // Optional UTR number
  const [utrNumber, setUtrNumber] = useState('');

  // Copy feedback states
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // UPI & Bank Account Details
  const upiId = '8125154114@ybl';
  const payeeName = 'PJR Swagruha Foods';
  const upiNumber = '8125154114';

  // Unique Order ID
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  // Dynamic Live UPI URI with pre-filled exact order amount & order reference
  const rawUpiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`;

  // High-Resolution Live Dynamic QR Code generated specifically for this exact amount
  const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&margin=15&data=${encodeURIComponent(rawUpiUri)}`;

  const copyToClipboard = (text: string, type: 'upi' | 'number') => {
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

    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
      showToast('Copied UPI ID: ' + text);
    } else {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2500);
      showToast('Copied Number: ' + text);
    }
  };

  // Save QR Code to Gallery / Download Image
  const handleSaveToGallery = async () => {
    setIsSavingQr(true);
    try {
      const response = await fetch(dynamicQrCodeUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `PJR-Swagruha-Foods-QR-Rs${grandTotal}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToast('✅ QR Code saved to gallery! Open PhonePe/GPay & scan from gallery.');
    } catch {
      // Fallback: Open image in new window/tab for saving
      window.open(dynamicQrCodeUrl, '_blank');
      showToast('QR Code opened. Long-press or right-click to save to gallery.');
    } finally {
      setIsSavingQr(false);
    }
  };

  // Format File Size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Image Processing & Compression via Canvas
  const processImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScreenshotError('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setScreenshotError('Image file is too large. Please select a screenshot under 25MB.');
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
        const MAX_DIM = 1400;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setScreenshotBase64(compressed);
        } else {
          setScreenshotBase64(event.target?.result as string);
        }
        setIsProcessingImage(false);
        showToast('Screenshot attached successfully! ✅');
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        setScreenshotError('Failed to read image. Please select another screenshot.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessingImage(false);
      setScreenshotError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

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

  // Launch UPI App directly on mobile
  const openApp = (app: 'phonepe' | 'gpay' | 'paytm' | 'any') => {
    const appName =
      app === 'phonepe'
        ? 'PhonePe'
        : app === 'gpay'
        ? 'Google Pay'
        : app === 'paytm'
        ? 'Paytm'
        : 'UPI App';
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (!isMobile) {
      showToast(`Scan the QR code or click "Save QR to Gallery" on your phone to pay ₹${grandTotal}.`);
      return;
    }

    showToast(`Opening ${appName}... Amount: ₹${grandTotal}`);

    if (app === 'any') {
      window.location.href = rawUpiUri;
      return;
    }

    if (isIOS) {
      if (app === 'phonepe') {
        window.location.href = `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`;
        setTimeout(() => { window.location.href = 'phonepe://'; }, 600);
      } else if (app === 'gpay') {
        window.location.href = `gpay://upi/pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`;
        setTimeout(() => { window.location.href = 'gpay://'; }, 600);
      } else if (app === 'paytm') {
        window.location.href = `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`;
        setTimeout(() => { window.location.href = 'paytmmp://'; }, 600);
      }
      return;
    }

    // Android: Use UPI Intent
    let intentUrl = '';
    if (app === 'phonepe') {
      intentUrl = `intent://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}#Intent;scheme=upi;package=com.phonepe.app;end`;
    } else if (app === 'gpay') {
      intentUrl = `intent://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
    } else if (app === 'paytm') {
      intentUrl = `intent://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}#Intent;scheme=upi;package=net.one97.paytm;end`;
    }

    try {
      window.location.href = intentUrl;
    } catch {
      window.location.href = rawUpiUri;
    }
  };

  // Submit Order with Screenshot Verification
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!screenshotBase64) {
      setScreenshotError('Please upload your payment screenshot after completing payment on PhonePe/GPay.');
      return;
    }

    setIsSubmitting(true);
    setOrderError('');
    setScreenshotError('');

    const finalUtr = utrNumber.trim() || 'SCREENSHOT_ATTACHED';

    const newOrder: PlacedOrder = {
      orderId,
      customer: customerDetails,
      area: selectedArea,
      items: cart,
      subtotal,
      deliveryCharge,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      couponDiscount: couponDiscount || 0,
      totalAmount: grandTotal,
      deliveryDate: chosenDeliveryDate,
      status: 'PLACED',
      paymentStatus: 'PAID_VIA_UPI',
      paymentMethod: 'Direct Bank UPI (Screenshot Attached)',
      utrNumber: finalUtr,
      paymentProof: screenshotBase64,
      createdAt: new Date().toISOString(),
    };

    const addRes = await addOrder(newOrder);
    if (!addRes.success) {
      const err = addRes.message || 'Unable to place your order. Please contact us on WhatsApp.';
      setOrderError(err);
      showToast(err);
      setIsSubmitting(false);
      return;
    }

    clearCart();
    setIsSubmitting(false);
    showToast('🎉 Order placed successfully with payment screenshot!');
    setActiveTab('confirmation');
  };

  if (cart.length === 0) {
    setActiveTab('cart');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up pb-28 md:pb-12">
      {/* ── Navigation & Security Badge ────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('checkout')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Address Details
        </button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Direct Bank UPI • 100% Safe
        </span>
      </div>

      {/* ── Page Header ───────────────────────────────── */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Scan & Pay via UPI</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Scan the QR code with <strong className="text-slate-900">PhonePe, Google Pay, or Paytm</strong>. Exact <strong className="text-emerald-700 font-extrabold">₹{grandTotal}</strong> is auto-filled!
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-w-md mx-auto">
        {/* ── Delivery Info Verification ───────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5 text-slate-700">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-900 flex items-center gap-1.5">
              <span>📍</span> {selectedArea.name} ({selectedArea.tier} Zone)
            </span>
            <span className="text-orange-600 font-extrabold">Delivery: ₹{deliveryCharge}</span>
          </div>
          {customerDetails.address && (
            <p className="text-[11px] text-slate-500 truncate">
              {customerDetails.address}
            </p>
          )}
          {chosenDeliveryDate && (
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
              <span>📅</span> Delivery: {chosenDeliveryDate.formattedDate || chosenDeliveryDate.dayOfWeekName || 'Upcoming Delivery'}
            </p>
          )}
        </div>

        {/* ── Amount Badge ─────────────────────────────── */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-1 shadow-xl relative overflow-hidden text-center">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 block">
            Total Amount Payable
          </span>
          <p className="text-5xl font-black text-white py-2">₹{grandTotal}</p>
          {appliedCoupon && couponDiscount > 0 && (
            <p className="text-xs font-bold text-emerald-400">
              🎟️ {appliedCoupon.code}: {appliedCoupon.discountValue || 5}% off − ₹{couponDiscount} saved!
            </p>
          )}
          <p className="text-[11px] text-slate-400">Order #{orderId} • Bank Connected UPI</p>
        </div>

        {/* ── STEP 1: AUTOMATIC GENERATED UPI QR CODE ──── */}
        <div className="bg-gradient-to-b from-orange-50/70 via-amber-50/40 to-emerald-50/60 p-6 rounded-3xl border-2 border-amber-300 space-y-4 shadow-sm text-center relative">
          <div className="inline-flex items-center gap-1.5 bg-brand-500 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Step 1: Scan &amp; Pay Exact ₹{grandTotal}</span>
          </div>

          {/* Dynamic QR Code Box */}
          <div className="relative inline-block bg-white p-4 rounded-3xl shadow-xl border-4 border-white mx-auto">
            <img
              src={dynamicQrCodeUrl}
              alt="Scan UPI QR Code to Pay"
              className="w-56 h-56 mx-auto object-contain rounded-xl"
            />
            {/* Center Logo/Branding Chip */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 rounded-full shadow-md border border-slate-200 flex items-center gap-1 text-[10px] font-black text-slate-800 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>₹{grandTotal}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-extrabold text-slate-800">
              Payee: <span className="text-amber-800">{payeeName}</span>
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              UPI ID: <strong className="text-slate-800">{upiId}</strong>
            </p>
          </div>

          {/* ── SAVE QR TO GALLERY BUTTON ─────────────── */}
          <button
            type="button"
            onClick={handleSaveToGallery}
            disabled={isSavingQr}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all border border-emerald-500"
          >
            <Download className="w-4 h-4" />
            <span>{isSavingQr ? 'Saving QR...' : '📥 Save QR to Gallery'}</span>
          </button>

          {/* How to use saved QR tip */}
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-left">
            <span className="text-base leading-none">💡</span>
            <p className="text-[11px] text-emerald-900 font-semibold leading-relaxed">
              <strong className="font-extrabold">How to pay using Gallery:</strong> Tap <strong>"Save QR to Gallery"</strong> above ➔ Open PhonePe/GPay ➔ Tap <strong>Scanner</strong> ➔ Tap <strong>"Upload from Gallery" / photo icon</strong> ➔ Select QR ➔ ₹{grandTotal} is auto-filled ➔ Pay!
            </p>
          </div>

          {/* Quick Copy UPI & Phone Number */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-left">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold text-slate-400">UPI ID</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-mono font-bold text-slate-800 truncate" title={upiId}>
                  {upiId}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(upiId, 'upi')}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 ml-1"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold text-slate-400">Phone / Mobile</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-mono font-bold text-slate-800 truncate">
                  {upiNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(upiNumber, 'number')}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 ml-1"
                  title="Copy Phone Number"
                >
                  {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* ── Mobile Direct Launch Buttons ──────────── */}
          <div className="pt-2 border-t border-amber-200/60">
            <span className="text-[11px] text-slate-600 font-bold block mb-2 text-center">
              Or tap to open directly on your phone:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => openApp('phonepe')}
                className="py-2.5 px-2 bg-[#5f259f] hover:bg-[#4d1d82] text-white rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>PhonePe</span>
              </button>

              <button
                type="button"
                onClick={() => openApp('gpay')}
                className="py-2.5 px-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Google Pay</span>
              </button>

              <button
                type="button"
                onClick={() => openApp('paytm')}
                className="py-2.5 px-2 bg-[#002970] hover:bg-[#001d52] text-white rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Paytm</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => openApp('any')}
              className="mt-2 w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>Pay via Any UPI App</span>
            </button>
          </div>
        </div>

        {/* ── STEP 2: UPLOAD PAYMENT SCREENSHOT ──────── */}
        <form onSubmit={handleConfirmOrder} className="space-y-4 text-left">
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-black text-slate-800">
                Upload Payment Screenshot <span className="text-red-500">*</span>
              </h2>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              After paying ₹{grandTotal} on PhonePe / GPay, upload the payment success screenshot here for instant order verification.
            </p>

            {screenshotError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{screenshotError}</span>
              </div>
            )}

            {/* Upload Box / Dropzone */}
            {!screenshotBase64 ? (
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center block cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 shadow-sm'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  {isProcessingImage ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
                  ) : (
                    <Upload className="w-6 h-6 text-emerald-700" />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-black text-slate-800 block">
                  {isProcessingImage ? 'Optimizing Image...' : 'Click or Drag Payment Screenshot Here'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Supports PhonePe, Google Pay, Paytm Screenshots (PNG, JPG, WEBP)
                </span>
              </label>
            ) : (
              /* Attached Screenshot Details Card */
              <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-md p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-emerald-900">
                      Payment Screenshot Attached ✅
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all flex items-center gap-1 text-[11px] font-bold"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>

                {/* Thumbnail */}
                <div className="relative rounded-xl overflow-hidden border border-emerald-200 max-h-52 flex justify-center bg-slate-900/5 p-1 group">
                  <img
                    src={screenshotBase64}
                    alt="Payment Screenshot Proof"
                    className="object-contain max-h-48 rounded-lg shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-extrabold text-xs backdrop-blur-[2px]"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Click to Zoom Preview</span>
                  </button>
                </div>

                {/* File Details Info */}
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">File Name</span>
                    <span className="font-mono font-bold text-slate-800 truncate block" title={screenshotName}>
                      {screenshotName || 'screenshot.jpg'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Size &amp; Time</span>
                    <span className="font-bold text-emerald-700 block">
                      {screenshotSize || 'High-Res'} {screenshotTime ? `• ${screenshotTime}` : ''}
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>Preview Screenshot</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 border border-emerald-200"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-600" />
                    <span>Change</span>
                  </button>
                </div>
              </div>
            )}

            {/* Optional UTR Number Input */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                Optional UTR / Transaction ID
              </label>
              <input
                type="text"
                placeholder="Optional 12-digit UTR from payment receipt"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>
          </div>

          {orderError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-semibold leading-relaxed">{orderError}</p>
            </div>
          )}

          {/* ── FINAL CONFIRM BUTTON ────────────────── */}
          <button
            type="submit"
            disabled={isSubmitting || !screenshotBase64}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2.5"
          >
            <CheckCheck className="w-5 h-5 text-white" />
            <span>
              {isSubmitting
                ? 'Verifying & Placing Order...'
                : !screenshotBase64
                ? 'Upload Screenshot to Confirm'
                : `Confirm Order (₹${grandTotal} Paid)`}
            </span>
          </button>

          <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>100% Safe • Instant notification sent to owner</span>
          </p>
        </form>

        {/* ── Direct Phone Assistance ────────────────── */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Need help with payment?</span>
          <a
            href="tel:+918125154114"
            className="flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>Call Directly</span>
          </a>
        </div>
      </div>

      {/* ── Screenshot Full Zoom Modal ─────────────────── */}
      {previewModalOpen && screenshotBase64 && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Payment Screenshot</h3>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{screenshotName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 flex items-center justify-center overflow-auto max-h-[calc(80vh-100px)]">
              <img
                src={screenshotBase64}
                alt="Full Payment Screenshot Preview"
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md border border-slate-200 bg-white"
              />
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Attached Proof Ready ({screenshotSize})
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
