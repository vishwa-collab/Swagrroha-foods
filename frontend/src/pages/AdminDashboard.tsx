import React, { useState, useEffect } from 'react';
import { useCart, PlacedOrder, OrderStageStatus } from '../context/CartContext';
import { AdminLoginPage } from './AdminLoginPage';
import { DELIVERY_AREAS } from '../data/deliveryAreas';
import { 
  Truck, 
  MapPin, 
  ChefHat, 
  Package, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  LogOut,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  PackageCheck,
  FileCheck,
  Eye,
  X,
  Hash,
  Copy,
  Trash2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { adminToken, logoutAdmin, updateOrderStatus, allOrders, clearAllOrders, showToast } = useCart();
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [activeTabSection, setActiveTabSection] = useState<'new' | 'active' | 'history' | 'route-grouping'>('new');
  const [loading, setLoading] = useState(false);
  const [copiedUtrMap, setCopiedUtrMap] = useState<{ [key: string]: boolean }>({});

  const handleClearAll = async () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL order history and start fresh? This will wipe all test orders.')) {
      await clearAllOrders();
      setOrders([]);
      showToast('🧹 All order history deleted! Store is reset and fresh.');
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchOrders();
      // Auto-poll every 3 seconds for real-time customer order updates!
      const interval = setInterval(() => {
        fetchOrders();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [adminToken, allOrders]);

  const fetchOrders = async () => {
    setLoading(true);
    let fetchedList: PlacedOrder[] = [];

    // 1. Fetch from API
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        fetchedList = await res.json();
      }
    } catch (e) {
      console.log('Using local order storage sync');
    }

    // 2. Read from localStorage backup
    const savedLocal = localStorage.getItem('swagrooha_all_orders');
    const localList: PlacedOrder[] = savedLocal ? JSON.parse(savedLocal) : [];

    // 3. Combine & Deduplicate by orderId
    const map = new Map<string, PlacedOrder>();
    
    // Add API orders
    fetchedList.forEach(o => map.set(o.orderId, o));
    // Add local Context orders
    allOrders.forEach(o => {
      if (!map.has(o.orderId)) map.set(o.orderId, o);
    });
    // Add localStorage orders
    localList.forEach(o => {
      if (!map.has(o.orderId)) map.set(o.orderId, o);
    });

    const merged = Array.from(map.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    setOrders(merged);
    setLoading(false);
  };

  const handleVerifyAndConfirm = async (orderId: string) => {
    await updateOrderStatus(orderId, 'CONFIRMED', 'VERIFIED_PAID');
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'CONFIRMED', paymentStatus: 'VERIFIED_PAID' } : o));
    showToast(`Payment verified for order ${orderId}!`);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStageStatus) => {
    await updateOrderStatus(orderId, newStatus);
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
  };

  const copyOrderUtr = (utr: string, orderId: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtrMap(prev => ({ ...prev, [orderId]: true }));
    showToast(`UTR ${utr} copied! Match in PhonePe app.`);
    setTimeout(() => {
      setCopiedUtrMap(prev => ({ ...prev, [orderId]: false }));
    }, 2500);
  };

  // Filter orders by section
  const newOrders = orders.filter(o => !o.status || o.status === 'PLACED');
  const activeOrders = orders.filter(o => ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status));
  const historyOrders = orders.filter(o => o.status === 'DELIVERED');

  // If owner is not logged in, demand login!
  if (!adminToken) {
    return <AdminLoginPage />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Owner Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Authenticated Owner Admin Panel • vishwa81251@gmail.com
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Owner Order Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage incoming orders, track live status, and coordinate deliveries. Payments are auto-verified.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>

          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all"
            title="Delete all previous test orders and start fresh"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Orders (Start Fresh)
          </button>

          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        
        <button
          onClick={() => setActiveTabSection('new')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTabSection === 'new'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>📦 1. New Orders</span>
          {newOrders.length > 0 && (
            <span className="bg-amber-400 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
              {newOrders.length} NEW
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTabSection('active')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTabSection === 'active'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>🔄 2. Active Orders</span>
          {activeOrders.length > 0 && (
            <span className="bg-emerald-400 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black">
              {activeOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTabSection('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTabSection === 'history'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>📜 3. Order History ({historyOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTabSection('route-grouping')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTabSection === 'route-grouping'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>🗺️ Route & Batch Planning</span>
        </button>

      </div>

      {/* SECTION 1: NEW INCOMING ORDERS WITH UTR VERIFICATION METHOD */}
      {activeTabSection === 'new' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>📦 Incoming New Orders</span>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full">
              Review and Accept Orders
            </span>
          </h2>

          {newOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 space-y-2 border border-slate-100 shadow-sm">
              <PackageCheck className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-extrabold text-slate-700 text-base">No New Orders</p>
              <p className="text-xs">All incoming orders have been accepted.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newOrders.map(order => (
                <div key={order.orderId} className="bg-white rounded-3xl p-6 shadow-swiggy border-2 border-brand-500/40 space-y-4">
                  
                  {/* Order Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <span className="bg-brand-100 text-brand-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded">
                        NEW ORDER #{order.orderId}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-lg mt-1">{order.customer.name}</h3>
                      <p className="text-xs text-slate-500 font-semibold">📞 {order.customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-brand-600">₹{order.totalAmount}</span>
                      <span className="text-[10px] text-slate-400 block font-bold">{order.area?.name || 'Standard'} Zone</span>
                    </div>
                  </div>

                  {/* Customer Address */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <span className="text-slate-400 font-medium block">Delivery Address:</span>
                    <p className="font-bold text-slate-800 leading-snug">{order.customer.address}</p>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1 text-xs">
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Items Ordered:</span>
                    <ul className="divide-y divide-slate-100">
                      {order.items.map((item, idx) => (
                        <li key={item.cartItemId || idx} className="py-1.5 flex justify-between font-bold text-slate-800">
                          <span>• {item.product.name} ({item.selectedWeightLabel})</span>
                          <span>x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* PROMINENT PAYMENT SUCCESS CARD */}
                  <div className="bg-emerald-900 text-white p-4 rounded-2xl border border-emerald-800 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                      <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Payment Auto-Verified
                      </span>
                      <span className="text-emerald-300 bg-emerald-400/20 border border-emerald-400/30 text-[10px] font-extrabold px-2 py-0.5 rounded">
                        SECURE
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-emerald-950 p-2.5 rounded-xl border border-emerald-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-emerald-400 font-bold">Razorpay Payment ID:</span>
                        <span className="font-mono font-black text-sm text-white tracking-wider">
                          {order.utrNumber || 'N/A'}
                        </span>
                      </div>
                      <span className="text-emerald-400 font-black text-lg">
                        ₹{order.totalAmount}
                      </span>
                    </div>
                  </div>

                  {/* Action Button: Confirm Order */}
                  <button
                    onClick={() => handleVerifyAndConfirm(order.orderId)}
                    className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-black py-3.5 px-4 rounded-2xl shadow-md transition-all text-xs uppercase tracking-wider"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Order & Start Preparing</span>
                  </button>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: ACTIVE ORDERS IN PROGRESS */}
      {activeTabSection === 'active' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>🔄 Active Orders in Progress</span>
            <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-full">
              Click stage buttons to update live tracking
            </span>
          </h2>

          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 space-y-2 border border-slate-100 shadow-sm">
              <ChefHat className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-extrabold text-slate-700 text-base">No Active Orders in Progress</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeOrders.map(order => (
                <div key={order.orderId} className="bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-5">
                  
                  {/* Top Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-lg">#{order.orderId}</span>
                        <span className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-0.5 rounded-full uppercase">
                          Payment Verified • ID: {order.utrNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-bold mt-1">
                        Customer: <strong className="text-slate-900">{order.customer.name}</strong> • 📞 {order.customer.phone} • 📍 Zone: <strong className="text-brand-600">{order.area?.name || 'Standard'}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900">₹{order.totalAmount}</span>
                      <span className="text-xs text-slate-400 font-semibold block">Saturday Batch</span>
                    </div>
                  </div>

                  {/* Address & Items summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium block">Address:</span>
                      <p className="font-bold text-slate-800 leading-snug">{order.customer.address}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium block">Items:</span>
                      <p className="font-bold text-slate-800">
                        {order.items.map(i => `${i.product.name} (${i.selectedWeightLabel}) x${i.quantity}`).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* STAGE CONTROL BUTTONS FOR OWNER */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Update Live Customer Tracking Stage:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      
                      {/* Stage 1: PREPARING */}
                      <button
                        onClick={() => handleStatusChange(order.orderId, 'PREPARING')}
                        className={`p-3 rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all border ${
                          order.status === 'PREPARING'
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md scale-105'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <ChefHat className="w-4 h-4" />
                        Preparing
                      </button>

                      {/* Stage 2: READY */}
                      <button
                        onClick={() => handleStatusChange(order.orderId, 'READY')}
                        className={`p-3 rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all border ${
                          order.status === 'READY'
                            ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-105'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        Ready & Packed
                      </button>

                      {/* Stage 3: OUT_FOR_DELIVERY */}
                      <button
                        onClick={() => handleStatusChange(order.orderId, 'OUT_FOR_DELIVERY')}
                        className={`p-3 rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all border ${
                          order.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-purple-600 text-white border-purple-700 shadow-md scale-105'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        Out for Delivery
                      </button>

                      {/* Stage 4: DELIVERED */}
                      <button
                        onClick={() => handleStatusChange(order.orderId, 'DELIVERED')}
                        className={`p-3 rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all border ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-105'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Delivered
                      </button>

                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: ORDER HISTORY */}
      {activeTabSection === 'history' && (
        <div className="bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-4">
          <h2 className="text-xl font-black text-slate-900">📜 Completed Order History</h2>
          
          {historyOrders.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No completed orders archived yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {historyOrders.map(order => (
                <div key={order.orderId} className="py-4 flex justify-between items-center">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm">#{order.orderId} — {order.customer.name}</span>
                    <span className="text-slate-500 ml-2 font-medium">(Payment ID: {order.utrNumber})</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {order.items.map(i => `${i.product.name} (${i.selectedWeightLabel})`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 text-base">₹{order.totalAmount}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded block mt-0.5">
                      DELIVERED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: ROUTE GROUPING */}
      {activeTabSection === 'route-grouping' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900">🗺️ Route Delivery Grouping (Hayathnagar ➔ IBPM)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DELIVERY_AREAS.map(area => {
              const areaOrders = orders.filter(o => o.area?.name === area.name);
              return (
                <div key={area.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-900 text-sm">{area.name} Zone</span>
                    <span className="text-xs font-black bg-brand-500 text-white px-2.5 py-0.5 rounded-full">
                      {areaOrders.length}
                    </span>
                  </div>
                  {areaOrders.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No orders for this area.</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {areaOrders.map(o => (
                        <div key={o.orderId} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between">
                          <span className="font-bold text-slate-800">{o.customer.name} (ID: {o.utrNumber})</span>
                          <span className="text-brand-600 font-bold">₹{o.totalAmount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
