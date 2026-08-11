import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCart, PlacedOrder, OrderStageStatus } from '../context/CartContext';
import { AdminLoginPage } from './AdminLoginPage';
import { DELIVERY_AREAS } from '../data/deliveryAreas';
import {
  Truck,
  ChefHat,
  Package,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ShieldCheck,
  PackageCheck,
  AlertCircle,
  Eye,
  X,
  FileCheck,
  Image as ImageIcon
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://swagrroha-foods.onrender.com';
const POLL_INTERVAL_MS = 10000;

// ── Normalize flat backend Order into the nested PlacedOrder shape ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOrder(raw: any): PlacedOrder {
  // If already in nested shape (from localStorage / context), return as-is
  if (raw.customer && typeof raw.customer === 'object') return raw as PlacedOrder;

  return {
    orderId: raw.orderId,
    customer: {
      name: raw.customerName || '',
      phone: raw.customerPhone || '',
      email: raw.customerEmail || '',
      areaId: raw.deliveryArea || '',
      address: raw.customerAddress || '',
    },
    area: {
      id: raw.deliveryArea || '',
      name: raw.deliveryArea || '',
      tier: 'Near',
      charge: raw.deliveryCharge || 0,
      estimatedDeliveryText: '',
    },
    // Map OrderItem[] from backend → CartItem[] shape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (raw.items || []).map((it: any) => ({
      cartItemId: String(it.id || it.productName),
      product: {
        id: String(it.id || it.productName),
        name: it.productName || '',
        basePrice: it.unitPrice || 0,
        weightOptions: [{ label: it.weightLabel || '', multiplier: 1 }],
        category: '',
        image: '',
        description: '',
      },
      selectedWeightLabel: it.weightLabel || '',
      unitPrice: it.unitPrice || 0,
      quantity: it.quantity || 1,
    })),
    subtotal: raw.subtotal || 0,
    deliveryCharge: raw.deliveryCharge || 0,
    totalAmount: raw.totalAmount || 0,
    deliveryDate: raw.deliveryDate
      ? (typeof raw.deliveryDate === 'string'
          ? { formattedDate: raw.deliveryDate, dayName: 'Saturday', daysUntil: 0, dayOfWeekName: 'Saturday', isSameWeekend: false, orderDayName: '' }
          : raw.deliveryDate)
      : { formattedDate: '', dayName: '', daysUntil: 0, dayOfWeekName: '', isSameWeekend: false, orderDayName: '' },
    status: raw.status || 'PLACED',
    paymentStatus: raw.paymentStatus || 'PENDING_VERIFICATION',
    utrNumber: raw.utrNumber || '',
    paymentProof: raw.paymentProof || '',
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export const AdminDashboard: React.FC = () => {
  const { adminToken, logoutAdmin, updateOrderStatus, allOrders, showToast } = useCart();
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [activeTabSection, setActiveTabSection] = useState<'new' | 'active' | 'history' | 'route-grouping'>('new');
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  
  // Track which orders are currently being updated so we can show loading
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  // Screenshot Lightbox Modal State
  const [activeScreenshot, setActiveScreenshot] = useState<{ orderId: string; proofUrl: string } | null>(null);

  // Use a ref to control polling — we pause it during status updates
  const pollPausedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async () => {
    // Don't overwrite UI while a status update is in flight
    if (pollPausedRef.current) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const rawData: unknown[] = await res.json();
        const normalized = rawData.map(normalizeOrder).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setOrders(normalized);
        setBackendOnline(true);
        setLoading(false);
        return;
      }
      setBackendOnline(false);
    } catch (e) {
      console.error('Backend unreachable — falling back to local store', e);
      setBackendOnline(false);
    }

    // Fallback: use context/localStorage if Render is sleeping
    const savedLocal = localStorage.getItem('swagrooha_all_orders');
    const localList: PlacedOrder[] = savedLocal ? JSON.parse(savedLocal) : [];
    const map = new Map<string, PlacedOrder>();
    allOrders.forEach(o => map.set(o.orderId, o));
    localList.forEach(o => { if (!map.has(o.orderId)) map.set(o.orderId, o); });
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    setOrders(merged);
    setLoading(false);
  }, [allOrders]);

  // ── Auto-poll every 10 s while logged in
  useEffect(() => {
    if (!adminToken) return;
    fetchOrders();
    intervalRef.current = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [adminToken, fetchOrders]);

  // ── Status Updater with optimistic UI + pause/resume polling ──
  const applyStatusChange = async (
    orderId: string,
    newStatus: OrderStageStatus,
    newPaymentStatus?: 'VERIFIED_PAID' | undefined
  ) => {
    // 1. Mark order as updating
    setUpdatingOrders(prev => new Set(prev).add(orderId));

    // 2. Pause polling so the next tick doesn't overwrite our optimistic update
    pollPausedRef.current = true;

    // 3. Optimistically update local state immediately
    setOrders(prev =>
      prev.map(o =>
        o.orderId === orderId
          ? { ...o, status: newStatus, ...(newPaymentStatus ? { paymentStatus: newPaymentStatus } : {}) }
          : o
      )
    );

    // 4. Call backend
    const success = await updateOrderStatus(
      orderId,
      newStatus,
      newPaymentStatus
    );

    // 5. Unmark updating
    setUpdatingOrders(prev => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });

    if (success) {
      showToast(`✅ Order ${orderId} → ${newStatus.replace(/_/g, ' ')}`);
    } else {
      // Revert optimistic update if backend failed
      showToast(`❌ Failed to update order ${orderId}. Please try again.`);
      pollPausedRef.current = false;
      await fetchOrders();
      return;
    }

    // 6. Resume polling after 3 seconds
    setTimeout(() => {
      pollPausedRef.current = false;
      fetchOrders();
    }, 3000);
  };

  const handleVerifyAndConfirm = (orderId: string) =>
    applyStatusChange(orderId, 'CONFIRMED', 'VERIFIED_PAID');

  const handleStatusChange = (orderId: string, newStatus: OrderStageStatus) =>
    applyStatusChange(orderId, newStatus);

  // Filter orders strictly by status
  const newOrders     = orders.filter(o => !o.status || o.status === 'PLACED');
  const activeOrders  = orders.filter(o => ['CONFIRMED', 'PAYMENT_VERIFIED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status));
  const historyOrders = orders.filter(o => o.status === 'DELIVERED');

  if (!adminToken) return <AdminLoginPage />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Screenshot Lightbox Modal ── */}
      {activeScreenshot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Payment Screenshot Proof — Order #{activeScreenshot.orderId}
              </span>
              <button
                onClick={() => setActiveScreenshot(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-100 rounded-2xl overflow-hidden max-h-[70vh] flex items-center justify-center border border-slate-200">
              <img
                src={activeScreenshot.proofUrl}
                alt="Payment Screenshot Proof"
                className="object-contain max-h-[70vh] w-full"
              />
            </div>
            <p className="text-xs text-slate-500 text-center font-medium">
              Verify payment in PhonePe / GPay / Bank Account before accepting.
            </p>
          </div>
        </div>
      )}

      {/* ── Owner Header ── */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Authenticated Owner Admin Panel • PJR Swagrooha Foods
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Owner Order Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage incoming orders, verify PhonePe/GPay screenshots, and update live tracking.
          </p>
          <div className="flex items-center gap-3 mt-2">
            {loading && (
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-xs text-slate-400 font-semibold">Syncing…</span>
              </div>
            )}
            {!backendOnline && (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                Offline mode — showing local orders
              </div>
            )}
          </div>
        </div>

        <button
          onClick={logoutAdmin}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">

        <button
          onClick={() => setActiveTabSection('new')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTabSection === 'new'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>📦 New Orders</span>
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
          <span>🔄 Active Orders</span>
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
          <span>📜 History / Completed ({historyOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTabSection('route-grouping')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTabSection === 'route-grouping'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>🗺️ Route Planning</span>
        </button>

      </div>

      {/* ── SECTION 1: NEW INCOMING ORDERS ── */}
      {activeTabSection === 'new' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>📦 Incoming New Orders</span>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full">
              Review and Accept Orders
            </span>
          </h2>

          {loading && orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 space-y-2 border border-slate-100 shadow-sm">
              <RefreshCw className="w-10 h-10 mx-auto text-amber-400 animate-spin" />
              <p className="font-extrabold text-slate-700 text-base">Loading orders from server…</p>
            </div>
          ) : newOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 space-y-2 border border-slate-100 shadow-sm">
              <PackageCheck className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-extrabold text-slate-700 text-base">No New Orders</p>
              <p className="text-xs">All incoming orders accepted. Auto-refreshing every 10 s.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newOrders.map(order => {
                const isUpdating = updatingOrders.has(order.orderId);
                return (
                  <div key={order.orderId} className={`bg-white rounded-3xl p-6 shadow-swiggy border-2 border-brand-500/40 space-y-4 transition-opacity ${isUpdating ? 'opacity-60' : ''}`}>

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

                    {/* Delivery Address */}
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

                    {/* Payment Details & Screenshot Proof Button */}
                    <div className="bg-emerald-900 text-white p-4 rounded-2xl border border-emerald-800 space-y-3 shadow-md">
                      <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Payment Submitted
                        </span>
                        <span className="text-emerald-300 bg-emerald-400/20 border border-emerald-400/30 text-[10px] font-extrabold px-2 py-0.5 rounded">
                          {order.paymentProof ? 'SCREENSHOT UPLOADED' : 'UTR VERIFIED'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 bg-emerald-950 p-2.5 rounded-xl border border-emerald-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-emerald-400 font-bold">UTR / Payment Ref:</span>
                          <span className="font-mono font-black text-sm text-white tracking-wider">
                            {order.utrNumber || 'N/A'}
                          </span>
                        </div>
                        <span className="text-emerald-400 font-black text-lg">₹{order.totalAmount}</span>
                      </div>

                      {/* View Screenshot Proof Button (Option 2) */}
                      {order.paymentProof && (
                        <button
                          type="button"
                          onClick={() => setActiveScreenshot({ orderId: order.orderId, proofUrl: order.paymentProof! })}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold py-2 px-3 rounded-xl transition-all text-xs border border-emerald-500 shadow"
                        >
                          <ImageIcon className="w-4 h-4 text-amber-300" />
                          <span>View Uploaded Payment Screenshot</span>
                          <Eye className="w-3.5 h-3.5 text-emerald-300" />
                        </button>
                      )}
                    </div>

                    {/* Accept Button */}
                    <button
                      onClick={() => handleVerifyAndConfirm(order.orderId)}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-400 text-white font-black py-3.5 px-4 rounded-2xl shadow-md transition-all text-xs uppercase tracking-wider"
                    >
                      {isUpdating
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Saving…</span></>
                        : <><CheckCircle2 className="w-4 h-4" /><span>Accept Order &amp; Start Preparing</span></>
                      }
                    </button>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 2: ACTIVE ORDERS IN PROGRESS ── */}
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
              <p className="text-xs">Accept a new order to see it here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeOrders.map(order => {
                const isUpdating = updatingOrders.has(order.orderId);
                return (
                  <div key={order.orderId} className={`bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-5 transition-opacity ${isUpdating ? 'opacity-60' : ''}`}>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-lg">#{order.orderId}</span>
                          <span className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-0.5 rounded-full uppercase">
                            {order.status.replace(/_/g, ' ')}
                          </span>
                          {order.utrNumber && (
                            <span className="bg-slate-100 text-slate-600 font-bold text-xs px-2 py-0.5 rounded-full">
                              ID: {order.utrNumber}
                            </span>
                          )}
                          {order.paymentProof && (
                            <button
                              type="button"
                              onClick={() => setActiveScreenshot({ orderId: order.orderId, proofUrl: order.paymentProof! })}
                              className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3 text-emerald-600" /> View Screenshot
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-bold mt-1">
                          Customer: <strong className="text-slate-900">{order.customer.name}</strong> •
                          📞 {order.customer.phone} •
                          📍 Zone: <strong className="text-brand-600">{order.area?.name || 'Standard'}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900">₹{order.totalAmount}</span>
                        <span className="text-xs text-slate-400 font-semibold block">Scheduled Delivery</span>
                      </div>
                    </div>

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

                    <div className="space-y-2 pt-2">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                        Update Live Customer Tracking Stage:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {(
                          [
                            { status: 'PREPARING',        label: 'Preparing',       icon: <ChefHat className="w-4 h-4" />,      activeClass: 'bg-amber-500 text-slate-950 border-amber-600' },
                            { status: 'READY',            label: 'Ready & Packed',  icon: <Package className="w-4 h-4" />,      activeClass: 'bg-blue-600 text-white border-blue-700' },
                            { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',icon: <Truck className="w-4 h-4" />,        activeClass: 'bg-purple-600 text-white border-purple-700' },
                            { status: 'DELIVERED',        label: 'Mark Delivered',  icon: <CheckCircle2 className="w-4 h-4" />, activeClass: 'bg-emerald-600 text-white border-emerald-700' },
                          ] as { status: OrderStageStatus; label: string; icon: React.ReactNode; activeClass: string }[]
                        ).map(({ status, label, icon, activeClass }) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(order.orderId, status)}
                            disabled={isUpdating}
                            className={`p-3 rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all border ${
                              order.status === status
                                ? `${activeClass} shadow-md scale-105`
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 disabled:opacity-50'
                            }`}
                          >
                            {isUpdating && order.status !== status
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : icon
                            }
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: COMPLETED ORDER HISTORY (DELIVERED TERMINAL STATUS) ── */}
      {activeTabSection === 'history' && (
        <div className="bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">📜 Completed Order History</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Delivered orders are permanently archived here. Status is terminal and cannot be moved backward.
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full">
              {historyOrders.length} Delivered
            </span>
          </div>

          {historyOrders.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">No completed orders archived yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {historyOrders.map(order => (
                <div key={order.orderId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-sm">#{order.orderId} — {order.customer.name}</span>
                      <span className="text-slate-500 font-medium">(Phone: {order.customer.phone})</span>
                      {order.utrNumber && (
                        <span className="bg-slate-100 text-slate-600 font-mono text-[10px] px-2 py-0.5 rounded">
                          UTR: {order.utrNumber}
                        </span>
                      )}
                      {order.paymentProof && (
                        <button
                          type="button"
                          onClick={() => setActiveScreenshot({ orderId: order.orderId, proofUrl: order.paymentProof! })}
                          className="text-emerald-700 hover:text-emerald-900 underline text-[11px] font-bold flex items-center gap-0.5"
                        >
                          <ImageIcon className="w-3 h-3" /> Screenshot Proof
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 text-xs font-medium">
                      Address: {order.customer.address}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Items: {order.items.map(i => `${i.product.name} (${i.selectedWeightLabel})`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-emerald-600 text-lg block">₹{order.totalAmount}</span>
                    <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wider">
                      ✅ DELIVERED (COMPLETED)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 4: ROUTE GROUPING ── */}
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
                        <div key={o.orderId} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">{o.customer.name} (#{o.orderId})</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{o.status}</span>
                          </div>
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
