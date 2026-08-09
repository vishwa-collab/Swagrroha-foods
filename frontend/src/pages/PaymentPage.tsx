import React, { useState, useEffect } from 'react';
import { useCart, PlacedOrder } from '../context/CartContext';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  Lock
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const PaymentPage: React.FC = () => {
  const { 
    cart, 
    selectedArea, 
    subtotal, 
    deliveryCharge, 
    grandTotal, 
    setActiveTab, 
    customerDetails,
    deliveryDateInfo,
    addOrder,
    clearCart,
    showToast
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Generate unique Order ID for tracking in our DB
  const [orderId] = useState(() => 'PJR-' + Math.floor(100000 + Math.random() * 900000));

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
    } else {
      const interval = setInterval(() => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      showToast('Payment gateway is loading. Please wait a moment.');
      return;
    }

    setIsSubmitting(true);
    showToast('Initializing secure payment...');

    try {
      // 1. Create order on our backend
      const response = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: grandTotal,
          receipt: orderId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment order');
      }

      const orderData = await response.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: "rzp_test_TNGuNg9TsCrgxS",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PJR Swagrooha Foods",
        description: `Order ${orderId}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            showToast('Payment successful! Verifying signature...');
            
            // 3. Verify signature on backend
            const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: grandTotal
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // 4. Verification successful, save order
              const newOrder: PlacedOrder = {
                orderId,
                customer: customerDetails,
                area: selectedArea,
                items: cart,
                subtotal,
                deliveryCharge,
                totalAmount: grandTotal,
                deliveryDate: deliveryDateInfo,
                status: 'PLACED',
                paymentStatus: 'PAID_VIA_RAZORPAY',
                paymentMethod: 'Razorpay',
                utrNumber: response.razorpay_payment_id, // Use payment ID as reference
                createdAt: new Date().toISOString(),
              };

              const addRes = await addOrder(newOrder);
              if (addRes.success) {
                clearCart();
                setActiveTab('confirmation');
              } else {
                showToast(addRes.message || 'Error saving order after payment.');
              }
            } else {
              showToast('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            showToast('Error during payment verification.');
          } finally {
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: customerDetails.name,
          contact: customerDetails.phone
        },
        theme: {
          color: "#059669" // Emerald 600
        },
        modal: {
          ondismiss: function() {
            setIsSubmitting(false);
            showToast('Payment cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        showToast('Payment failed: ' + response.error.description);
        setIsSubmitting(false);
      });
      
      rzp.open();

    } catch (err) {
      showToast('Error setting up payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    setActiveTab('cart');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('checkout')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Address Details
        </button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Step 2 of 2: Secure Payment
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <span>Secure Checkout</span>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Click below to pay via <strong>PhonePe</strong>, <strong>Google Pay</strong>, or <strong>Paytm</strong>. Order confirmed instantly after payment!
        </p>
      </div>

      {/* Main Payment Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center max-w-md mx-auto">
        
        {/* Exact Payable Amount Badge */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl mx-auto space-y-1 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 block">Total Amount Payable</span>
          <p className="text-5xl font-black text-white py-2">₹{grandTotal}</p>
          <p className="text-[11px] text-slate-400">Order #{orderId} • Items (₹{subtotal}) + Delivery (₹{deliveryCharge})</p>
        </div>

        {/* Razorpay Pay Button */}
        <div className="pt-4">
          <button
            onClick={handlePayment}
            disabled={isSubmitting || !razorpayLoaded}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Lock className="w-5 h-5 text-emerald-100" />
            <span>{isSubmitting ? 'Processing...' : 'Pay Securely Now'}</span>
          </button>
          
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            100% Secure Payments by Razorpay
          </div>
        </div>

      </div>

    </div>
  );
};
