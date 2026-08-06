import React from 'react';
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
import { CheckCircle } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeTab, toastMessage } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5]">
      {/* Navbar */}
      <Navbar />

      {/* Main View Switcher */}
      <main className="flex-grow">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'products' && <ProductsPage />}
        {activeTab === 'cart' && <CartPage />}
        {activeTab === 'checkout' && <CheckoutPage />}
        {activeTab === 'payment' && <PaymentPage />}
        {activeTab === 'confirmation' && <ConfirmationPage />}
        {activeTab === 'track' && <TrackingPage />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Toast Popup Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 bg-slate-900 text-white font-bold text-sm px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/60 toast-enter">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
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
