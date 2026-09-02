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
  ExternalLink,
  CheckCircle,
  HelpCircle
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

  const [paymentProofOption, setPaymentProofOption] = useState<'screenshot' | 'utr'>('screenshot');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Option 1: Screenshot Upload
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [screenshotSize, setScreenshotSize] = useState<string>('');
  const [screenshotTime, setScreenshotTime] = useState<string>('');
  const [screenshotError, setScreenshotError] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Option 2: UTR Number
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');

  const [upiCopied, setUpiCopied] = useState(false);
  const [numberCopied, setNumberCopied] = useState(false);

  // Direct Individual UPI & Contact Info
  const upiNumber = '8125154114';
  const upiId = '8125154114@ybl';
  const payeeName = 'Ganji Vishwateja';

  // Unique Order ID
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  // Dynamic QR code with pre-filled amount
  const rawUpiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal}&cu=INR`;
  const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${encodeURIComponent(rawUpiUri)}`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setUpiCopied(true);
    showToast('UPI ID (8125154114@ybl) copied!');
    setTimeout(() => setUpiCopied(false), 2500);
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(upiNumber);
    setNumberCopied(true);
    showToast('Phone number (8125154114) copied!');
    setTimeout(() => setNumberCopied(false), 2500);
  };

  const openApp = (app: 'phonepe' | 'gpay' | 'paytm') => {
    copyUpiId();
    showToast(`UPI ID copied! Opening ${app.toUpperCase()}...`);
    if (app === 'phonepe') window.location.href = 'phonepe://';
    else if (app === 'gpay') window.location.href = 'gpay://';
    else if (app === 'paytm') window.location.href = 'paytmmp://';
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
        showToast(`Screenshot attached successfully (${formatFileSize(file.size)})! ✅`);
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

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalUtr = '';
    let finalProof = '';

    if (paymentProofOption === 'screenshot') {
      if (!screenshotBase64) { 
        setScreenshotError('Please select and upload your payment success screenshot.'); 
        return; 
      }
      finalProof = screenshotBase64;
      finalUtr = utrNumber.trim() || 'SCREENSHOT_PROVED';
    } else {
      const cleanUtr = utrNumber.trim();
      const utrPattern = /^\d{8,22}$/;
      if (!cleanUtr) { 
        setUtrError('Please enter your 12-digit UTR / Transaction ID from PhonePe, GPay, or Paytm.'); 
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
      paymentMethod: paymentProofOption === 'screenshot' ? 'Direct UPI (Screenshot Proof)' : 'Direct UPI (UTR Verified)',
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
      `💳 *Payment:* Direct UPI to ${upiId} (${paymentProofOption === 'screenshot' ? 'Screenshot Uploaded ✅' : `UTR: ${finalUtr}`})\n\n` +
      `_Thank you for ordering with PJR Swagrooha Foods!_`;

    const waWindow = window.open(`https://wa.me/918125154114?text=${encodeURIComponent(waText)}`, '_blank');

    const addRes = await addOrder(newOrder);
    if (!addRes.success) {
      const err = addRes.message || 'Unable to place your order. Please try again.';
      if (paymentProofOption === 'screenshot') setScreenshotError(err);
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
          Direct UPI Payment
        </span>
      </div>

      {/* Title Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Pay via PhonePe / GPay / Paytm</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Scan the QR code below or transfer directly to <strong className="text-slate-900">{upiId}</strong> ({upiNumber}).
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center max-w-md mx-auto">

        {/* Amount Badge */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl mx-auto space-y-1 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 block">Total Amount Payable</span>
          <p className="text-5xl font-black text-white py-2">₹{grandTotal}</p>
          <p className="text-[11px] text-slate-400">Order #{orderId} • Items (₹{subtotal}) + Delivery (₹{deliveryCharge})</p>
        </div>

        {/* ── STEP 1: SCAN QR CODE PHOTO (100% Guaranteed Success) ── */}
        <div className="bg-gradient-to-b from-slate-50 to-emerald-50/50 p-5 rounded-3xl border-2 border-emerald-500/30 space-y-4 shadow-inner">
          <div className="flex items-center justify-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
            <QrCode className="w-5 h-5 text-emerald-600" />
            Scan QR Code in PhonePe / GPay
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-md inline-block border border-slate-200">
            <img 
              src={IMAGES.qrCode} 
              alt={`QR Code for ${upiId} - ₹${grandTotal}`} 
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl mx-auto"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-600 font-bold block">
              Scan with PhonePe, GPay, Paytm, BHIM or any UPI scanner
            </span>
            <span className="text-xs font-black text-slate-900 block font-mono">
              {payeeName} ({upiId})
            </span>
          </div>
        </div>

        {/* ── PHONE NUMBER & UPI ID WITH 1-CLICK COPY ── */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-3">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Or Transfer directly using UPI Details
          </span>

          {/* Copy Phone Number */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">PhonePe / GPay Number</span>
              <p className="font-mono font-black text-slate-900 text-sm">{upiNumber}</p>
            </div>
            <button
              type="button"
              onClick={copyNumber}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all"
            >
              {numberCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{numberCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Copy UPI ID */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">UPI ID</span>
              <p className="font-mono font-black text-slate-900 text-sm">{upiId}</p>
            </div>
            <button
              type="button"
              onClick={copyUpiId}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all"
            >
              {upiCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{upiCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Quick Open App Buttons */}
          <div className="pt-1">
            <span className="text-[10px] text-slate-500 font-semibold block mb-2 text-center">
              Copy UPI ID and open your preferred app:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => openApp('phonepe')}
                className="py-2.5 px-2 bg-[#5f259f] hover:bg-[#4d1d82] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>PhonePe</span>
              </button>
              <button
                type="button"
                onClick={() => openApp('gpay')}
                className="py-2.5 px-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>GPay</span>
              </button>
              <button
                type="button"
                onClick={() => openApp('paytm')}
                className="py-2.5 px-2 bg-[#002970] hover:bg-[#001d52] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Paytm</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── STEP 2: CONFIRM PAYMENT (Attach Screenshot or UTR) ── */}
        <div className="space-y-4 pt-2 text-left">
          <div className="border-t border-slate-200 pt-4">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block text-center">
              Step 2: Submit Payment Proof
            </span>
          </div>

          {/* Proof Option Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setPaymentProofOption('screenshot')}
              className={`py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                paymentProofOption === 'screenshot'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Option 1: Screenshot</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentProofOption('utr')}
              className={`py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                paymentProofOption === 'utr'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Option 2: UTR Number</span>
            </button>
          </div>

          <form onSubmit={handleConfirmOrder} className="space-y-4">

            {/* ── OPTION 1: SCREENSHOT UPLOAD ── */}
            {paymentProofOption === 'screenshot' && (
              <div className="bg-emerald-50/80 rounded-3xl p-5 border-2 border-emerald-300/80 space-y-4 shadow-sm">
                <div className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                    Upload your payment-success screenshot below. Supports up to <strong className="text-emerald-900 font-black">100MB</strong>.
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
                    className={`border-2 border-dashed rounded-2xl p-6 text-center block cursor-pointer transition-all ${
                      isDragging
                        ? 'border-emerald-600 bg-emerald-100/70 scale-[1.02]'
                        : 'border-emerald-400 hover:border-emerald-600 bg-white hover:bg-emerald-50/50 shadow-sm'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-800 block">
                      Click to Browse or Drag &amp; Drop Screenshot
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Supports PNG, JPG, JPEG, WEBP • <strong className="text-emerald-700 font-extrabold">Up to 100MB</strong>
                    </span>
                  </div>
                )}

                {screenshotBase64 && !isProcessingImage && (
                  <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-md p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-emerald-900">
                          Screenshot Attached Successfully ✅
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

                    <div className="relative rounded-xl overflow-hidden border border-emerald-200 max-h-56 flex justify-center bg-slate-950/5 p-1 group">
                      <img
                        src={screenshotBase64}
                        alt="Payment Screenshot Proof"
                        className="object-contain max-h-52 rounded-lg shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewModalOpen(true)}
                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-extrabold text-xs backdrop-blur-[2px]"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span>Click to Zoom Preview</span>
                      </button>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">File Name</span>
                        <span className="font-mono font-bold text-slate-800 truncate block" title={screenshotName}>
                          {screenshotName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Size &amp; Time</span>
                        <span className="font-bold text-emerald-700 block">
                          {screenshotSize || 'High-Res'} {screenshotTime ? `• ${screenshotTime}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewModalOpen(true)}
                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 border border-emerald-200"
                      >
                        <RefreshCw className="w-3 h-3 text-emerald-600" />
                        <span>Change</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
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
            {paymentProofOption === 'utr' && (
              <div className="bg-amber-50 rounded-3xl p-5 border-2 border-amber-300 space-y-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    After transferring ₹<strong>{grandTotal}</strong> via PhonePe or GPay to <strong>{upiId}</strong>, copy the 12-digit <strong>UTR / Transaction ID</strong> and paste below.
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
              disabled={isSubmitting || (paymentProofOption === 'screenshot' ? !screenshotBase64 : !utrNumber.trim())}
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

      {/* Screenshot Preview Modal */}
      {previewModalOpen && screenshotBase64 && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
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
                  <h3 className="font-extrabold text-sm text-white">Payment Screenshot Preview</h3>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{screenshotName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center"
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
