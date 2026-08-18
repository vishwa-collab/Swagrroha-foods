import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCart, PlacedOrder, OrderStageStatus } from '../context/CartContext';
import { AdminLoginPage } from './AdminLoginPage';
import { DELIVERY_AREAS } from '../data/deliveryAreas';
import { OrderPipeline } from '../components/OrderPipeline';
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
  Image as ImageIcon,
  Mail,
  RotateCcw,
  TrendingUp,
  BarChart3,
  Star,
  DollarSign,
  ShoppingBag,
  Award,
  MessageSquare
} from 'lucide-react';
import { getWhatsAppDeliveredReceiptLink, getWhatsAppPlacedReceiptLink } from '../utils/whatsappReceipt';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://swagrroha-foods.onrender.com';
const POLL_INTERVAL_MS = 10000;


// ── Normalize flat backend Order into the nested PlacedOrder shape ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOrder(raw: any): PlacedOrder {
  const normItems = (raw.items || []).map((it: any) => {
    const pName = it.product?.name || it.productName || it.name || 'Food Item';
    const wLabel = it.selectedWeightLabel || it.weightLabel || (it.product?.weightOptions?.[0]?.label) || 'Standard';
    return {
      cartItemId: String(it.cartItemId || it.id || pName),
      product: {
        id: String(it.product?.id || it.id || pName),
        name: pName,
        basePrice: it.product?.basePrice || it.unitPrice || 0,
        weightOptions: it.product?.weightOptions || [{ label: wLabel, multiplier: 1 }],
        category: it.product?.category || '',
        image: it.product?.image || '',
        description: it.product?.description || '',
      },
      selectedWeightLabel: wLabel,
      unitPrice: it.unitPrice || it.product?.basePrice || 0,
      quantity: it.quantity || 1,
    };
  });

  const cust = typeof raw.customer === 'object' && raw.customer !== null ? raw.customer : {};

  return {
    orderId: raw.orderId || '',
    customer: {
      name: cust.name || raw.customerName || 'Customer',
      phone: cust.phone || raw.customerPhone || raw.phone || '',
      email: cust.email || raw.customerEmail || '',
      areaId: cust.areaId || raw.deliveryArea || '',
      address: cust.address || raw.customerAddress || '',
    },
    area: typeof raw.area === 'object' && raw.area !== null ? raw.area : {
      id: raw.deliveryArea || '',
      name: raw.deliveryArea || 'Standard Area',
      tier: 'Near',
      charge: raw.deliveryCharge || 0,
      estimatedDeliveryText: '',
    },
    items: normItems,
    subtotal: raw.subtotal || 0,
    deliveryCharge: raw.deliveryCharge || 0,
    totalAmount: raw.totalAmount || 0,
    deliveryDate: raw.deliveryDate
      ? (typeof raw.deliveryDate === 'string'
          ? { formattedDate: raw.deliveryDate, dayName: 'Saturday', daysUntil: 0, dayOfWeekName: 'Saturday', isSameWeekend: false, orderDayName: '' }
          : raw.deliveryDate)
      : { formattedDate: 'Upcoming Saturday', dayName: 'Saturday', daysUntil: 0, dayOfWeekName: 'Saturday', isSameWeekend: false, orderDayName: '' },
    status: raw.status || 'PLACED',
    paymentStatus: raw.paymentStatus || 'PENDING_VERIFICATION',
    utrNumber: raw.utrNumber || '',
    paymentProof: raw.paymentProof || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    receiptEmailSent: raw.receiptEmailSent ?? false,
    receiptEmailSentAt: raw.receiptEmailSentAt ?? null,
    receiptEmailStatus: raw.receiptEmailStatus ?? null,
    receiptEmailError: raw.receiptEmailError ?? null,
    review: raw.review ? (typeof raw.review === 'string' ? JSON.parse(raw.review) : raw.review) : undefined,
  };
}

