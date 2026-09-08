import React from 'react';
import { Sparkles, ArrowRight, QrCode, Clock, MapPin, Coffee, Gift, Flame } from 'lucide-react';
import { CustomerProfile, MenuItem, Offer } from '../types';

interface HomeViewProps {
  currentUser: CustomerProfile | null;
  popularItems: MenuItem[];
  offers: Offer[];
  onOpenQR: () => void;
  onNavigateTab: (tab: string) => void;
  onQuickAddToCart: (item: MenuItem) => void;
  onSelectItemToCustomize: (item: MenuItem) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  popularItems,
  offers,
  onOpenQR,
  onNavigateTab,
  onQuickAddToCart,
  onSelectItemToCustomize
}) => {
  return (
    <div className="space-y-10 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-[#29221D] text-[#FAF7F2] p-6 sm:p-10 lg:p-12 shadow-xl border border-[#3E332B]">
        {/* Subtle decorative background pattern */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#D97724]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#E5A93C]/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-5">
          {/* Greeting Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3D322A] border border-[#52443A] text-xs font-semibold text-[#E5A93C]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {currentUser
                ? `Welcome back, ${currentUser.name.split(' ')[0]} • ${currentUser.membershipLevel} Member`
                : 'Artisan Micro-Roastery & Slow Coffee Bar'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Playfair_Display',serif] leading-tight text-white">
            Specialty Roasts, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5A93C] to-[#D97724]">
              Rewarding Rituals.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-stone-300 max-w-xl leading-relaxed">
            From single-origin washed Yirgacheffe to hand-crafted Spanish Pistachio lattes.
            Scan at your table or counter to log visits, collect stamps, and unlock exclusive cafe perks.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-order-ahead-btn"
              onClick={() => onNavigateTab('menu')}
              className="px-6 py-3 rounded-2xl bg-[#D97724] text-white font-bold text-sm hover:bg-[#C2651B] active:scale-95 transition-all shadow-md flex items-center gap-2"
            >
              <Coffee className="w-4 h-4" />
              <span>Order Ahead</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-scan-qr-btn"
              onClick={onOpenQR}
              className="px-5 py-3 rounded-2xl bg-[#3D322A] text-[#FAF7F2] font-semibold text-sm hover:bg-[#4E3F35] border border-[#58493D] active:scale-95 transition-all flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-[#E5A93C]" />
              <span>{currentUser ? 'Show My Loyalty Card' : 'In-Store Check-In'}</span>
            </button>
          </div>

          {/* Customer Quick Stats Strip if logged in */}
          {currentUser && currentUser.role === 'customer' && (
            <div className="pt-4 border-t border-[#3E332B] flex flex-wrap items-center gap-6 text-xs text-stone-300">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Reward Points</span>
                <span className="text-lg font-bold text-[#E5A93C]">{currentUser.points} pts</span>
              </div>
              <div className="w-px h-8 bg-[#3E332B]" />
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Stamp Card</span>
                <span className="text-lg font-bold text-stone-100">{currentUser.stampsCount} / 8 Stamps</span>
              </div>
              <div className="w-px h-8 bg-[#3E332B]" />
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Total Cafe Visits</span>
                <span className="text-lg font-bold text-stone-100">{currentUser.totalVisits} Recorded</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Active Promotional Offers Banner */}
      {offers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-[#29221D] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#D97724]" />
              <span>Current Promos & Daily Specials</span>
            </h2>
            <button
              onClick={() => onNavigateTab('rewards')}
              className="text-xs font-bold text-[#A64A00] hover:underline"
            >
              View All Rewards →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map(offer => (
              <div
                key={offer.id}
                className="relative overflow-hidden rounded-2xl bg-white border border-[#EADFCF] p-5 shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="inline-block px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#A64A00] text-[10px] font-bold uppercase tracking-wider">
                    {offer.tag}
                  </div>
                  <h3 className="font-bold text-base text-[#29221D]">{offer.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{offer.description}</p>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E0D2C0] font-mono text-xs font-bold text-[#29221D]">
                    {offer.code}
                  </div>
                  <button
                    onClick={() => onNavigateTab('menu')}
                    className="px-3 py-1.5 rounded-xl bg-[#29221D] text-white text-xs font-bold hover:bg-[#3D322B] transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Specialty Roaster Picks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#29221D] font-['Playfair_Display',serif]">
              Featured Roasts & Bakes
            </h2>
            <p className="text-xs text-stone-600">Handcrafted daily with single-origin beans and pure ingredients</p>
          </div>
          <button
            id="home-view-all-menu-btn"
            onClick={() => onNavigateTab('menu')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#29221D] bg-[#EFE6DA] hover:bg-[#E5D7C7] transition-colors"
          >
            Explore Full Menu →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularItems.slice(0, 4).map(item => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-2xl bg-white border border-[#EADFCF] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {item.isPopular && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#29221D]/80 backdrop-blur-xs text-white text-[10px] font-bold">
                    Signature
                  </span>
                )}
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur-xs text-[#29221D] text-xs font-extrabold shadow-xs">
                  ${item.price.toFixed(2)}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#A64A00] tracking-wider block">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-sm text-[#29221D] group-hover:text-[#D97724] transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                  <button
                    id={`customize-item-${item.id}`}
                    onClick={() => onSelectItemToCustomize(item)}
                    className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold text-[#29221D] bg-[#FAF7F2] hover:bg-[#EFE6DA] border border-[#EADFCF] transition-colors text-center"
                  >
                    Customize
                  </button>
                  <button
                    id={`quick-add-${item.id}`}
                    onClick={() => onQuickAddToCart(item)}
                    className="py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-[#29221D] hover:bg-[#D97724] transition-colors"
                    title="Quick Add to Cart"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cafe Ethos & Loyalty Cards Feature Banner */}
      <section className="rounded-3xl bg-[#FAF0E6] border border-[#EAC9A8] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-lg">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A64A00]">
            <Gift className="w-4 h-4" />
            <span>AZRO DIGITAL LOYALTY</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#29221D] font-['Playfair_Display',serif]">
            Every Cup Brings You Closer to Free Coffee
          </h3>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
            No physical plastic cards to lose. Check in via dynamic QR at the counter or scan your table QR code to earn points and automatic loyalty stamps.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('loyalty')}
            className="px-5 py-2.5 rounded-2xl bg-[#29221D] text-white text-xs sm:text-sm font-bold hover:bg-[#3D322B] transition-colors shadow-sm"
          >
            View My Stamp Card
          </button>
          <button
            onClick={onOpenQR}
            className="px-4 py-2.5 rounded-2xl bg-white text-[#A64A00] border border-[#EAC9A8] text-xs sm:text-sm font-bold hover:bg-[#FAF7F2] transition-colors"
          >
            Open QR Code
          </button>
        </div>
      </section>

      {/* Cafe Information Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-stone-700 text-xs">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#EADFCF]">
          <Clock className="w-5 h-5 text-[#D97724] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-[#29221D]">Hours of Operation</h4>
            <p className="text-stone-600 mt-0.5">Monday - Sunday: 7:00 AM – 9:00 PM</p>
            <p className="text-[11px] text-stone-500">Espresso bar closes 15 minutes before closing.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#EADFCF]">
          <MapPin className="w-5 h-5 text-[#D97724] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-[#29221D]">Flagship Cafe & Roastery</h4>
            <p className="text-stone-600 mt-0.5">452 Artisan Lane, Specialty District</p>
            <p className="text-[11px] text-stone-500">Free high-speed WiFi, outdoor patio & table ordering available.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
