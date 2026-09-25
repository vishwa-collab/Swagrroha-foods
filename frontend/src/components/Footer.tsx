import React from 'react';
import { IMAGES } from '../assets/images';
import { useCart } from '../context/CartContext';
import { Phone, MessageCircle, MapPin, Calendar, Clock, ShieldCheck, Heart, Lock, Mail, Navigation, Sparkles } from 'lucide-react';
import { DELIVERY_AREAS } from '../data/deliveryAreas';
import { getDeliverySlotOptions } from '../utils/deliveryCalculator';

export const Footer: React.FC = () => {
  const { setActiveTab } = useCart();
  const slotOptions = getDeliverySlotOptions();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-24 md:pb-8 border-t-4 border-brand-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">

          {/* 1. Brand & Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
              <img
                src={IMAGES.logo}
                alt="PJR Swagruha Foods"
                loading="lazy"
                onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.opacity = '0'; }}
                className="w-14 h-14 rounded-full border-2 border-amber-400 p-0.5 bg-white object-contain shadow-md"
              />
              <div>
                <h3 className="font-extrabold text-lg text-white tracking-wide">PJR Swagruha Foods</h3>
                <p className="text-xs text-amber-400 font-semibold uppercase">Taste you can Trust</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authentic, 100% homemade Telugu sweets, crisp savouries & spicy chicken/mutton pickles prepared with love, traditional recipes, and zero preservatives.
            </p>
            
            {/* Contact & Address details */}
            <div className="space-y-2 text-xs text-slate-300 pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Kitchen Hub:</strong> Hayathnagar, Hyderabad, Telangana
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <a href="mailto:vishwa81251@gmail.com" className="hover:text-amber-300 transition-colors">
                  vishwa81251@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400 shrink-0" />
                <span>8:00 AM – 9:00 PM (Online 24/7)</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <a
                href="https://wa.me/918125154114?text=Hi%20PJR%20Swagruha%20Foods!%20I%20have%20an%20enquiry."
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                href="tel:+918125154114"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                +91 81251 54114
              </a>
            </div>
          </div>

          {/* 2. Delivery Schedule & Live Date Example */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              Delivery Schedule & Dates
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every item is freshly made in bulk only after you order. We maintain a strict <strong className="text-amber-300">4–5 days fresh preparation gap</strong>.
            </p>

            {/* Live Real-time Delivery Dates Box */}
            <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/70">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Order Placed Today:
                </span>
                <span className="text-[11px] font-semibold text-slate-300">{slotOptions.slot1.orderDayName}</span>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">Slot 1 (4 Days):</span>
                  <span className="text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    {slotOptions.slot1.formattedDate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">Slot 2 (5 Days):</span>
                  <span className="text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                    {slotOptions.slot2.formattedDate}
                  </span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-700/70 text-[11px] text-slate-400">
                <strong className="text-slate-200">Example:</strong> Order on Monday ➔ Delivered freshly by Friday or Saturday on our scheduled route!
              </div>
            </div>

            <div className="pt-1 text-xs space-y-1 text-slate-400">
              <p className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Own batch manufacturing, zero stale stock
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Direct scooty delivery straight to your doorstep
              </p>
            </div>
          </div>

          {/* 3. Delivery Coverage (Locations & Real Rates) */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              Delivery Locations (16 Areas)
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
              <Navigation className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Route: Hayathnagar ➔ LB Nagar ➔ Ibrahimpatnam</span>
            </div>
            
            {/* 16 Area Badges with Real Rates */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DELIVERY_AREAS.map(area => (
                <span
                  key={area.id}
                  className="text-[11px] bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700/70 hover:border-amber-500/50 transition-colors"
                >
                  <strong className="text-slate-100">{area.name}</strong>{' '}
                  <span className="text-amber-400 font-semibold">₹{area.charge}</span>
                </span>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 pt-1 italic">
              * Minimal delivery charges (₹20, ₹30, ₹40) on our scheduled scooty route.
            </p>
          </div>

          {/* 4. Our Unique Concept */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              Our Unique Concept
            </h4>
            <ul className="text-xs space-y-2.5 text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong className="text-slate-200">Own Manufacturing:</strong> Prepared fresh in bulk after you order.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong className="text-slate-200">Scheduled Delivery:</strong> Orders prepared fresh within 4–5 days of placing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong className="text-slate-200">No Instant Rush:</strong> Quality takes time!</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-slate-800">
              <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 text-[11px] text-slate-400">
                <span className="text-amber-400 font-bold block mb-0.5">100% Quality Guarantee</span>
                Pure groundnut oil, organic jaggery, cow ghee, and zero chemical preservatives.
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright & credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p>© {new Date().getFullYear()} PJR Swagruha Foods. All rights reserved.</p>
            <button
              onClick={() => setActiveTab('admin')}
              className="text-slate-600 hover:text-amber-400 transition-colors flex items-center gap-1"
              title="Owner Admin Login"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for Authentic Telugu Homemade Food Lovers.
          </div>
        </div>
      </div>
    </footer>
  );
};
