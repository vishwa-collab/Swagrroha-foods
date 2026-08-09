import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { DELIVERY_AREAS } from '../data/deliveryAreas';
import { 
  User, 
  Phone, 
  Mail,
  MapPin, 
  Home, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  AlertCircle
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { 
    cart, 
    selectedArea, 
    setSelectedAreaById, 
    subtotal, 
    deliveryCharge, 
    grandTotal, 
    setActiveTab, 
    customerDetails, 
    setCustomerDetails,
    deliveryDateInfo,
    showToast
  } = useCart();

  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; address?: string }>({});

  const handleInputChange = (field: keyof typeof customerDetails, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; phone?: string; email?: string; address?: string } = {};

    if (!customerDetails.name.trim()) {
      newErrors.name = 'Please enter your full name';
    }
    if (!customerDetails.phone.trim() || customerDetails.phone.trim().length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (!customerDetails.email || !customerDetails.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address (e.g. gmail.com)';
    }
    if (!customerDetails.address.trim()) {
      newErrors.address = 'Please enter your complete house address & landmark';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fill all required customer details');
      return;
    }

    setActiveTab('payment');
  };

  if (cart.length === 0) {
    setActiveTab('cart');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('cart')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Step 1 of 2: Details & Schedule
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Checkout & Address</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Please enter your delivery contact details below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Customer Details Form */}
        <form onSubmit={validateAndProceed} className="md:col-span-7 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-5">
            <h2 className="font-extrabold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" />
              Customer Information
            </h2>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="e.g. Ravi Kumar"
                  value={customerDetails.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm font-semibold border ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-brand-500'
                  } focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>}
            </div>

            {/* Phone Number Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Mobile Number (For Delivery & WhatsApp) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="tel"
                  placeholder="e.g. 8125154114"
                  maxLength={10}
                  value={customerDetails.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm font-semibold border ${
                    errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-brand-500'
                  } focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-red-500 font-semibold">{errors.phone}</p>}
            </div>

            {/* Email Address Input (Gmail for Receipt) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Customer Email Address (For Order Receipt) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="email"
                  placeholder="e.g. customer@gmail.com"
                  value={customerDetails.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm font-semibold border ${
                    errors.email ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-brand-500'
                  } focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 font-semibold">{errors.email}</p>}
            </div>

            {/* Area Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Selected Area Zone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                <select
                  value={selectedArea.id}
                  onChange={(e) => {
                    setSelectedAreaById(e.target.value);
                    handleInputChange('areaId', e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {DELIVERY_AREAS.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.name} (Delivery ₹{area.charge})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Complete House Address & Landmark <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={3}
                  placeholder="House No, Flat Name, Street / Colony, Landmark (e.g. Near Bus Stop)"
                  value={customerDetails.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border ${
                    errors.address ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-brand-500'
                  } focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                />
              </div>
              {errors.address && <p className="text-[11px] text-red-500 font-semibold">{errors.address}</p>}
            </div>

          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-brand-500/30 hover:scale-[1.01] active:scale-95 transition-all text-sm"
          >
            <span>Proceed to Payment (UPI Only)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Right Column: AUTO DISPLAY DELIVERY DATE & SUMMARY */}
        <div className="md:col-span-5 space-y-6">
          
          {/* AUTO DISPLAYED DELIVERY DATE CARD */}
          <div className="bg-gradient-to-br from-slate-900 to-brand-950 text-white rounded-3xl p-6 shadow-xl border border-brand-500/30 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-amber-400" />
              Auto Scheduled Delivery Date
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
              <p className="text-xs text-slate-300 font-medium">Your order will be delivered on:</p>
              <p className="text-xl font-black text-amber-300">{deliveryDateInfo.formattedDate}</p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Delivery Business Logic:
              </p>
              <ul className="space-y-1 text-[11px] text-slate-300 pl-4 list-disc">
                <li><strong className="text-emerald-300">Mon–Wed orders</strong> ➔ Delivered same weekend (Saturday)</li>
                <li><strong className="text-amber-300">Thu–Sun orders</strong> ➔ Delivered next weekend (Saturday)</li>
                <li>Maintains fresh 4–5 day preparation gap</li>
              </ul>
            </div>
          </div>

          {/* Quick Summary Box */}
          <div className="bg-white rounded-3xl p-5 shadow-swiggy border border-slate-100 space-y-3 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Order Summary</h3>
            <div className="flex justify-between text-slate-600">
              <span>Items Total ({cart.length})</span>
              <span className="font-bold text-slate-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charge ({selectedArea.name})</span>
              <span className="font-bold text-slate-900">₹{deliveryCharge}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-sm text-slate-900">
              <span>Final Total</span>
              <span className="text-brand-600">₹{grandTotal}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
