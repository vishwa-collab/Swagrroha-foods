import React, { useState } from 'react';
import { PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Search, ShieldCheck, Zap, Sparkles, Package } from 'lucide-react';

const CATEGORIES = ['All', 'Snacks', 'Sweets', 'Pickles'] as const;
type Category = typeof CATEGORIES[number];

export const ProductsPage: React.FC = () => {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const [selectedWeights, setSelectedWeights] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    PRODUCTS.forEach(p => { init[p.id] = p.weightOptions[0].label; });
    return init;
  });

  const handleWeightChange = (productId: string, weightLabel: string) => {
    setSelectedWeights(prev => ({ ...prev, [productId]: weightLabel }));
  };

  const handleAddToCart = (product: any, weightLabel: string) => {
    addToCart(product, weightLabel);
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedItems(prev => ({ ...prev, [product.id]: false })), 1200);
  };

  const filteredProducts = PRODUCTS.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || 
                        (p.teluguName && p.teluguName.includes(searchQuery)) ||
                        p.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const catEmojis: Record<Category, string> = {
    All: '🍱', Snacks: '🫙', Sweets: '🍮', Pickles: '🌶️'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 pb-28 md:pb-12">
      
      {/* ── Page Header ─────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl text-white hero-bg shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 hero-glow-orange opacity-80 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 hero-glow-amber opacity-40 pointer-events-none" />
        
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-[11px] font-black uppercase tracking-widest mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Fresh Batch · Homemade Catalogue
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Our Complete Menu</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md font-medium">
              Choose your weight below — prices auto-update. Freshly prepared every weekend!
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Snacks', price: '₹350/kg', color: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
              { label: 'Sweets', price: '₹380/kg', color: 'text-purple-300 border-purple-500/40 bg-purple-500/10' },
              { label: 'Chicken', price: 'From ₹400', color: 'text-red-300 border-red-500/40 bg-red-500/10' },
              { label: 'Mutton', price: 'From ₹600', color: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
            ].map(b => (
              <div key={b.label} className={`tag-chip ${b.color}`}>
                <span className="font-black">{b.label}:</span> {b.price}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────── */}
      <div className="glass-white rounded-2xl p-3 sm:p-4 shadow-swiggy border border-slate-100 flex flex-col sm:flex-row items-center gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-brand-500 text-white shadow-brand'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{catEmojis[cat]}</span>
              {cat === 'All' ? 'All Items' : cat}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1" />

        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input 
            type="text"
            placeholder="Search snacks, sweets, pickles…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition placeholder:text-slate-400"
          />
        </div>

        {/* Result count */}
        <div className="ml-auto text-xs font-bold text-slate-400 shrink-0">
          {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Products Grid ────────────────────── */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-bold text-slate-700 text-lg">No products found</p>
          <p className="text-xs text-slate-400 mt-1">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map(product => {
            const currentWeightLabel = selectedWeights[product.id] || product.weightOptions[0].label;
            const currentWeightOpt = product.weightOptions.find(w => w.label === currentWeightLabel) || product.weightOptions[0];
            const calculatedPrice = Math.round(product.basePrice * currentWeightOpt.multiplier);
            const isAdded = addedItems[product.id];

            return (
              <div key={product.id} className="group bg-white rounded-3xl overflow-hidden card-product flex flex-col border border-slate-100">
                
                {/* Image — clear, no dark overlay */}
                <div className="relative h-52 overflow-hidden bg-white shrink-0 border-b border-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  
                  {/* Small badges only — no full dark overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.isBestseller && (
                      <span className="badge-hot flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Bestseller
                      </span>
                    )}
                    {product.isNew && (
                      <span className="badge-new flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> New
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 uppercase tracking-wide shadow-sm">
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex-grow space-y-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-tight">{product.name}</h3>
                      {product.teluguName && (
                        <p className="text-xs font-bold text-amber-600 mt-0.5">{product.teluguName}</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{product.description}</p>

                    {/* Weight Selector — dropdown for all options */}
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <Package className="w-3 h-3" /> Select Weight:
                      </p>
                      <select
                        value={currentWeightLabel}
                        onChange={e => handleWeightChange(product.id, e.target.value)}
                        className="w-full px-3 py-2.5 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 cursor-pointer transition-all"
                      >
                        {product.weightOptions.map(opt => {
                          const price = Math.round(product.basePrice * opt.multiplier);
                          return (
                            <option key={opt.label} value={opt.label}>
                              {opt.label} — ₹{price}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Footer: Price + Add */}
                  <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">For {currentWeightLabel}</p>
                      <p className="text-2xl font-black text-slate-900 leading-none mt-0.5">₹{calculatedPrice}</p>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product, currentWeightLabel)}
                      className={`flex items-center gap-2 font-black text-xs px-5 py-3 rounded-2xl transition-all duration-300 active:scale-95 shadow-md ${
                        isAdded
                          ? 'bg-emerald-500 text-white shadow-emerald'
                          : 'btn-primary text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>✓ Added!</>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
