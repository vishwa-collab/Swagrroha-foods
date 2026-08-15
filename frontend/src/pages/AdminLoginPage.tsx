import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { IMAGES } from '../assets/images';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, setActiveTab } = useCart();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const success = await loginAdmin(email, password);
    setLoading(false);

    if (success) {
      setActiveTab('admin');
    } else {
      setErrorMsg('Invalid Owner Email or Password. Please check your credentials.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <img 
          src={IMAGES.logo} 
          alt="PJR Swagrooha Foods Logo" 
          className="w-20 h-20 rounded-2xl mx-auto border-2 border-brand-500 p-1 shadow-lg object-cover"
        />
        <div>
          <span className="bg-brand-100 text-brand-700 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            🔒 Owner Portal Only
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Owner Admin Login</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access reserved strictly for PJR Swagrooha Foods management.
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Owner Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="email"
                placeholder="vishwa81251@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-brand-500/30 hover:scale-[1.02] active:scale-95 transition-all text-sm mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Unlock Owner Control Panel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protected with Spring Boot JWT Security</span>
        </div>

      </div>

    </div>
  );
};