export const AdminDashboard: React.FC = () => {
  const { adminToken, logoutAdmin, updateOrderStatus, resendReceiptEmail, allOrders, showToast } = useCart();
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [activeTabSection, setActiveTabSection] = useState<'new' | 'active' | 'history' | 'route-grouping' | 'analytics'>('new');
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  
  // Track which orders are currently being updated so we can show loading
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  // Track which orders have receipt email retry in progress
  const [resendingReceipt, setResendingReceipt] = useState<Set<string>>(new Set());

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
      const res = await fetch(`${API_BASE}/api/admin/orders`, {
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

  // ── Receipt Email Retry Handler ──
  const handleResendReceipt = async (orderId: string) => {
    setResendingReceipt(prev => new Set(prev).add(orderId));
    const result = await resendReceiptEmail(orderId);
    setResendingReceipt(prev => { const s = new Set(prev); s.delete(orderId); return s; });
    if (result.success) {
      showToast(`📧 Receipt email resent successfully for Order ${orderId}!`);
      // Update local orders state to reflect new email status
      setOrders(prev => prev.map(o => o.orderId === orderId
        ? { ...o, receiptEmailSent: true, receiptEmailStatus: 'SENT', receiptEmailError: null, receiptEmailSentAt: new Date().toISOString() }
        : o
      ));
    } else {
      showToast(`❌ Retry failed: ${result.message}`);
      setOrders(prev => prev.map(o => o.orderId === orderId
        ? { ...o, receiptEmailSent: false, receiptEmailStatus: 'FAILED', receiptEmailError: result.message }
        : o
      ));
    }
  };

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

        <button
          onClick={() => setActiveTabSection('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTabSection === 'analytics'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>📊 Analytics &amp; Reviews</span>
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

                    {/* SIMPLE CENTERED ORDER PIPELINE */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <OrderPipeline 
                        currentStatus={order.status}
                        interactive={true}
                        disabled={isUpdating}
                        compact={true}
                        onSelectStage={(newStatus) => handleStatusChange(order.orderId, newStatus)}
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                        Quick Stage Actions:
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
                            {isUpdating && order.status === status
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
              {historyOrders.map(order => {
                const isResending = resendingReceipt.has(order.orderId);
                const emailSent = order.receiptEmailSent === true || order.receiptEmailStatus === 'SENT';
                const emailFailed = order.receiptEmailStatus === 'FAILED';

                return (
                  <div key={order.orderId} className="py-4 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
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
                        {order.customer.email && (
                          <p className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {order.customer.email}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 space-y-2">
                        <span className="font-black text-emerald-600 text-lg block">₹{order.totalAmount}</span>
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full inline-block uppercase tracking-wider">
                          ✅ DELIVERED
                        </span>
                      </div>
                    </div>

                    {/* ── Receipt Email Status Badge ── */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {emailSent ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full">
                          <Mail className="w-3 h-3" />
                          📧 Receipt Sent
                          {order.receiptEmailSentAt && (
                            <span className="text-emerald-500 font-normal ml-0.5">
                              · {new Date(order.receiptEmailSentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          )}
                        </span>
                      ) : emailFailed ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold px-3 py-1 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            📧 Receipt Failed
                            {order.receiptEmailError && (
                              <span className="text-red-400 font-normal ml-0.5 max-w-[180px] truncate" title={order.receiptEmailError}>
                                · {order.receiptEmailError}
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => handleResendReceipt(order.orderId)}
                            disabled={isResending}
                            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white text-[11px] font-bold px-3 py-1 rounded-full transition-all"
                          >
                            {isResending
                              ? <RefreshCw className="w-3 h-3 animate-spin" />
                              : <RotateCcw className="w-3 h-3" />
                            }
                            {isResending ? 'Sending…' : '🔄 Retry Receipt'}
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-semibold px-3 py-1 rounded-full">
                            <Mail className="w-3 h-3" />
                            Receipt Not Sent
                          </span>
                          {order.customer.email && (
                            <button
                              onClick={() => handleResendReceipt(order.orderId)}
                              disabled={isResending}
                              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-[11px] font-bold px-3 py-1 rounded-full transition-all"
                            >
                              {isResending
                                ? <RefreshCw className="w-3 h-3 animate-spin" />
                                : <Mail className="w-3 h-3" />
                              }
                              {isResending ? 'Sending…' : '📧 Send Receipt'}
                            </button>
                          )}
                        </>
                      )}

                      {/* ── WhatsApp Receipt Button — 1-click sends receipt to customer's phone ── */}
                      {order.customer.phone && (
                        <a
                          href={getWhatsAppDeliveredReceiptLink(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white text-[11px] font-bold px-3 py-1 rounded-full transition-all"
                          title={`Send delivery receipt to ${order.customer.phone} via WhatsApp`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          📱 WhatsApp Receipt
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* ── SECTION 5: ANALYTICS & REVIEWS ── */}
      {activeTabSection === 'analytics' && (() => {
        const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
        const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalGrossOrdersValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Product leaderboard
        const productStats: Record<string, { qty: number; revenue: number }> = {};
        orders.forEach(o => {
          (o.items || []).forEach(it => {
            const name = it.product?.name || 'Item';
            if (!productStats[name]) productStats[name] = { qty: 0, revenue: 0 };
            productStats[name].qty += it.quantity || 1;
            productStats[name].revenue += (it.unitPrice || 0) * (it.quantity || 1);
          });
        });
        const topProducts = Object.entries(productStats)
          .sort((a, b) => b[1].qty - a[1].qty)
          .slice(0, 6);

        // Area distribution
        const areaStats: Record<string, number> = {};
        orders.forEach(o => {
          const a = o.area?.name || 'Unknown';
          areaStats[a] = (areaStats[a] || 0) + 1;
        });
        const sortedAreas = Object.entries(areaStats).sort((a, b) => b[1] - a[1]);

        // Customer Reviews
        const reviews = orders
          .filter(o => o.review && o.review.rating)
          .map(o => ({
            orderId: o.orderId,
            customerName: o.customer.name,
            rating: o.review!.rating,
            comment: o.review!.comment,
            date: o.review!.submittedAt || o.createdAt,
          }));

        const avgRating = reviews.length > 0
          ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
          : '4.9';

        return (
          <div className="space-y-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-500" />
              <span>Business Performance &amp; Customer Ratings</span>
            </h2>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Delivered Revenue</span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-950">₹{totalDeliveredRevenue}</p>
                <p className="text-[11px] text-emerald-700 font-medium">From {deliveredOrders.length} completed orders</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-3xl p-5 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">Total Orders</span>
                <p className="text-2xl sm:text-3xl font-black text-orange-950">{orders.length}</p>
                <p className="text-[11px] text-orange-700 font-medium">₹{totalGrossOrdersValue} total pipeline</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Active Pipeline</span>
                <p className="text-2xl sm:text-3xl font-black text-blue-950">{newOrders.length + activeOrders.length}</p>
                <p className="text-[11px] text-blue-700 font-medium">{newOrders.length} new · {activeOrders.length} in cooking</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Customer Satisfaction</span>
                <div className="flex items-center gap-1.5 py-0.5">
                  <p className="text-2xl sm:text-3xl font-black text-amber-950">{avgRating}</p>
                  <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
                </div>
                <p className="text-[11px] text-amber-700 font-medium">{reviews.length} customer review{reviews.length === 1 ? '' : 's'}</p>
              </div>
            </div>

            {/* Middle Section: Top Products & Area Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Top Products */}
              <div className="bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Award className="w-4 h-4 text-amber-500" />
                  Top Best-Selling Products
                </h3>
                {topProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No product sales data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map(([name, data], idx) => (
                      <div key={name} className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                            idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : 'bg-orange-100 text-orange-900'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{name}</span>
                            <span className="text-[10px] text-slate-500">{data.qty} units sold</span>
                          </div>
                        </div>
                        <span className="font-black text-emerald-700 text-sm">₹{data.revenue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Area Distribution */}
              <div className="bg-white rounded-3xl p-6 shadow-swiggy border border-slate-100 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <TrendingUp className="w-4 h-4 text-brand-500" />
                  Delivery Volume by Area
                </h3>
                {sortedAreas.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No area data yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {sortedAreas.map(([area, count]) => {
                      const pct = Math.round((count / orders.length) * 100);
                      return (
                        <div key={area} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-800">{area}</span>
                            <span className="text-brand-600">{count} orders ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-brand-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Customer Reviews Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-swiggy border border-slate-100 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-500" />
                    Customer Reviews &amp; Star Ratings
                  </h3>
                  <p className="text-xs text-slate-400">Ratings submitted by customers after order delivery</p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span className="font-black text-amber-900 text-sm">{avgRating} / 5.0</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Star className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700 text-sm">No Customer Reviews Yet</p>
                  <p className="text-xs text-slate-400">
                    When customers receive their DELIVERED orders, they can submit star ratings on the tracking page.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reviews.map(r => (
                    <div key={r.orderId} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{r.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">#{r.orderId}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      {r.comment && (
                        <p className="text-xs text-slate-700 italic bg-white/70 p-2.5 rounded-xl border border-amber-100">
                          "{r.comment}"
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        );
      })()}

    </div>
  );
};
