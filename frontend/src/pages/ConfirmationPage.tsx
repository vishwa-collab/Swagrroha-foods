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
  const { currentOrder, setActiveTab } = useCart();

  // Fire confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

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

      {/* AUTO-DISPATCHED NOTIFICATIONS TO OWNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* ORDER CONFIRMED CARD */}
        <div className="bg-blue-50 rounded-3xl p-6 border-2 border-blue-300 shadow-md text-center space-y-3">
          <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
            <PackageCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
              ✅ Order Logged
            </span>
            <h3 className="font-extrabold text-slate-900 text-sm">Order Registered &amp; Verified</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Your order payment has been logged. You can track your order status anytime using Order ID <strong className="text-blue-800 font-mono">{currentOrder.orderId}</strong>.
            </p>
          </div>
        </div>

        {/* OWNER AUTO-NOTIFICATION CARD */}
        <div className="bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-300 shadow-md text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
              ✅ Auto-Dispatched
            </span>
            <h3 className="font-extrabold text-slate-900 text-sm">Owner Alerted (+91 8125154114)</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Order receipt automatically sent to store management <strong>PJR Swagrooha Foods</strong> for processing.
            </p>
          </div>
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
