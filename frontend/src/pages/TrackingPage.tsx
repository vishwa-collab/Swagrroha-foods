import React, { useState, useEffect, useRef } from 'react';
import { useCart, PlacedOrder, OrderStageStatus } from '../context/CartContext';
import { OrderPipeline } from '../components/OrderPipeline';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://swagrroha-foods.onrender.com';

import { 
  Search, 
  PackageCheck, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Package, 
  Truck, 
  Home, 
  MapPin, 
  Phone,
  RefreshCw,
  ShoppingBag,
  Check,
  Star,
  Send
} from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const { currentOrder, trackedOrder, allOrders, fetchOrderForTracking, setActiveTab, submitReview } = useCart();
  
  // Pick active order: trackedOrder || currentOrder || most recent placed order in allOrders
  const initialOrder = trackedOrder || currentOrder || (allOrders.length > 0 ? allOrders[0] : null);
  
  const [searchQuery, setSearchQuery] = useState(initialOrder?.orderId || '');
  const [activeOrder, setActiveOrder] = useState<PlacedOrder | null>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Rating state
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Synchronize when active order changes
  useEffect(() => {
    if (initialOrder) {
      // Find latest updated copy of initialOrder from allOrders
      const latestCopy = allOrders.find(o => o.orderId === initialOrder.orderId) || initialOrder;
      setActiveOrder(latestCopy);
      if (!searchQuery) {
        setSearchQuery(latestCopy.orderId);
      }
    }
  }, [allOrders, currentOrder, trackedOrder]);

  // Reset review state when active order changes
  useEffect(() => {
    setSelectedStar(0);
    setHoveredStar(0);
    setReviewComment('');
    setReviewSubmitted(!!activeOrder?.review);
  }, [activeOrder?.orderId]);

  // Live Auto-Poll every 5s — fetch DIRECTLY from Render API to always get latest admin status
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const orderId = activeOrder?.orderId;
    if (!orderId) return;

    const pollLiveStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (res.ok) {
          const fresh: PlacedOrder = await res.json();
          // Only update UI if something actually changed
          setActiveOrder(prev => {
            if (!prev || prev.status !== fresh.status || prev.paymentStatus !== fresh.paymentStatus) {
              return fresh;
            }
            return prev;
          });
        }
      } catch {
        // Render may be sleeping — silently skip, next poll will retry
      }
    };

    // Poll immediately, then every 5 seconds
    pollLiveStatus();
    pollingRef.current = setInterval(pollLiveStatus, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeOrder?.orderId]);

  const handleSearch = async (showLoadingSpinner: boolean = true) => {
    if (!searchQuery.trim()) return;
    if (showLoadingSpinner) setLoading(true);
    setErrorMsg('');

    const res = await fetchOrderForTracking(searchQuery.trim());
    if (res) {
      setActiveOrder(res);
    } else {
      setErrorMsg('No order found with this ID or Mobile Number. Please check and try again.');
    }
    if (showLoadingSpinner) setLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!activeOrder || selectedStar === 0) return;
    setReviewSubmitting(true);
    const result = await submitReview(activeOrder.orderId, selectedStar, reviewComment);
    setReviewSubmitting(false);
    if (result.success) {
      setReviewSubmitted(true);
      setActiveOrder(prev => prev ? { ...prev, review: { rating: selectedStar, comment: reviewComment } } : null);
    }
  };

  const STAGES: { key: OrderStageStatus; label: string; icon: any; desc: string }[] = [
    { key: 'PLACED', label: 'Order Placed', icon: PackageCheck, desc: 'Your order was received successfully' },
    { key: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle2, desc: 'PJR Swagrooha Foods accepted your order' },
    { key: 'PREPARING', label: 'Preparing Food', icon: ChefHat, desc: 'Fresh homemade batch being cooked in kitchen' },
    { key: 'READY', label: 'Ready & Packed', icon: Package, desc: 'Food items packed & sealed for delivery' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck, desc: 'On scooty route to your area' },
    { key: 'DELIVERED', label: 'Delivered', icon: Home, desc: 'Enjoy your fresh homemade food!' },
  ];

  const getStageIndex = (status?: OrderStageStatus) => {
    if (!status) return 0;
    const idx = STAGES.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const currentStageIndex = getStageIndex(activeOrder?.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          📡 Live Automatic Order Status Tracker
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900">Track Your Swagrooha Order</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          {activeOrder 
            ? `Showing live status updates for Order #${activeOrder.orderId}`
            : 'Enter your Order ID or registered Mobile Number below to track.'
          }
        </p>
      </div>

      {/* Search Bar - Shown or collapsible */}
      <div className="bg-white p-4 rounded-3xl shadow-swiggy border border-slate-100 max-w-xl mx-auto flex items-center gap-3">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search another Order ID or Mobile Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(true)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          onClick={() => handleSearch(true)}
          disabled={loading}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all shrink-0"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>{loading ? 'Searching...' : 'Search'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-200 text-center text-xs font-bold max-w-md mx-auto">
          {errorMsg}
        </div>
      )}

      {/* DIRECT ACTIVE ORDER TRACKING TIMELINE */}
      {activeOrder ? (
        <div className="space-y-8">
          
          {/* Top Status Card */}
          <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider block">
                  Active Order ID: #{activeOrder.orderId}
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                  Payment ID: {activeOrder.utrNumber || 'N/A'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
                <span>Current Status:</span>
                <span className="bg-brand-500 text-white px-3 py-0.5 rounded-xl text-lg shadow">
                  {STAGES[currentStageIndex]?.label}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-2">
                Scheduled Delivery: <strong className="text-amber-300">{activeOrder.deliveryDate?.dayOfWeekName || (typeof activeOrder.deliveryDate === 'string' ? activeOrder.deliveryDate : 'Upcoming Saturday')} ({activeOrder.deliveryDate?.formattedDate || ''})</strong>
              </p>
            </div>

            <div className="text-right sm:text-right shrink-0 space-y-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Auto Syncing Live
              </span>
              <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border block ${
                (activeOrder.paymentStatus === 'VERIFIED_PAID' || activeOrder.paymentStatus === 'PAID_VIA_RAZORPAY' || activeOrder.status !== 'PLACED')
                  ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50'
                  : 'bg-amber-900/60 text-amber-300 border-amber-500/50 animate-pulse'
              }`}>
                {(activeOrder.paymentStatus === 'VERIFIED_PAID' || activeOrder.paymentStatus === 'PAID_VIA_RAZORPAY' || activeOrder.status !== 'PLACED')
                  ? '✅ Payment Verified'
                  : '⏳ Payment Pending Verification'
                }
              </span>
            </div>
          </div>

          {/* SWIGGY-STYLE STAGE PIPELINE WITH CONNECTED PROGRESS LINE */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-swiggy border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Live Order Stage Tracker</h3>
                <p className="text-xs text-slate-400">Updates live in real time as your order progresses</p>
              </div>
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                Step {currentStageIndex + 1} of 6
              </span>
            </div>

            {/* CONNECTED ORDER PIPELINE */}
            <div className="pt-2 pb-1">
              <OrderPipeline currentStatus={activeOrder.status || 'PLACED'} />
            </div>
          </div>

          {/* Order Details & Address Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Items Summary */}
            <div className="md:col-span-7 bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-4">
              <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Ordered Food Items</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {(activeOrder.items || []).map((item, idx) => {
                  const pName = item.product?.name || (item as any).name || (item as any).productName || 'Food Item';
                  const wLabel = item.selectedWeightLabel || (item as any).weightLabel || '';
                  const price = item.unitPrice || (item.product?.basePrice) || 0;
                  const qty = item.quantity || 1;
                  return (
                    <div key={item.cartItemId || String(idx)} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">{pName}</span>
                        {wLabel && <span className="text-slate-500 ml-2 font-medium">({wLabel}) × {qty}</span>}
                        {!wLabel && <span className="text-slate-500 ml-2 font-medium">× {qty}</span>}
                      </div>
                      <span className="font-bold text-slate-900">₹{price * qty}</span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount Paid</span>
                <span className="text-brand-600">₹{activeOrder.totalAmount}</span>
              </div>
            </div>

            {/* Delivery Contact Info */}
            <div className="md:col-span-5 bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-4 text-xs">
              <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Delivery Details</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 font-medium block">Customer Name</span>
                  <span className="font-bold text-slate-900">{activeOrder.customer?.name || 'Customer'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Mobile Number</span>
                  <span className="font-bold text-slate-900">{activeOrder.customer?.phone || (activeOrder as any).phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Delivery Route Zone</span>
                  <span className="font-bold text-brand-600">{activeOrder.area?.name || 'Standard Area'} (Delivery Fee: ₹{activeOrder.deliveryCharge || 0})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Full Address</span>
                  <span className="font-semibold text-slate-700 leading-relaxed">{activeOrder.customer?.address || (activeOrder as any).address || 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* ⭐ RATING WIDGET — shown only when DELIVERED */}
          {activeOrder.status === 'DELIVERED' && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-md">
              {reviewSubmitted || activeOrder.review ? (
                <div className="text-center space-y-3">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`w-7 h-7 ${
                          s <= (activeOrder.review?.rating || selectedStar)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="font-black text-slate-900 text-lg">Thank you for your review! 🙏</p>
                  <p className="text-sm text-slate-500">
                    You rated us <strong className="text-amber-600">{activeOrder.review?.rating || selectedStar} out of 5 stars</strong>.
                    {activeOrder.review?.comment && (
                      <span className="block mt-1 italic text-slate-400">"{activeOrder.review.comment}"</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-2xl">🎉</span>
                    <h3 className="font-black text-slate-900 text-lg mt-1">Your Order Was Delivered!</h3>
                    <p className="text-xs text-slate-500 mt-1">How was your experience with PJR Swagrooha Foods?</p>
                  </div>

                  {/* Star Picker */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setSelectedStar(star)}
                        className="transition-transform hover:scale-125 active:scale-95"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            star <= (hoveredStar || selectedStar)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {selectedStar > 0 && (
                    <>
                      <div className="text-center text-sm font-bold text-amber-700">
                        {['', '😞 Poor', '😐 Fair', '😊 Good', '😄 Great', '🤩 Excellent!'][selectedStar]}
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Write a short comment (optional)…"
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <button
                        onClick={handleSubmitReview}
                        disabled={reviewSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black py-3.5 rounded-2xl shadow-md shadow-amber-400/30 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {reviewSubmitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {reviewSubmitting ? 'Submitting...' : 'Submit My Review'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 space-y-3 border border-slate-100 shadow-sm max-w-lg mx-auto">
          <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-extrabold text-slate-800 text-lg">No Active Order Found</h3>
          <p className="text-xs text-slate-500">
            You haven't placed an order yet. Place an order to track live delivery status updates!
          </p>
          <button
            onClick={() => setActiveTab('products')}
            className="inline-flex items-center gap-2 bg-brand-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow mt-2"
          >
            Browse Products Menu
          </button>
        </div>
      )}

      {/* MY ACCOUNT & ALL PAST ORDERS HISTORY */}
      {allOrders.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-swiggy border border-slate-100 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <span>My Account & Orders History</span>
                <span className="bg-brand-100 text-brand-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {allOrders.length} {allOrders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                All successful payments and orders linked to your account.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {allOrders.map((ord) => (
              <div 
                key={ord.orderId}
                className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                  activeOrder?.orderId === ord.orderId 
                    ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">Order #{ord.orderId}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        ₹{ord.totalAmount} Paid Online
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Customer: {ord.customer?.name || 'Customer'} ({ord.customer?.phone || (ord as any).phone || 'N/A'}) • {new Date(ord.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveOrder(ord);
                        setSearchQuery(ord.orderId);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition-all"
                    >
                      Track Status
                    </button>
                  </div>
                </div>

                {/* Items Summary & Delivery Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-semibold block">Ordered Items:</span>
                    <p className="font-bold text-slate-800">
                      {(ord.items || []).map(i => {
                        const name = i.product?.name || (i as any).name || (i as any).productName || 'Item';
                        const w = i.selectedWeightLabel || (i as any).weightLabel || '';
                        return `${name}${w ? ` (${w})` : ''} × ${i.quantity || 1}`;
                      }).join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Scheduled Delivery:</span>
                    <p className="font-bold text-amber-700">
                      {ord.deliveryDate?.dayOfWeekName || (typeof ord.deliveryDate === 'string' ? ord.deliveryDate : 'Upcoming Saturday')} ({ord.deliveryDate?.formattedDate || ''})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
