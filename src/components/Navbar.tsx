import React from 'react';
import { QrCode, ShoppingBag, Bell, User as UserIcon, Sparkles, Shield, Coffee } from 'lucide-react';
import { AzroLogo } from './AzroLogo';
import { CustomerProfile } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: CustomerProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenQR: () => void;
  onOpenCart: () => void;
  onOpenNotifs: () => void;
  cartCount: number;
  unreadNotifsCount: number;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenAuth,
  onOpenQR,
  onOpenCart,
  onOpenNotifs,
  cartCount,
  unreadNotifsCount,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EADFCF] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <button
            id="nav-brand-btn"
            onClick={() => setCurrentTab('home')}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D97724] rounded-lg p-1"
          >
            <AzroLogo size="md" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {[
              { id: 'home', label: 'Home' },
              { id: 'menu', label: 'Artisan Menu' },
              { id: 'loyalty', label: 'Loyalty & Stamp Card' },
              { id: 'rewards', label: 'Rewards' },
              { id: 'orders', label: 'Orders' },
              ...(currentUser?.role === 'admin' || currentUser?.role === 'staff'
                ? [{ id: 'admin', label: 'Admin Hub' }]
                : [])
            ].map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#29221D] text-[#FAF7F2] shadow-sm'
                      : 'text-[#4A3E36] hover:text-[#29221D] hover:bg-[#EFE6DA]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick QR Check-In / Card Trigger */}
            <button
              id="nav-qr-scan-btn"
              onClick={onOpenQR}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#FAF0E6] text-[#A64A00] border border-[#EAC9A8] hover:bg-[#FCEAD8] active:scale-95 transition-all shadow-xs"
              title="Show Loyalty QR / Scan In-Store"
            >
              <QrCode className="w-4 h-4 text-[#D97724]" />
              <span className="hidden sm:inline">Check-In / QR</span>
            </button>

            {/* Points pill if logged in */}
            {currentUser && currentUser.role === 'customer' && (
              <button
                id="nav-points-badge"
                onClick={() => setCurrentTab('loyalty')}
                className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#EFE6DA] text-[#29221D] text-xs font-bold border border-[#E0D2C0] hover:border-[#D97724] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D97724]" />
                <span>{currentUser.points} pts</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#29221D] text-[#FAF7F2] ml-1 font-semibold">
                  {currentUser.membershipLevel}
                </span>
              </button>
            )}

            {/* Notifications Button */}
            <button
              id="nav-notifs-btn"
              onClick={onOpenNotifs}
              className="relative p-2 rounded-xl text-[#4A3E36] hover:bg-[#EFE6DA] transition-colors focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-[#D97724] rounded-full ring-2 ring-[#FAF7F2]">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              id="nav-cart-btn"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 p-2 sm:px-3.5 sm:py-2 rounded-xl bg-[#29221D] text-[#FAF7F2] hover:bg-[#3D322B] active:scale-95 transition-all shadow-sm"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5A93C]" />
              <span className="hidden sm:inline text-xs font-bold">Cart</span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-extrabold text-[#29221D] bg-[#E5A93C] rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth / Profile Button */}
            {currentUser ? (
              <div className="relative group">
                <button
                  id="nav-user-menu-btn"
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#EFE6DA] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#D97724] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden xl:flex flex-col text-left text-xs leading-tight">
                    <span className="font-bold text-[#29221D] max-w-[90px] truncate">{currentUser.name}</span>
                    <span className="text-[10px] text-stone-500 uppercase font-semibold">{currentUser.role}</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-[#EADFCF] py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-xs font-semibold text-stone-900">{currentUser.name}</p>
                    <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#A64A00]">
                      <Shield className="w-3 h-3" /> Role: {currentUser.role.toUpperCase()}
                    </div>
                  </div>
                  <button
                    id="profile-dropdown-loyalty"
                    onClick={() => setCurrentTab('loyalty')}
                    className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-[#FAF7F2] font-medium flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D97724]" /> Loyalty & Stamps
                  </button>
                  <button
                    id="profile-dropdown-orders"
                    onClick={() => setCurrentTab('orders')}
                    className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-[#FAF7F2] font-medium flex items-center gap-2"
                  >
                    <Coffee className="w-3.5 h-3.5 text-[#D97724]" /> My Orders
                  </button>
                  {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                    <button
                      id="profile-dropdown-admin"
                      onClick={() => setCurrentTab('admin')}
                      className="w-full text-left px-4 py-2 text-xs text-amber-900 hover:bg-amber-50 font-bold flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-600" /> Admin & Staff Hub
                    </button>
                  )}
                  <div className="border-t border-stone-100 my-1"></div>
                  <button
                    id="profile-dropdown-logout"
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold"
                  >
                    Sign Out / Switch Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-join-rewards-btn"
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-[#D97724] bg-[#FAF7F2] border border-[#D97724]/40 hover:bg-[#FAF2E8] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D97724]" />
                  <span>Join Rewards (+50 pts)</span>
                </button>
                <button
                  id="nav-signin-btn"
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-[#29221D] border border-[#D8C6B2] hover:bg-[#EFE6DA] transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#D97724]" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
