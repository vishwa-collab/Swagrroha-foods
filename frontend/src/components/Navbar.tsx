import React, { useState, useRef, useEffect } from 'react';
import { IMAGES } from '../assets/images';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Home, UtensilsCrossed, PhoneCall, PackageCheck, ArrowRight, X, Trash2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { cart, activeTab, setActiveTab, subtotal, updateQuantity, removeFromCart } = useCart();
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const [cartPopupOpen, setCartPopupOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setCartPopupOpen(false);
      }
    };
    if (cartPopupOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [cartPopupOpen]);

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

                <div className="relative" ref={popupRef}>
                  <button
                    onClick={() => totalItemsCount > 0 ? setCartPopupOpen(o => !o) : setActiveTab('cart')}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 active:scale-95 ${activeTab === 'cart' ? 'bg-brand-600 shadow-md ring-2 ring-brand-400 ring-offset-2' : 'btn-primary'
                      }`}
                    title="View Cart"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span className="hidden sm:inline">Cart</span>
                    {totalItemsCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-amber-400 text-slate-900 text-[10px] font-black rounded-full shadow-md border-2 border-white animate-pulse">
                        {totalItemsCount}
                      </span>
                    )}
                  </button>

                  {/* Mini Cart Popup */}
                  {cartPopupOpen && totalItemsCount > 0 && (
                    <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-up">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="font-black text-slate-900 text-sm">🛒 Cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})</p>
                        <button onClick={() => setCartPopupOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Items */}
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                        {cart.map(item => (
                          <div key={item.cartItemId} className="flex items-center gap-3 px-4 py-3">
                            <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{item.product.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{item.selectedWeightLabel} · ₹{item.unitPrice}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600 flex items-center justify-center font-black text-sm transition-all"
                              >−</button>
                              <span className="w-5 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                className="w-6 h-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-black text-sm transition-all"
                              >+</button>
                              <button
                                onClick={() => removeFromCart(item.cartItemId)}
                                className="w-6 h-6 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors ml-1"
                              ><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-slate-500 font-semibold">Subtotal</span>
                          <span className="font-black text-slate-900 text-sm">₹{subtotal}</span>
                        </div>
                        <button
                          onClick={() => { setCartPopupOpen(false); setActiveTab('cart'); }}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-black py-3 rounded-xl transition-all shadow-md active:scale-95"
                        >
                          Go to Cart <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile popup for cart — triggered via the cart button in navbar on mobile */}
      {cartPopupOpen && totalItemsCount > 0 && (
        <div className="md:hidden fixed inset-0 z-[100] flex flex-col justify-end" onClick={() => setCartPopupOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] flex flex-col animate-fade-up overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-slate-300" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <p className="font-black text-slate-900 text-base">🛒 Cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})</p>
              <button onClick={() => setCartPopupOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Items */}
            <div className="overflow-y-auto overscroll-contain divide-y divide-slate-100 flex-1 max-h-[45vh] min-h-[120px]">
              {cart.map(item => (
                <div key={item.cartItemId} className="flex items-center gap-3 px-5 py-3.5">
                  <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{item.selectedWeightLabel} · ₹{item.unitPrice}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600 flex items-center justify-center font-black text-base transition-all"
                    >−</button>
                    <span className="w-6 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-black text-base transition-all"
                    >+</button>
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors ml-1"
                    ><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 font-semibold">Subtotal</span>
                <span className="font-black text-slate-900 text-lg">₹{subtotal}</span>
              </div>
              <button
                onClick={() => { setCartPopupOpen(false); setActiveTab('cart'); }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-black py-3.5 rounded-2xl transition-all shadow-md active:scale-95"
              >
                Go to Cart <ArrowRight className="w-4 h-4" />
              </button>
            </div>
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
                onClick={() => { setCartPopupOpen(false); setActiveTab(id as any); }}
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
