import React from 'react';
import { IMAGES } from '../assets/images';
import { useCart } from '../context/CartContext';
import { Phone, MessageCircle, MapPin, Calendar, ShieldCheck, Heart, Lock, Mail } from 'lucide-react';
import { getDeliverySlotOptions } from '../utils/deliveryCalculator';

export const Footer: React.FC = () => {
  const { setActiveTab } = useCart();
  const slotOptions = getDeliverySlotOptions();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-8 pb-20 md:pb-6 border-t-2 border-brand-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-slate-800 text-xs">

          {/* 1. Brand & Contact */}
          <div className="space-y-2.5">
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => setActiveTab('home')}
            >
              <img
                src={IMAGES.logo}
                alt="PJR Swagruha Foods"
                loading="lazy"
                onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.opacity = '0'; }}
                className="w-10 h-10 rounded-full border border-amber-400 p-0.5 bg-white object-contain shadow-sm"
              />
              <div>
                <h3 className="font-extrabold text-sm text-white tracking-wide leading-tight">PJR Swagruha Foods</h3>
                <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Taste you can Trust</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Authentic, 100% homemade Telugu sweets, savouries & non-veg pickles with zero preservatives.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <a
                href="https://wa.me/918125154114?text=Hi%20PJR%20Swagruha%20Foods!%20I%20have%20an%20enquiry."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
              <a
                href="tel:+918125154114"
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
              >
                <Phone className="w-3 h-3 text-amber-400" /> +91 81251 54114
              </a>
            </div>
          </div>

          {/* 2. Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1 text-[11px] text-slate-400">
              <li>
                <button
                  onClick={() => setActiveTab('home')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('products')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  All Products & Sweets
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('cart')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  My Cart
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('track')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Track Order
                </button>
              </li>
            </ul>
            <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-brand-400 shrink-0" />
              <a href="mailto:vishwa81251@gmail.com" className="hover:text-amber-300 truncate">
                vishwa81251@gmail.com
              </a>
            </div>
          </div>

          {/* 3. Delivery & Slots */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-500" /> Scheduled Delivery
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Fresh bulk prep with a <strong className="text-amber-300">4–5 days fresh gap</strong>.
            </p>
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Next Slot:</span>
                <span className="text-emerald-300 font-bold">{slotOptions.slot1.formattedDate}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Route: Hayathnagar ➔ LB Nagar ➔ Ibrahimpatnam
              </div>
            </div>
          </div>

          {/* 4. Our Quality Promise */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" /> Quality Promise
            </h4>
            <ul className="text-[11px] space-y-1 text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Pure Cow Ghee & Cold-Pressed Oil
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Zero Artificial Flavours / Preservatives
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Direct Doorstep Delivery
              </li>
            </ul>
            <div className="flex items-start gap-1.5 pt-1 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 text-brand-400 shrink-0 mt-0.5" />
              <span>Hayathnagar, Hyderabad (8 AM – 9 PM)</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright & credits */}
        <div className="pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <p>© {new Date().getFullYear()} PJR Swagruha Foods. All rights reserved.</p>
            <button
              onClick={() => setActiveTab('admin')}
              className="text-slate-600 hover:text-amber-400 transition-colors"
              title="Admin Login"
            >
              <Lock className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for Authentic Telugu Food Lovers.
          </div>
        </div>
      </div>
    </footer>
  );
};
