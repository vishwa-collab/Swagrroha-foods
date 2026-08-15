import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../data/products';
import { DELIVERY_AREAS, DeliveryArea } from '../data/deliveryAreas';
import { getNextDeliverySaturday, CalculatedDeliveryDate } from '../utils/deliveryCalculator';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://swagrroha-foods.onrender.com';

export interface CartItem {
  cartItemId: string;
  product: Product;
  selectedWeightLabel: string;
  unitPrice: number;
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  areaId: string;
  address: string;
}

export type OrderStageStatus = 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
export type PaymentVerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED_PAID' | 'PAID_VIA_UPI' | 'PAID_VIA_RAZORPAY' | 'REJECTED';

export interface PlacedOrder {
  orderId: string;
  customer: CustomerDetails;
  area: DeliveryArea;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  deliveryDate: CalculatedDeliveryDate;
  status: OrderStageStatus;
  paymentStatus: PaymentVerificationStatus;
  utrNumber?: string;
  paymentProof?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  receiptEmailSent?: boolean;
  receiptEmailSentAt?: string | null;
  receiptEmailStatus?: string | null;
  receiptEmailError?: string | null;
  review?: { rating: number; comment?: string; submittedAt?: string };
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, weightLabel: string, qty?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQty: number) => void;
  clearCart: () => void;
  
  selectedArea: DeliveryArea;
  setSelectedAreaById: (areaId: string) => void;
  
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  
  activeTab: 'home' | 'products' | 'cart' | 'checkout' | 'payment' | 'confirmation' | 'track' | 'admin';
  setActiveTab: (tab: 'home' | 'products' | 'cart' | 'checkout' | 'payment' | 'confirmation' | 'track' | 'admin') => void;
  
  customerDetails: CustomerDetails;
  setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  
  currentOrder: PlacedOrder | null;
  setCurrentOrder: (order: PlacedOrder | null) => void;
  
  // All Orders Store (Shared between Customer & Owner)
  allOrders: PlacedOrder[];
  addOrder: (order: PlacedOrder) => Promise<{ success: boolean; message?: string }>;
  clearAllOrders: () => Promise<void>;

  deliveryDateInfo: CalculatedDeliveryDate;
  
  // Owner Auth & Security
  adminToken: string | null;
  adminEmail: string | null;
  loginAdmin: (email: string, pass: string) => Promise<boolean>;
  logoutAdmin: () => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStageStatus, newPaymentStatus?: PaymentVerificationStatus) => Promise<boolean>;
  
  resendReceiptEmail: (orderId: string) => Promise<{ success: boolean; message: string }>;
  submitReview: (orderId: string, rating: number, comment?: string) => Promise<{ success: boolean; message: string }>;
  fetchLiveRating: () => Promise<{ averageRating: number; count: number; hasRealData: boolean }>;

  // Live Tracking Lookup
  trackedOrder: PlacedOrder | null;
  fetchOrderForTracking: (query: string) => Promise<PlacedOrder | null>;

  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('swagrooha_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedArea, setSelectedArea] = useState<DeliveryArea>(() => {
    const savedId = localStorage.getItem('swagrooha_area');
    const found = DELIVERY_AREAS.find(a => a.id === savedId);
    return found || DELIVERY_AREAS[4]; // Default LB Nagar
  });

  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'cart' | 'checkout' | 'payment' | 'confirmation' | 'track' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.search.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p.includes('admin') || p.includes('owner') || h.includes('admin') || h.includes('owner')) {
        return 'admin';
      }
    }
    return 'home';
  });

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(() => {
    const saved = localStorage.getItem('swagrooha_customer');
    return saved ? JSON.parse(saved) : { name: '', phone: '', email: '', areaId: selectedArea.id, address: '' };
  });

  const [currentOrder, setCurrentOrder] = useState<PlacedOrder | null>(null);

  // Persistent Store for All Placed Orders
  // Bump version to v6 so old order history is completely purged and app starts fresh
  const [allOrders, setAllOrders] = useState<PlacedOrder[]>(() => {
    const VERSION = 'v6';
    const versionKey = 'swagrooha_orders_version';
    if (localStorage.getItem(versionKey) !== VERSION) {
      // Wipe old cached orders and save new version tag
      localStorage.removeItem('swagrooha_all_orders');
      localStorage.removeItem('swagrooha_cart');
      localStorage.setItem(versionKey, VERSION);
      return [];
    }
    const saved = localStorage.getItem('swagrooha_all_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [trackedOrder, setTrackedOrder] = useState<PlacedOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Owner Auth State
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('swagrooha_admin_token'));
  const [adminEmail, setAdminEmail] = useState<string | null>(() => localStorage.getItem('swagrooha_admin_email'));

  const deliveryDateInfo = getNextDeliverySaturday();

  useEffect(() => {
    localStorage.setItem('swagrooha_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('swagrooha_area', selectedArea.id);
  }, [selectedArea]);

  useEffect(() => {
    localStorage.setItem('swagrooha_customer', JSON.stringify(customerDetails));
  }, [customerDetails]);

  useEffect(() => {
    localStorage.setItem('swagrooha_all_orders', JSON.stringify(allOrders));
  }, [allOrders]);

  // Secret keyboard shortcut (Ctrl + Shift + A) to open Owner Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setActiveTab('admin');
        showToast('🔑 Owner Access Triggered');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  const setSelectedAreaById = (areaId: string) => {
    const found = DELIVERY_AREAS.find(a => a.id === areaId);
    if (found) {
      setSelectedArea(found);
      setCustomerDetails(prev => ({ ...prev, areaId: found.id }));
    }
  };

  const addToCart = (product: Product, weightLabel: string, qty: number = 1) => {
    const weightOpt = product.weightOptions.find(w => w.label === weightLabel) || product.weightOptions[0];
    const unitPrice = Math.round(product.basePrice * weightOpt.multiplier);
    const cartItemId = `${product.id}-${weightLabel}`;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      } else {
        return [...prev, {
          cartItemId,
          product,
          selectedWeightLabel: weightLabel,
          unitPrice,
          quantity: qty,
        }];
      }
    });

    showToast(`Added ${product.name} (${weightLabel}) to cart!`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item));
  };

  const clearCart = () => {
    setCart([]);
  };

  // UTR Duplicate Check (Prevents fraud & duplicate submissions)
  const isUtrUsed = (utr: string): boolean => {
    if (!utr) return false;
    const clean = utr.trim().toLowerCase();
    if (['screenshot_proved', 'direct_upi_payment'].includes(clean)) return false;
    return allOrders.some(o => o.utrNumber && o.utrNumber.trim().toLowerCase() === clean);
  };

  const addOrder = async (order: PlacedOrder): Promise<{ success: boolean; message?: string }> => {
    if (order.utrNumber && isUtrUsed(order.utrNumber)) {
      return { 
        success: false, 
        message: 'This UTR / Transaction ID has already been submitted for another order. Reusing UTR numbers is strictly prohibited.' 
      };
    }

    const fullOrder: PlacedOrder = {
      ...order,
      status: order.status || 'PLACED',
      paymentStatus: order.paymentStatus || 'PENDING_VERIFICATION'
    };

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullOrder),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          message: errData.error || 'Unable to place your order. Please try again.'
        };
      }

      // Backend confirmed order saved to DB successfully
      const savedBackendOrder = await res.json().catch(() => null);
      const finalSavedOrder = savedBackendOrder && savedBackendOrder.orderId ? {
        ...fullOrder,
        orderId: savedBackendOrder.orderId
      } : fullOrder;

      setCurrentOrder(finalSavedOrder);
      setAllOrders(prev => {
        const filtered = prev.filter(o => o.orderId !== finalSavedOrder.orderId);
        return [finalSavedOrder, ...filtered];
      });

      return { success: true };
    } catch (e) {
      console.error('Backend order save failed:', e);
      return {
        success: false,
        message: 'Unable to place your order. Unable to connect to server. Please try again.'
      };
    }
  };




  // Owner Auth Functions
  const loginAdmin = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, pass: cleanPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const token = data.token || 'jwt_owner_session_' + Date.now();
        setAdminToken(token);
        setAdminEmail(data.email || cleanEmail);
        localStorage.setItem('swagrooha_admin_token', token);
        localStorage.setItem('swagrooha_admin_email', data.email || cleanEmail);
        showToast('Welcome back Owner Vishwa!');
        return true;
      }
    } catch (e) {
      console.warn('Backend admin login request failed, checking client fallback...', e);
    }

    // Client-side fallback if backend is unreachable / starting up
    if (cleanEmail === 'vishwa81251@gmail.com' && cleanPass === '81251') {
      const token = 'jwt_owner_session_' + Date.now();
      setAdminToken(token);
      setAdminEmail(cleanEmail);
      localStorage.setItem('swagrooha_admin_token', token);
      localStorage.setItem('swagrooha_admin_email', cleanEmail);
      showToast('Welcome back Owner Vishwa!');
      return true;
    }

    return false;
  };

  const logoutAdmin = () => {
    setAdminToken(null);
    setAdminEmail(null);
    localStorage.removeItem('swagrooha_admin_token');
    localStorage.removeItem('swagrooha_admin_email');
    showToast('Logged out of Admin Control Panel');
  };

  // Owner Status Update (Confirms stage and updates payment verification)
  const updateOrderStatus = async (
    orderId: string, 
    newStatus: OrderStageStatus, 
    newPaymentStatus?: PaymentVerificationStatus
  ): Promise<boolean> => {
    const payStatus = newPaymentStatus || (newStatus === 'CONFIRMED' ? 'VERIFIED_PAID' : undefined);

    setAllOrders(prev => {
      const updated = prev.map(o => {
        if (o.orderId === orderId) {
          return {
            ...o,
            status: newStatus,
            paymentStatus: payStatus || o.paymentStatus
          };
        }
        return o;
      });
      try {
        localStorage.setItem('swagrooha_all_orders', JSON.stringify(updated));
      } catch (err) {
        console.error('LocalStorage write error', err);
      }
      return updated;
    });

    if (currentOrder && currentOrder.orderId === orderId) {
      setCurrentOrder(prev => prev ? { 
        ...prev, 
        status: newStatus,
        paymentStatus: payStatus || prev.paymentStatus 
      } : null);
    }
    if (trackedOrder && trackedOrder.orderId === orderId) {
      setTrackedOrder(prev => prev ? { 
        ...prev, 
        status: newStatus,
        paymentStatus: payStatus || prev.paymentStatus 
      } : null);
    }

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          paymentStatus: payStatus
        }),
      });
      if (!res.ok) {
        console.error('Backend status update failed:', res.status, res.statusText);
        return false;
      }
      // If the backend returned receipt email status in the response, update local state
      const respData = await res.json().catch(() => null);
      if (respData && newStatus === 'DELIVERED') {
        setAllOrders(prev => prev.map(o => o.orderId === orderId ? {
          ...o,
          receiptEmailSent: respData.receiptEmailSent ?? o.receiptEmailSent,
          receiptEmailSentAt: respData.receiptEmailSentAt ?? o.receiptEmailSentAt,
          receiptEmailStatus: respData.receiptEmailStatus ?? o.receiptEmailStatus,
          receiptEmailError: respData.receiptEmailError ?? o.receiptEmailError,
        } : o));
      }
      return true;
    } catch (e) {
      console.error('Network error updating order status:', e);
      return false;
    }
  };

  // Admin manually retries sending receipt email for a DELIVERED order
  const resendReceiptEmail = async (orderId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/resend-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAllOrders(prev => prev.map(o => o.orderId === orderId ? {
          ...o,
          receiptEmailSent: true,
          receiptEmailSentAt: data.receiptEmailSentAt || new Date().toISOString(),
          receiptEmailStatus: 'SENT',
          receiptEmailError: null,
        } : o));
        return { success: true, message: data.message || 'Receipt email sent successfully' };
      }
      return { success: false, message: data.error || 'Failed to resend receipt email' };
    } catch (e) {
      console.error('Network error resending receipt email:', e);
      return { success: false, message: 'Network error. Please check your connection and try again.' };
    }
  };

  // Customer submits a star rating + comment for a DELIVERED order
  const submitReview = async (orderId: string, rating: number, comment?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const review = data.review;
        setAllOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, review } : o));
        if (currentOrder?.orderId === orderId) setCurrentOrder(prev => prev ? { ...prev, review } : null);
        if (trackedOrder?.orderId === orderId) setTrackedOrder(prev => prev ? { ...prev, review } : null);
        return { success: true, message: 'Thank you for your review!' };
      }
      return { success: false, message: data.error || 'Failed to submit review.' };
    } catch (e) {
      console.error('Error submitting review:', e);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Fetch live average rating from backend
  const fetchLiveRating = async (): Promise<{ averageRating: number; count: number; hasRealData: boolean }> => {
    try {
      const res = await fetch(`${API_BASE}/api/stats/rating`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.log('Rating fetch failed, using default');
    }
    return { averageRating: 4.9, count: 500, hasRealData: false };
  };

  const fetchOrderForTracking = async (query: string): Promise<PlacedOrder | null> => {
    const q = query.trim().toLowerCase();
    
    // Check in-memory/localStorage orders first
    const foundLocal = allOrders.find(o => 
      o.orderId.toLowerCase() === q || 
      o.customer.phone === q ||
      (o.utrNumber && o.utrNumber.toLowerCase() === q)
    );

    if (foundLocal) {
      setTrackedOrder(foundLocal);
      return foundLocal;
    }

    try {
      const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setTrackedOrder(data);
        return data;
      }
    } catch (e) {
      console.log('Local tracking search');
    }

    if (currentOrder && (currentOrder.orderId.toLowerCase() === q || currentOrder.customer.phone === q)) {
      setTrackedOrder(currentOrder);
      return currentOrder;
    }
    return null;
  };

  const clearAllOrders = async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/api/admin/reset-orders`, { method: 'DELETE' });
    } catch (e) {
      console.log('Backend reset orders endpoint failed or offline');
    }
    setAllOrders([]);
    setCurrentOrder(null);
    setTrackedOrder(null);
    localStorage.removeItem('swagrooha_all_orders');
    localStorage.removeItem('swagrooha_cart');
    localStorage.setItem('swagrooha_orders_version', 'v_' + Date.now());
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const deliveryCharge = cart.length > 0 ? selectedArea.charge : 0;
  const grandTotal = subtotal + deliveryCharge;

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      selectedArea,
      setSelectedAreaById,
      subtotal,
      deliveryCharge,
      grandTotal,
      activeTab,
      setActiveTab,
      customerDetails,
      setCustomerDetails,
      currentOrder,
      setCurrentOrder,
      allOrders,
      addOrder,
      clearAllOrders,
      deliveryDateInfo,
      adminToken,
      adminEmail,
      loginAdmin,
      logoutAdmin,
      updateOrderStatus,
      resendReceiptEmail,
      submitReview,
      fetchLiveRating,
      trackedOrder,
      fetchOrderForTracking,
      toastMessage,
      showToast,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
