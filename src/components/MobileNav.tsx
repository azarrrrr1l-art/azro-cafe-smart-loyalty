import React from 'react';
import { Home, Coffee, QrCode, Award, ShoppingBag, Shield } from 'lucide-react';
import { CustomerProfile } from '../types';

interface MobileNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenQR: () => void;
  currentUser: CustomerProfile | null;
  cartCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenQR,
  currentUser,
  cartCount
}) => {
  const isAdminOrStaff = currentUser?.role === 'admin' || currentUser?.role === 'staff';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-lg border-t border-[#EADFCF] px-2 py-1.5 safe-area-pb shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          id="mobile-nav-home"
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'home' ? 'text-[#D97724] font-bold scale-105' : 'text-[#6E5D52] hover:text-[#29221D]'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          id="mobile-nav-menu"
          onClick={() => setCurrentTab('menu')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'menu' ? 'text-[#D97724] font-bold scale-105' : 'text-[#6E5D52] hover:text-[#29221D]'
          }`}
        >
          <Coffee className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Menu</span>
        </button>

        {/* Center Floating QR Button */}
        <button
          id="mobile-nav-qr-btn"
          onClick={onOpenQR}
          className="relative -top-3 flex flex-col items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#29221D] to-[#453730] text-[#FAF7F2] shadow-md border-2 border-[#FAF7F2] active:scale-95 transition-transform"
          title="Scan QR / Loyalty Card"
        >
          <QrCode className="w-6 h-6 text-[#E5A93C]" />
        </button>

        <button
          id="mobile-nav-loyalty"
          onClick={() => setCurrentTab('loyalty')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'loyalty' ? 'text-[#D97724] font-bold scale-105' : 'text-[#6E5D52] hover:text-[#29221D]'
          }`}
        >
          <Award className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Loyalty</span>
        </button>

        {isAdminOrStaff ? (
          <button
            id="mobile-nav-admin"
            onClick={() => setCurrentTab('admin')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              currentTab === 'admin' ? 'text-[#D97724] font-bold scale-105' : 'text-[#6E5D52] hover:text-[#29221D]'
            }`}
          >
            <Shield className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Admin</span>
          </button>
        ) : (
          <button
            id="mobile-nav-rewards"
            onClick={() => setCurrentTab('rewards')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              currentTab === 'rewards' ? 'text-[#D97724] font-bold scale-105' : 'text-[#6E5D52] hover:text-[#29221D]'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-[#D97724] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">Rewards</span>
          </button>
        )}
      </div>
    </div>
  );
};
