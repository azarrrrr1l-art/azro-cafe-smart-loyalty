import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, Sparkles, Shield, Coffee } from 'lucide-react';
import { AzroLogo } from './AzroLogo';
import { CustomerProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (name: string, email: string, phone: string, pass: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, phone, password);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await onLogin(demoEmail, demoPass);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EADFCF] overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-stone-100 bg-[#FAF7F2] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-2">
            <AzroLogo size="lg" showSubtitle={false} />
          </div>
          <p className="text-xs text-stone-500">
            {mode === 'login' ? 'Sign in to access your digital card and rewards' : 'Create an account & claim 50 free welcome points'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-100">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              mode === 'login'
                ? 'border-b-2 border-[#D97724] text-[#29221D] bg-[#FAF7F2]/50'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              mode === 'register'
                ? 'border-b-2 border-[#D97724] text-[#29221D] bg-[#FAF7F2]/50'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Join Rewards (+50 pts)
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Quick Demo Login Preset Buttons */}
          <div className="space-y-1.5 bg-[#FAF7F2] p-3 rounded-2xl border border-[#EADFCF]">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              1-Click Demo Profiles (Role-Based Access)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('customer@azrocafe.com', 'azro123')}
                className="p-1.5 rounded-xl bg-white border border-stone-200 hover:border-[#D97724] text-left text-[11px] font-bold text-stone-800 shadow-2xs transition-colors"
              >
                <div className="flex items-center gap-1 text-[#D97724]">
                  <Sparkles className="w-3 h-3" /> Customer
                </div>
                <div className="text-[9px] text-stone-500 font-normal">Alex (Silver)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@azrocafe.com', 'admin123')}
                className="p-1.5 rounded-xl bg-white border border-stone-200 hover:border-amber-600 text-left text-[11px] font-bold text-stone-800 shadow-2xs transition-colors"
              >
                <div className="flex items-center gap-1 text-amber-700">
                  <Shield className="w-3 h-3" /> Admin
                </div>
                <div className="text-[9px] text-stone-500 font-normal">Full Control</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('staff@azrocafe.com', 'staff123')}
                className="p-1.5 rounded-xl bg-white border border-stone-200 hover:border-amber-600 text-left text-[11px] font-bold text-stone-800 shadow-2xs transition-colors"
              >
                <div className="flex items-center gap-1 text-amber-800">
                  <Coffee className="w-3 h-3" /> Barista
                </div>
                <div className="text-[9px] text-stone-500 font-normal">Terminal Staff</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {mode === 'register' && (
              <>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Mercer"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#D97724] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Mobile Phone (For in-store lookup)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 019-2834"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#D97724] outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="font-bold text-stone-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder="name@azrocafe.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#D97724] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#D97724] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#29221D] hover:bg-[#3D322B] text-white font-bold text-xs shadow-md transition-all mt-2 disabled:opacity-50"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Free Account & Collect 50 Pts'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
