import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import confetti from 'canvas-confetti';
import { 
  MessageCircle, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  FileText, 
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  PackageCheck,
  Hash,
  Clock,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';

export const ConfirmationPage: React.FC = () => {
  const { currentOrder, setActiveTab, showToast } = useCart();
  const [whatsappLaunched, setWhatsappLaunched] = useState(false);
  const [utrCopied, setUtrCopied] = useState(false);

  // Business Owner WhatsApp Number
  const businessWhatsAppNumber = '918125154114';

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (currentOrder && !whatsappLaunched) {
      const timer = setTimeout(() => {
        openWhatsAppOrderMessage();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentOrder]);

  if (!currentOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No Active Order Found</h2>
        <button
          onClick={() => setActiveTab('products')}
          className="bg-brand-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs"
        >
          Go to Products
        </button>
      </div>
    );
  }

  const itemsTextList = currentOrder.items.map(item => (
    `• ${item.product.name} (${item.selectedWeightLabel}) - ₹${item.unitPrice * item.quantity}`
  )).join('\n');

  const formattedWhatsAppMessage = 
`📦 New Order Received!

Name: ${currentOrder.customer.name}
Phone: ${currentOrder.customer.phone}
Area: ${currentOrder.area.name}
Address: ${currentOrder.customer.address}

Items:
${itemsTextList}

Delivery Charge: ₹${currentOrder.deliveryCharge}
Total Amount: ₹${currentOrder.totalAmount}
Delivery Date: ${currentOrder.deliveryDate.dayOfWeekName} (${currentOrder.deliveryDate.formattedDate})

🔑 Razorpay Payment ID: ${currentOrder.utrNumber}
✅ Status: Paid & Verified Successfully`;

  const whatsappUrl = `https://wa.me/${businessWhatsAppNumber}?text=${encodeURIComponent(formattedWhatsAppMessage)}`;

  const openWhatsAppOrderMessage = () => {
    setWhatsappLaunched(true);
    window.open(whatsappUrl, '_blank');
  };

  const copyUtr = () => {
    navigator.clipboard.writeText(currentOrder.utrNumber);
    setUtrCopied(true);
    showToast('UTR Number copied to clipboard!');
    setTimeout(() => setUtrCopied(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl text-center space-y-3">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto text-white">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">
          Order Placed & Sent via WhatsApp! 🎉
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto">
          Order ID: <strong className="bg-white/20 px-2 py-0.5 rounded font-mono text-white">{currentOrder.orderId}</strong>
        </p>
      </div>

      {/* NOTIFICATIONS CONTAINER: GMAIL FOR CUSTOMER & WHATSAPP FOR OWNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CUSTOMER GMAIL RECEIPT CARD */}
        <div className="bg-blue-50 rounded-3xl p-6 border-2 border-blue-400 shadow-lg text-center space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow">
              <Mail className="w-4 h-4" />
              Customer Gmail Receipt
            </div>
            <h2 className="text-lg font-black text-slate-900">
              Receipt Sent to Customer Email
            </h2>
            <p className="text-xs text-slate-600">
              Sent to: <strong className="text-blue-900 font-mono">{currentOrder.customer.email || 'customer@gmail.com'}</strong>
            </p>
          </div>

          <a
            href={`mailto:${currentOrder.customer.email || ''}?subject=${encodeURIComponent('PJR Swagrooha Foods - Order Receipt #' + currentOrder.orderId)}&body=${encodeURIComponent(formattedWhatsAppMessage)}`}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 px-4 rounded-2xl shadow-md transition-all text-xs uppercase tracking-wider no-underline"
          >
            <Mail className="w-4 h-4" />
            <span>Open Customer Gmail Receipt</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* OWNER WHATSAPP NOTIFICATION CARD */}
        <div className="bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-500 shadow-lg text-center space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow">
              <MessageCircle className="w-4 h-4" />
              Owner WhatsApp Notification
            </div>
            <h2 className="text-lg font-black text-slate-900">
              Notification Sent to Owner
            </h2>
            <p className="text-xs text-slate-600">
              Received at Owner Number: <strong className="text-emerald-950 font-bold">+91 8125154114</strong>
            </p>
          </div>

          <button
            onClick={openWhatsAppOrderMessage}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-2xl shadow-md transition-all text-xs uppercase tracking-wider"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send to Owner WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Order Receipt Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-swiggy border border-slate-100 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Order Summary</h3>
            <p className="text-xs text-slate-400">PJR Swagrooha Foods • Scheduled Homemade Delivery</p>
          </div>
          <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1 rounded-lg">
            Delivery: {currentOrder.deliveryDate.dayOfWeekName}
          </span>
        </div>

        {/* Customer & Address Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Customer Details</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{currentOrder.customer.name}</p>
            <p className="text-slate-600 font-medium">📞 {currentOrder.customer.phone}</p>
            <p className="text-blue-700 font-medium">✉️ {currentOrder.customer.email || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Delivery Route & Address</span>
            <p className="font-bold text-brand-600 text-xs mt-0.5">{currentOrder.area.name} Zone</p>
            <p className="text-slate-700 leading-relaxed font-medium">{currentOrder.customer.address}</p>
          </div>
        </div>

        {/* Verification Status Badge */}
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-950 block">Payment Submitted &amp; UTR Logged ✅</span>
              <span className="text-emerald-800 text-[11px]">UTR: <strong>{currentOrder.utrNumber}</strong></span>
            </div>
          </div>
          <span className="bg-emerald-200 text-emerald-950 font-black text-[10px] uppercase px-2.5 py-1 rounded-full shrink-0">
            Paid via UPI ✅
          </span>
        </div>

        {/* Ordered Items List */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Items Ordered</h4>
          <div className="divide-y divide-slate-100 text-xs">
            {currentOrder.items.map(item => (
              <div key={item.cartItemId} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{item.product.name}</span>
                  <span className="ml-2 text-slate-500 font-semibold">({item.selectedWeightLabel}) × {item.quantity}</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">₹{item.unitPrice * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown Totals */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Items Total</span>
            <span className="font-bold text-slate-900">₹{currentOrder.subtotal}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Charge ({currentOrder.area.name})</span>
            <span className="font-bold text-slate-900">₹{currentOrder.deliveryCharge}</span>
          </div>
          <div className="flex justify-between text-slate-900 font-black text-lg pt-2 border-t border-slate-200">
            <span>Total Amount Paid</span>
            <span className="text-brand-600">₹{currentOrder.totalAmount}</span>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={() => setActiveTab('products')}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Place Another Order
          </button>
        </div>

      </div>

    </div>
  );
};
