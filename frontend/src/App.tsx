import React, { useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { TrackingPage } from './pages/TrackingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CheckCircle2, ChevronRight } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab, toastMessage, isCartToast, clearToast } = useCart();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5]">
      {/* Navbar */}
      <Navbar />

      {/* Main View Switcher */}
      <main className="flex-grow pb-16 md:pb-0">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'products' && <ProductsPage />}
        {activeTab === 'cart' && <CartPage />}
        {activeTab === 'checkout' && <CheckoutPage />}
        {activeTab === 'payment' && <PaymentPage />}
        {activeTab === 'confirmation' && <ConfirmationPage />}
        {activeTab === 'track' && <TrackingPage />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Flipkart-Style Item Added To Cart Popup */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[150] flex items-center justify-between gap-5 bg-[#212121] text-white text-xs sm:text-sm font-medium px-4 sm:px-5 py-3 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 min-w-[300px] sm:min-w-[360px] max-w-[92vw] flipkart-toast"
        >
          <div className="flex items-center gap-2.5 truncate">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-100 font-medium truncate">
              {toastMessage}
            </span>
          </div>

          {(isCartToast || toastMessage.toLowerCase().includes('cart') || toastMessage.toLowerCase().includes('added')) ? (
            <button
              onClick={() => {
                setActiveTab('cart');
                clearToast();
              }}
              className="text-[#ff9f00] hover:text-[#ffa726] font-black tracking-wider text-xs sm:text-sm uppercase whitespace-nowrap active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer pl-2"
            >
              <span>GO TO CART</span>
              <ChevronRight className="w-4 h-4 text-[#ff9f00]" />
            </button>
          ) : (
            <button
              onClick={clearToast}
              className="text-slate-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <CartProvider>
      <MainAppContent />
    </CartProvider>
  );
};

export default App;
