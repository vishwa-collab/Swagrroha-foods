import React, { useState, useEffect, useRef } from 'react';
import { useCart, PlacedOrder, OrderStageStatus } from '../context/CartContext';

// Always poll the live Render backend — never trust stale localStorage
const API_BASE = 'https://swagrroha-foods.onrender.com';
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
  Check
} from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const { currentOrder, trackedOrder, allOrders, fetchOrderForTracking, setActiveTab } = useCart();
  
  // Pick active order: trackedOrder || currentOrder || most recent placed order in allOrders
  const initialOrder = trackedOrder || currentOrder || (allOrders.length > 0 ? allOrders[0] : null);
  
  const [searchQuery, setSearchQuery] = useState(initialOrder?.orderId || '');
  const [activeOrder, setActiveOrder] = useState<PlacedOrder | null>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
                Scheduled Delivery: <strong className="text-amber-300">{activeOrder.deliveryDate.dayOfWeekName} ({activeOrder.deliveryDate.formattedDate})</strong>
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

          {/* SWIGGY-STYLE STAGE TIMELINE WITH CORRECT CHECKMARKS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-swiggy border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Live Order Stage Tracker</h3>
                <p className="text-xs text-slate-400">Updates live when PJR Swagrooha owner updates status</p>
              </div>
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                Step {currentStageIndex + 1} of 6
              </span>
            </div>

            {/* STAGE TIMELINE STEPS WITH CHECKMARKS */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 text-center pt-2">
              
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isCompleted = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage.key} className="flex sm:flex-col items-center gap-3 sm:gap-2 relative">
                    
                    {/* Circle Indicator with Green Checkmark */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md shrink-0 ${
                      isCurrent
                        ? 'bg-brand-500 text-white ring-4 ring-brand-500/30 scale-110'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-6 h-6 stroke-[3]" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>

                    {/* Label & Description */}
                    <div className="text-left sm:text-center space-y-0.5">
                      <p className={`text-xs font-extrabold flex items-center gap-1 ${
                        isCurrent ? 'text-brand-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {stage.label}
                        {isCompleted && <span className="text-emerald-600 text-[10px]">✓</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight hidden sm:block max-w-[100px] mx-auto">
                        {stage.desc}
                      </p>
                    </div>

                  </div>
                );
              })}

            </div>
          </div>

          {/* Order Details & Address Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Items Summary */}
            <div className="md:col-span-7 bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-4">
              <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Ordered Food Items</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {activeOrder.items.map(item => (
                  <div key={item.cartItemId} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900">{item.product.name}</span>
                      <span className="text-slate-500 ml-2 font-medium">({item.selectedWeightLabel}) × {item.quantity}</span>
                    </div>
                    <span className="font-bold text-slate-900">₹{item.unitPrice * item.quantity}</span>
                  </div>
                ))}
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
                  <span className="font-bold text-slate-900">{activeOrder.customer.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Mobile Number</span>
                  <span className="font-bold text-slate-900">{activeOrder.customer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Delivery Route Zone</span>
                  <span className="font-bold text-brand-600">{activeOrder.area?.name || 'Standard'} (Delivery Fee: ₹{activeOrder.deliveryCharge})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Full Address</span>
                  <span className="font-semibold text-slate-700 leading-relaxed">{activeOrder.customer.address}</span>
                </div>
              </div>
            </div>

          </div>

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
                      Customer: {ord.customer.name} ({ord.customer.phone}) • {new Date(ord.createdAt).toLocaleDateString()}
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
                      {ord.items.map(i => `${i.product.name} (${i.selectedWeightLabel}) × ${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Scheduled Delivery:</span>
                    <p className="font-bold text-amber-700">
                      {ord.deliveryDate?.dayOfWeekName} ({ord.deliveryDate?.formattedDate})
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
