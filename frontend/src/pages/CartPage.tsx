import React from 'react';
import { useCart } from '../context/CartContext';
import { DELIVERY_AREAS } from '../data/deliveryAreas';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  Truck, 
  ArrowRight, 
  AlertCircle,
  Calendar,
  UtensilsCrossed
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    selectedArea, 
    setSelectedAreaById, 
    subtotal, 
    deliveryCharge, 
    originalDeliveryCharge,
    isFreeDelivery,
    grandTotal,
    setActiveTab,
    deliveryDateInfo
  } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-brand-500">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Your Cart is Empty</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Explore our homemade Telangana sweets, snacks, and chicken/mutton pickles to add items to your cart.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('products')}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-brand-500/20 transition-all text-sm"
        >
          <UtensilsCrossed className="w-4 h-4" />
          Browse Food Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Review Your Cart</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Verify your items and select your delivery area along the Hayathnagar to Ibrahimpatnam route.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Selected Cart Items */}
        <div className="md:col-span-7 space-y-4">
          
          <div className="bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-4">
            <h2 className="font-extrabold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Selected Items ({cart.length})</span>
              <button 
                onClick={() => setActiveTab('products')} 
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                + Add More Items
              </button>
            </h2>

            <div className="divide-y divide-slate-100">
              {cart.map(item => {
                const lineTotal = item.unitPrice * item.quantity;
                return (
                  <div key={item.cartItemId} className="py-4 flex items-center justify-between gap-4">
                    
                    {/* Item Thumbnail & Info */}
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded-2xl border border-slate-100 shadow-sm"
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.product.name}</h3>
                        <p className="text-xs font-semibold text-brand-600">
                          Weight: <span className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-bold">{item.selectedWeightLabel}</span>
                        </p>
                        <p className="text-xs text-slate-400 font-medium">₹{item.unitPrice} per unit</p>
                      </div>
                    </div>

                    {/* Quantity Controls & Line Total */}
                    <div className="flex items-center gap-4">
                      
                      {/* Increment / Decrement */}
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-black text-sm text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-base font-black text-slate-900">₹{lineTotal}</span>
                      </div>

                      {/* Delete Action */}
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-slate-400 hover:text-red-500 p-1.5 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Logic Reminder Banner */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <Calendar className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950">Scheduled 4-Day Fresh Delivery</p>
              <p className="text-amber-800 leading-relaxed">
                Your order is estimated for <strong className="underline">{deliveryDateInfo.formattedDate}</strong> ({deliveryDateInfo.dayOfWeekName}). 
                We prepare all food items fresh in small batches maintaining a 4-day preparation gap.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Area Selection & Order Summary */}
        <div className="md:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-6">
            
            {/* AREA SELECTION DROPDOWN (VERY IMPORTANT) */}
            <div className="space-y-3">
              <label className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-500" />
                Select Your Delivery Area <span className="text-red-500">*</span>
              </label>

              <select
                value={selectedArea.id}
                onChange={(e) => setSelectedAreaById(e.target.value)}
                className="w-full p-3.5 rounded-2xl border-2 border-brand-500 bg-brand-50/40 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm cursor-pointer"
              >
                <optgroup label="Near Zone (₹20 Delivery)">
                  {DELIVERY_AREAS.filter(a => a.tier === 'Near').map(area => (
                    <option key={area.id} value={area.id}>
                      📍 {area.name} — Near Zone (₹{area.charge} Delivery)
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Medium Zone (₹30 Delivery)">
                  {DELIVERY_AREAS.filter(a => a.tier === 'Medium').map(area => (
                    <option key={area.id} value={area.id}>
                      📍 {area.name} — Medium Zone (₹{area.charge} Delivery)
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Far Zone (₹50 Delivery)">
                  {DELIVERY_AREAS.filter(a => a.tier === 'Far').map(area => (
                    <option key={area.id} value={area.id}>
                      📍 {area.name} — Far Zone (₹{area.charge} Delivery)
                    </option>
                  ))}
                </optgroup>
              </select>

              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500">Area Category:</span>
                <span className="font-bold text-brand-600">{selectedArea.tier} Route Zone</span>
              </div>
            </div>

            {/* Free Delivery Banner / Progress */}
            {isFreeDelivery ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3 flex items-center gap-2.5 text-xs font-bold shadow-sm">
                <span className="text-base">🎉</span>
                <span>You unlocked <strong>FREE Delivery</strong> on this order!</span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 space-y-1.5 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <span>Add <strong>₹{500 - subtotal}</strong> more for <strong>FREE Delivery</strong></span>
                  <span className="text-[10px] font-extrabold text-amber-700">{Math.round((subtotal / 500) * 100)}%</span>
                </div>
                <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-brand-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (subtotal / 500) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Bill Details</h3>
              
              <div className="flex justify-between text-xs text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-brand-500" />
                  Delivery Charge ({selectedArea.name})
                </span>
                {isFreeDelivery ? (
                  <div className="flex items-center gap-1.5">
                    <span className="line-through text-slate-400">₹{originalDeliveryCharge}</span>
                    <span className="font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">FREE</span>
                  </div>
                ) : (
                  <span className="font-bold text-slate-900">₹{deliveryCharge}</span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="font-extrabold text-base text-slate-900 block">Total Amount</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Includes taxes & delivery fee</span>
                </div>
                <span className="text-2xl font-black text-brand-600">₹{grandTotal}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => setActiveTab('checkout')}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-brand-500/30 hover:scale-[1.02] active:scale-95 transition-all text-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-40">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Grand Total</p>
            <p className="text-xl font-black text-brand-600">₹{grandTotal}</p>
          </div>
          <button
            onClick={() => setActiveTab('checkout')}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-black py-3 px-5 rounded-xl shadow-md text-sm active:scale-95"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
