import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import { IMAGES } from '../assets/images';
import {
  ShoppingBag, ChevronRight, Phone, MessageCircle,
  MapPin, CheckCircle, Clock, Package, Zap, ArrowRight, Sparkles
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setActiveTab, addToCart, fetchLiveRating } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [liveRating, setLiveRating] = useState<{ avg: number; count: number }>({ avg: 4.9, count: 500 });

  useEffect(() => {
    fetchLiveRating().then(data => {
      setLiveRating({ avg: data.averageRating, count: data.count });
    });
  }, []);

  const bestsellers = PRODUCTS.filter(p => p.isBestseller).slice(0, 4);

  const heroSlides = [
    { img: IMAGES.murukulu, label: 'Crispy Murukulu', sub: 'మురుకులు' },
    { img: IMAGES.gujiya, label: 'Sweet Gujiya', sub: 'గుజియా' },
    { img: IMAGES.chickenPickle, label: 'Chicken Pickle', sub: 'చికెన్ పచ్చడి' },
  ];

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % heroSlides.length), 3500);
    return () => clearInterval(t);
  }, []);

  const handleAdd = (product: typeof PRODUCTS[0]) => {
    addToCart(product, product.weightOptions[0].label);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1400);
  };

  const whyUs = [
    { emoji: '🏡', title: 'Own Kitchen', desc: 'Made fresh in our home', bg: 'bg-orange-50', border: 'border-orange-200' },
    { emoji: '🚫', title: 'No Preservatives', desc: 'Pure, natural ingredients', bg: 'bg-green-50', border: 'border-green-200' },
    { emoji: '📦', title: 'Flexible Packs', desc: '250g · 500g · 1kg · 2kg+', bg: 'bg-blue-50', border: 'border-blue-200' },
    { emoji: '🛵', title: 'Weekend Delivery', desc: 'Sat & Sun to your door', bg: 'bg-purple-50', border: 'border-purple-200' },
  ];

  return (
    <div className="bg-white">

      {/* ═══════════════════════════════════════
          HERO — white bg, split layout
      ═══════════════════════════════════════ */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — text */}
          <div>
            {/* Brand mark */}
            <div className="flex items-center gap-3 mb-6">
              <img
                src={IMAGES.logo}
                alt="PJR Swagrooha Foods"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Est. Home Kitchen</p>
                <p className="text-slate-800 font-black text-base leading-tight">PJR Swagrooha Foods</p>
              </div>
            </div>

            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full mb-5">
              <Sparkles className="w-3 h-3" />
              100% Homemade · Batch Fresh
            </span>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-4">
              Authentic Telugu<br />
              <span className="text-orange-500">Homemade Flavours</span>
            </h1>

            <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed mb-8 max-w-md">
              Fresh murukulu, sweets & pickles — made in small batches and delivered every weekend along the Hayathnagar → Ibrahimpatnam route.
            </p>

            {/* Quick stats */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
              {[
                { val: '500+', label: 'Happy Customers' },
                { val: '12+', label: 'Varieties' },
                { val: `${liveRating.avg} ★`, label: 'Customer Rating' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-slate-900 font-black text-xl">{s.val}</p>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('products')}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-sm px-7 py-3.5 rounded-2xl transition-all shadow-md shadow-orange-200"
              >
                <ShoppingBag className="w-4 h-4" /> Order Now
              </button>
              <a
                href="https://wa.me/918125154114?text=Hi%20PJR%20Swagrooha%20Foods%2C%20I%20want%20to%20order!"
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold text-sm px-6 py-3.5 rounded-2xl transition-all"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Right — clear rotating food photo */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-[380px] lg:h-[380px]">
              {/* Light orange ring glow */}
              <div className="absolute inset-0 rounded-full bg-orange-100 border-4 border-orange-200 shadow-xl overflow-hidden">
                {heroSlides.map((s, i) => (
                  <img
                    key={s.label}
                    src={s.img}
                    alt={s.label}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                      i === heroIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ objectFit: 'cover' }}
                  />
                ))}
              </div>

              {/* Floating label — below image, no overlay */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-max bg-white border border-slate-200 rounded-2xl px-5 py-2.5 shadow-lg text-center">
                <p className="text-slate-900 font-black text-sm">{heroSlides[heroIndex].label}</p>
                <p className="text-orange-500 text-xs font-bold">{heroSlides[heroIndex].sub}</p>
              </div>

              {/* Dot indicators */}
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIndex(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === heroIndex ? 'w-5 h-2 bg-orange-500' : 'w-2 h-2 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TRUST STRIP
      ═══════════════════════════════════════ */}
      <section className="bg-orange-500">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex flex-wrap justify-center gap-x-8 gap-y-1.5">
          {[
            { icon: '✅', text: 'No Preservatives' },
            { icon: '🏡', text: 'Made in Our Home Kitchen' },
            { icon: '📦', text: '250g – 2kg+ Packs' },
            { icon: '🛵', text: 'Weekend Delivery' },
          ].map(t => (
            <div key={t.text} className="flex items-center gap-2 text-xs font-bold text-white">
              <span>{t.icon}</span>
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CATEGORIES — white cards, clear images
      ═══════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 pt-14 pb-8">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="text-[11px] font-black text-orange-500 uppercase tracking-widest mb-1">Browse</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">What We Make</h2>
          </div>
          <button onClick={() => setActiveTab('products')} className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              label: 'Snacks',
              sub: 'Murukulu, Sakinalu & More',
              tag: 'Most Popular',
              tagColor: 'bg-orange-100 text-orange-700 border-orange-200',
              img: IMAGES.murukulu,
              price: 'from ₹88',
              items: '7 varieties',
            },
            {
              label: 'Sweets',
              sub: 'Gujiya, Ariselu & Laddu',
              tag: 'Festival Special',
              tagColor: 'bg-purple-100 text-purple-700 border-purple-200',
              img: IMAGES.gujiya,
              price: 'from ₹95',
              items: '3 varieties',
            },
            {
              label: 'Pickles',
              sub: 'Chicken & Mutton Pickle',
              tag: 'Non-Veg',
              tagColor: 'bg-red-100 text-red-700 border-red-200',
              img: IMAGES.chickenPickle,
              price: 'from ₹400',
              items: '2 varieties',
            },
          ].map(cat => (
            <button
              key={cat.label}
              onClick={() => setActiveTab('products')}
              className="group bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
            >
              {/* Clear image — NO dark overlay */}
              <div className="h-52 sm:h-56 overflow-hidden bg-white">
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Card body — white background */}
              <div className="p-5 bg-white">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-slate-900 font-black text-lg leading-tight">{cat.label}</h3>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">{cat.sub}</p>
                  </div>
                  <span className={`text-[10px] font-black border rounded-full px-2.5 py-1 shrink-0 ${cat.tagColor}`}>
                    {cat.tag}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">{cat.items}</p>
                    <p className="text-sm font-black text-slate-900">{cat.price}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-500 group-hover:gap-2 transition-all">
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHY US
      ═══════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {whyUs.map(w => (
            <div key={w.title} className={`${w.bg} border ${w.border} rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}>
              <div className="text-3xl mb-3">{w.emoji}</div>
              <p className="font-black text-slate-900 text-sm">{w.title}</p>
              <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BESTSELLERS — white cards, clear images
      ═══════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="text-[11px] font-black text-orange-500 uppercase tracking-widest mb-1">Top Picks</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Bestsellers</h2>
          </div>
          <button onClick={() => setActiveTab('products')} className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
            See All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {bestsellers.map(product => {
            const lowestPrice = Math.round(product.basePrice * product.weightOptions[0].multiplier);
            const isAdded = addedId === product.id;
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-150 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                {/* Clear image — white bg, NO dark overlay */}
                <div className="h-40 sm:h-44 bg-white overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Only a small badge, not full overlay */}
                  <span className="absolute top-2.5 left-2.5 bg-orange-500 text-white text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Zap className="w-2.5 h-2.5" /> Best
                  </span>
                </div>

                {/* White card body */}
                <div className="p-4 flex flex-col flex-grow bg-white">
                  <p className="font-black text-slate-900 text-sm leading-snug line-clamp-2 flex-grow">{product.name}</p>
                  {product.teluguName && (
                    <p className="text-[10px] text-orange-500 font-bold mt-1">{product.teluguName}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">From</p>
                      <p className="text-base font-black text-slate-900">₹{lowestPrice}</p>
                    </div>
                    <button
                      onClick={() => handleAdd(product)}
                      className={`flex items-center gap-1.5 text-[11px] font-black px-3.5 py-2 rounded-xl transition-all duration-300 active:scale-95 ${
                        isAdded
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                      }`}
                    >
                      {isAdded ? <><CheckCircle className="w-3 h-3" /> Added</> : <><ShoppingBag className="w-3 h-3" /> Add</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          DELIVERY ROUTE BANNER
      ═══════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-8">
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="text-orange-400 text-[11px] font-black uppercase tracking-widest">Delivery Route</span>
            </div>
            <h2 className="text-white font-black text-xl sm:text-2xl leading-snug">
              Hayathnagar → LB Nagar<br className="hidden sm:block" /> → Ibrahimpatnam
            </h2>
            <div className="flex flex-wrap gap-4 mt-3">
              <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Every Saturday & Sunday
              </span>
              <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" /> ₹20 – ₹50 delivery charge
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('products')}
              className="bg-orange-500 hover:bg-orange-400 text-white font-black text-sm px-8 py-3.5 rounded-2xl transition-all active:scale-95 text-center shadow-md shadow-orange-900/30"
            >
              Order Now
            </button>
            <a
              href="tel:+918125154114"
              className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-all"
            >
              <Phone className="w-4 h-4 text-green-400" />
              8125154114
            </a>
          </div>
        </div>
      </section>

      <div className="h-8 md:h-4" />
    </div>
  );
};
