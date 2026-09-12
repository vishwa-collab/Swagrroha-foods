import React from 'react';
import { IMAGES } from '../assets/images';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Home, UtensilsCrossed, PhoneCall, PackageCheck, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { cart, activeTab, setActiveTab, subtotal } = useCart();
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'products', label: 'Menu', icon: UtensilsCrossed },
    { id: 'track', label: 'My Orders & Track', icon: PackageCheck },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40">
        {/* Top Announcement Bar */}
        <div style={{ background: 'linear-gradient(90deg, #FF6B35 0%, #E63946 50%, #FF6B35 100%)', backgroundSize: '200% auto', animation: 'shimmerText 4s linear infinite' }} className="text-white text-center py-1.5 px-4">
          <p className="text-[11px] font-bold tracking-wide">
            🏠 100% Homemade Food &nbsp;•&nbsp; 🛵 Weekend Delivery &nbsp;•&nbsp; 📍 Hayathnagar ➔ LB Nagar ➔ Ibrahimpatnam
          </p>
        </div>

        {/* Main Navbar */}
        <div className="glass-nav border-b border-orange-100/60 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">

              {/* Logo */}
              <div onClick={() => setActiveTab('home')} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-500/20 rounded-xl blur-md group-hover:bg-brand-500/30 transition-all" />
                  <img
                    src={IMAGES.logo}
                    alt="PJR Swagruha Foods"
                    className="relative w-11 h-11 sm:w-13 sm:h-13 object-cover rounded-xl border-2 border-brand-400/60 shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <div className="font-black text-lg sm:text-xl text-slate-900 leading-none tracking-tight">
                    PJR Swagruha <span className="text-brand-500">Foods</span>
                  </div>
                  <p className="text-[10px] font-bold text-amber-600 tracking-widest uppercase mt-0.5">Taste you can Trust</p>
                </div>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === id
                        ? 'text-brand-600 bg-brand-50 shadow-sm'
                        : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {activeTab === id && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-orange-400" />
                    )}
                  </button>
                ))}
              </nav>

              {/* Right CTA Group */}
              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href="tel:+918125154114"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 hover:bg-emerald-100 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>8125154114</span>
                </a>

                <button
                  onClick={() => setActiveTab('cart')}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 active:scale-95 ${activeTab === 'cart' ? 'bg-brand-600 shadow-md ring-2 ring-brand-400 ring-offset-2' : 'btn-primary'
                    }`}
                  title="View Cart"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Cart</span>
                  {totalItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-amber-400 text-slate-900 text-[10px] font-black rounded-full shadow-md border-2 border-white">
                      {totalItemsCount}
                    </span>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Floating Bottom Quick Cart Bar (Shown when cart has items and user is browsing home or products menu) */}
      {totalItemsCount > 0 && (activeTab === 'home' || activeTab === 'products') && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-xl mx-auto z-40 animate-fade-up">
          <div className="w-full bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center justify-between font-bold">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                {totalItemsCount}
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-amber-300 font-bold uppercase tracking-wider">
                  {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'} in Cart
                </p>
                <p className="text-base sm:text-lg font-black text-white leading-none mt-0.5">
                  ₹{subtotal}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('cart')}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-orange-500 hover:from-brand-600 hover:to-orange-600 text-white text-xs sm:text-sm font-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all shadow-md active:scale-95 group"
            >
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar - Fixed at Bottom */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
          {[
            { id: 'home', label: 'Home', Icon: Home },
            { id: 'products', label: 'Menu', Icon: UtensilsCrossed },
            { id: 'track', label: 'Track', Icon: PackageCheck },
            { id: 'cart', label: 'Cart', Icon: ShoppingBag },
          ].map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[54px] transition-all duration-200 ${isActive
                    ? 'text-brand-600 bg-brand-50/80 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-brand-600' : 'text-slate-500'}`} />
                  {id === 'cart' && totalItemsCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center bg-brand-500 text-white text-[9px] font-black rounded-full shadow-sm animate-pulse">
                      {totalItemsCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
