import React from 'react';
import { IMAGES } from '../assets/images';
import { Phone, MessageCircle, MapPin, Calendar, Truck, ShieldCheck, Heart } from 'lucide-react';
import { DELIVERY_AREAS } from '../data/deliveryAreas';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t-4 border-brand-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={IMAGES.logo} 
                alt="PJR Swagrooha Foods" 
                className="w-12 h-12 rounded-lg border border-amber-400/50 object-cover"
              />
              <div>
                <h3 className="font-extrabold text-lg text-white tracking-wide">PJR Swagrooha Foods</h3>
                <p className="text-xs text-amber-400 font-semibold uppercase">Taste you can Trust</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authentic, 100% homemade Telugu sweets, crisp savouries & spicy chicken/mutton pickles prepared with love, traditional recipes, and zero preservatives.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a 
                href="https://wa.me/918125154114?text=Hi%20PJR%20Swagrooha%20Foods!%20I%20have%20an%20enquiry." 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Us
              </a>
              <a 
                href="tel:+918125154114" 
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-lg border border-slate-700 transition-colors"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                Call Directly
              </a>
            </div>
          </div>

          {/* Business Concept */}
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
                <span><strong className="text-slate-200">Scheduled Delivery:</strong> 4–5 day preparation gap for maximum freshness.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong className="text-slate-200">Weekend Delivery:</strong> Orders dispatched every Saturday on scooty route.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong className="text-slate-200">No Instant Rush:</strong> Quality takes time!</span>
              </li>
            </ul>
          </div>

          {/* Delivery Route & Areas */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              Delivery Coverage (16 Areas)
            </h4>
            <p className="text-xs text-amber-300 font-medium">
              Hayathnagar ➔ LB Nagar ➔ Ibrahimpatnam
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DELIVERY_AREAS.map(area => (
                <span 
                  key={area.id} 
                  className="text-[11px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700/60"
                >
                  {area.name} (₹{area.charge})
                </span>
              ))}
            </div>
          </div>

          {/* Delivery Schedule Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              Delivery Timetable
            </h4>
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/70 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-amber-200">
                <span>Mon – Wed Orders</span>
                <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-800">Same Weekend</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-amber-200">
                <span>Thu – Sun Orders</span>
                <span className="bg-amber-950 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-800">Next Weekend</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Dispatched directly on our scooty route for minimal delivery fee.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright & credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PJR Swagrooha Foods. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for Authentic Homemade Food Lovers.
          </div>
        </div>
      </div>
    </footer>
  );
};
