import React, { useState, useEffect } from 'react';
import {
  Award, Sparkles, QrCode, Coffee, Check, Shield, Star, Clock, Gift,
  MessageSquare, Smartphone, CheckCircle2, ChevronRight, AlertCircle
} from 'lucide-react';
import { CustomerProfile, MembershipLevel, Visit } from '../types';
import { fetchCustomerRewards } from '../api';

interface LoyaltyViewProps {
  currentUser: CustomerProfile | null;
  levels: MembershipLevel[];
  visits: Visit[];
  onOpenQR: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onClaimFreeCoffeeStampReward?: () => void;
}

export const LoyaltyView: React.FC<LoyaltyViewProps> = ({
  currentUser,
  levels,
  visits,
  onOpenQR,
  onOpenAuth,
  onClaimFreeCoffeeStampReward
}) => {
  const [customerRewards, setCustomerRewards] = useState<any[]>([]);
  const [selectedRewardPreview, setSelectedRewardPreview] = useState<any | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadRewards();
    }
  }, [currentUser?.id, currentUser?.totalVisits]);

  const loadRewards = async () => {
    if (!currentUser) return;
    try {
      const data = await fetchCustomerRewards(currentUser.id);
      setCustomerRewards(data);
    } catch (e) {
      console.error(e);
    }
  };
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4 bg-white rounded-3xl border border-[#EADFCF] shadow-sm space-y-4">
        <Award className="w-12 h-12 text-[#D97724] mx-auto" />
        <h2 className="text-2xl font-bold text-[#29221D] font-['Playfair_Display',serif]">
          Join AZRO CAFE Loyalty
        </h2>
        <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          Sign in or create a free member account to get an instant 50 points welcome bonus,
          access your digital loyalty card, track coffee stamps, and earn points on every sip.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button
            id="loyalty-join-prompt-btn"
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3 rounded-2xl bg-[#D97724] hover:bg-[#C2651B] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Join Rewards (+50 pts)</span>
          </button>
          <button
            id="loyalty-signin-prompt-btn"
            onClick={() => onOpenAuth('login')}
            className="px-6 py-3 rounded-2xl bg-[#29221D] hover:bg-[#3D322B] text-white font-bold text-sm shadow-md transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const currentLevelObj = levels.find(l => l.name === currentUser.membershipLevel) || levels[0];
  const currentLevelIndex = levels.findIndex(l => l.name === currentUser.membershipLevel);
  const nextLevel = levels[currentLevelIndex + 1] || null;

  let progressPercent = 100;
  let pointsNeeded = 0;
  if (nextLevel) {
    const base = currentLevelObj.minPoints;
    const target = nextLevel.minPoints;
    const span = target - base;
    const currentInSpan = Math.max(0, currentUser.points - base);
    progressPercent = Math.min(100, Math.round((currentInSpan / span) * 100));
    pointsNeeded = Math.max(0, target - currentUser.points);
  }

  const stampsTotal = 8;
  const currentStamps = currentUser.stampsCount || 0;

  return (
    <div className="space-y-10 pb-24">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29221D] font-['Playfair_Display',serif]">
          Loyalty & Digital Card
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Earn points and stamps with every visit. Present your dynamic QR card to baristas or scan table QR codes.
        </p>
      </div>

      {/* Digital Member Card Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* The Card Visual */}
        <div className="lg:col-span-6 xl:col-span-5">
          <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 text-white shadow-2xl bg-gradient-to-br ${currentLevelObj.cardBgGradient} border border-white/15 aspect-[1.58/1] flex flex-col justify-between`}>
            {/* Background luxury foil accents */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-[#E5A93C]/10 blur-2xl pointer-events-none" />

            {/* Card Top */}
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold font-['Playfair_Display',serif] tracking-wider text-xl text-white">
                    AZRO
                  </span>
                  <span className="font-light tracking-widest text-[#E5A93C] text-xl">
                    CAFÉ
                  </span>
                </div>
                <span className="text-[10px] tracking-[0.2em] text-stone-400 uppercase font-semibold">
                  Club Privilège
                </span>
              </div>

              {/* Tier Badge Pill */}
              <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-xs">
                <Shield className="w-3.5 h-3.5 text-[#E5A93C]" />
                <span className="text-xs font-bold tracking-wider uppercase text-white">
                  {currentUser.membershipLevel}
                </span>
              </div>
            </div>

            {/* Card Middle: Points Counter */}
            <div className="relative z-10 my-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                Available Reward Points
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FAF7F2] font-mono">
                  {currentUser.points}
                </span>
                <span className="text-xs text-[#E5A93C] font-bold">
                  {currentLevelObj.multiplier}x multiplier
                </span>
              </div>
            </div>

            {/* Card Bottom: Member Name & Quick QR button */}
            <div className="relative z-10 flex items-end justify-between pt-3 border-t border-white/15">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-stone-400 block">
                  Cardholder
                </span>
                <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5 font-mono">
                  ID: {currentUser.id.replace('usr-cust-', 'AZ-')}
                </span>
              </div>

              <button
                id="digital-card-open-qr-btn"
                onClick={onOpenQR}
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-md border border-white/25 shadow-xs"
              >
                <QrCode className="w-4 h-4 text-[#E5A93C]" />
                <span>Show QR</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between px-2 text-xs text-stone-500">
            <span>Scan at counter or order to collect stamps</span>
            <span className="text-stone-700 font-semibold">{currentUser.totalVisits} Total Visits</span>
          </div>
        </div>

        {/* 8-Stamp Coffee Card */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#EADFCF] shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A64A00] mb-1">
                  <Coffee className="w-4 h-4" />
                  <span>8-VISIT STAMP CARD</span>
                </div>
                <h3 className="text-lg font-bold text-[#29221D]">
                  Collect Stamps for a Complimentary Brew
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  1 visit scan = 1 stamp. Reach 8 stamps to unlock any signature beverage for free!
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-extrabold text-[#D97724] font-mono">
                  {currentStamps}
                </span>
                <span className="text-xs text-stone-400 font-bold"> / 8</span>
              </div>
            </div>

            {/* Stamp Circles Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3 py-2">
              {Array.from({ length: stampsTotal }).map((_, idx) => {
                const isStamped = idx < currentStamps;
                const isFinal = idx === stampsTotal - 1;
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                      isStamped
                        ? 'bg-[#29221D] text-[#E5A93C] shadow-xs border border-[#29221D]'
                        : isFinal
                        ? 'bg-[#FAF0E6] text-[#A64A00] border-2 border-dashed border-[#D97724]'
                        : 'bg-[#FAF7F2] text-stone-400 border-2 border-dashed border-[#E0D2C0]'
                    }`}
                  >
                    {isStamped ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : isFinal ? (
                      <Gift className="w-5 h-5 animate-pulse text-[#D97724]" />
                    ) : (
                      <span className="text-xs font-bold font-mono">{idx + 1}</span>
                    )}
                    <span className="text-[8px] font-bold mt-0.5 uppercase">
                      {isFinal ? 'FREE' : `STAMP`}
                    </span>
                  </div>
                );
              })}
            </div>

            {currentStamps >= 8 ? (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                <div className="text-xs text-amber-900 font-semibold">
                  🎉 Stamp card complete! You have unlocked 1 Free Specialty Beverage!
                </div>
                {onClaimFreeCoffeeStampReward && (
                  <button
                    onClick={onClaimFreeCoffeeStampReward}
                    className="px-3 py-1.5 rounded-xl bg-[#29221D] text-white text-xs font-bold shrink-0 hover:bg-[#D97724] transition-colors"
                  >
                    Claim Voucher
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
                <span>{8 - currentStamps} more visit(s) needed for your next free drink</span>
                <button
                  onClick={onOpenQR}
                  className="font-bold text-[#A64A00] hover:underline"
                >
                  Log Visit Now →
                </button>
              </div>
            )}
          </div>

          {/* Tier Progression Gauge */}
          <div className="p-6 rounded-3xl bg-white border border-[#EADFCF] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Next Milestone
                </span>
                <h4 className="text-base font-bold text-[#29221D]">
                  {nextLevel ? `Path to ${nextLevel.name} Tier` : 'Maximum Platinum Tier Reached!'}
                </h4>
              </div>
              {nextLevel && (
                <span className="text-xs font-bold text-[#A64A00] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#EAC9A8]">
                  {pointsNeeded} pts to unlock
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="relative w-full h-3.5 rounded-full bg-[#FAF7F2] border border-[#EADFCF] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D97724] to-[#E5A93C] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{currentLevelObj.name} ({currentLevelObj.minPoints} pts)</span>
              <span>{nextLevel ? `${nextLevel.name} (${nextLevel.minPoints} pts)` : 'Platinum (800+)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visit Milestone Rewards & Automatic WhatsApp/SMS Alerts */}
      <section className="rounded-3xl bg-white border border-[#EADFCF] p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Registered Mobile: {currentUser.phone || '+91 98765 43210'}</span>
            </div>
            <h2 className="text-xl font-bold text-[#29221D] font-['Playfair_Display',serif]">
              Visit Milestone Rewards & WhatsApp Alerts
            </h2>
            <p className="text-xs text-stone-500">
              Complete required visits to automatically unlock rewards. Instant WhatsApp & SMS notifications are dispatched to your mobile.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#FAF7F2] p-3 rounded-2xl border border-[#EADFCF] shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Visits</span>
              <span className="text-xl font-extrabold text-[#29221D] font-mono">{currentUser.totalVisits || 0} Visits</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#29221D] text-[#E5A93C] flex items-center justify-center font-bold">
              ☕
            </div>
          </div>
        </div>

        {/* Milestone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {customerRewards.map((cr: any) => {
            const isUnlocked = cr.status === 'Unlocked';
            const isClaimed = cr.status === 'Claimed' || cr.status === 'Redeemed';
            const isLocked = cr.status === 'Locked';

            return (
              <div
                key={cr.reward.id}
                className={`rounded-2xl p-4 border flex flex-col justify-between space-y-3 transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-amber-50/80 to-white border-[#D97724] ring-2 ring-[#D97724]/30 shadow-xs'
                    : isClaimed
                    ? 'bg-stone-50/70 border-stone-200 opacity-90'
                    : 'bg-white border-[#EADFCF]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#29221D] text-white text-[10px] font-bold">
                      {cr.requiredVisits} Visits Target
                    </span>
                    <span className="text-[11px] font-bold text-[#A64A00] font-mono">
                      ₹{cr.reward.rewardValue} Value
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#29221D] line-clamp-1">{cr.reward.title}</h3>
                  <p className="text-[11px] text-stone-500 line-clamp-2">{cr.reward.description}</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-stone-500">
                    <span>{cr.visitsCompleted} / {cr.requiredVisits} visits</span>
                    <span>{cr.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isUnlocked || isClaimed ? 'bg-emerald-500' : 'bg-[#D97724]'
                      }`}
                      style={{ width: `${cr.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  {isUnlocked && (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Unlocked!
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">WhatsApp Sent</span>
                      </div>
                      <p className="text-[10px] text-stone-600 leading-tight">
                        Claim at AZRO CAFE by showing registered mobile or QR code.
                      </p>
                    </div>
                  )}

                  {isClaimed && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">
                      <Check className="w-3 h-3" /> {cr.status}
                    </span>
                  )}

                  {isLocked && (
                    <span className="text-[11px] text-stone-400 font-medium">
                      {Math.max(0, cr.requiredVisits - cr.visitsCompleted)} more visits needed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Membership Levels Comparison Matrix */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#29221D] font-['Playfair_Display',serif]">
            Tier Privileges & Multipliers
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Points never expire for active accounts. The more you visit, the higher your reward multiplier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levels.map(lvl => {
            const isUserCurrent = currentUser.membershipLevel === lvl.name;
            return (
              <div
                key={lvl.id}
                className={`rounded-3xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                  isUserCurrent
                    ? 'bg-white border-[#D97724] ring-2 ring-[#D97724]/30 shadow-md scale-102'
                    : 'bg-white border-[#EADFCF] shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#29221D] uppercase tracking-wider">
                      {lvl.name}
                    </span>
                    {isUserCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-[#29221D] text-[#FAF7F2] text-[10px] font-bold">
                        Current Tier
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-2xl font-extrabold text-[#29221D] font-mono">
                      {lvl.minPoints}
                    </span>
                    <span className="text-xs text-stone-500 font-medium"> pts min</span>
                    <div className="text-xs font-bold text-[#D97724] mt-0.5">
                      {lvl.multiplier}x Points Multiplier
                    </div>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-600">
                    {lvl.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D97724] shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-[11px] font-bold text-center text-stone-400 uppercase tracking-wider pt-2">
                  {lvl.name === 'Bronze' ? 'Welcome Status' : `${lvl.minPoints}+ Lifetime Pts`}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Visit Activity & Anti-Duplicate Rule Notice */}
      <section className="rounded-3xl bg-white border border-[#EADFCF] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#29221D]">
              Recent Verified Visits
            </h3>
            <p className="text-xs text-stone-500">
              Verified in-store through dynamic QR counters & table codes.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Clock className="w-4 h-4 text-stone-400" />
            <span>45-min duplicate scan prevention active</span>
          </div>
        </div>

        {visits.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">No recorded visits yet. Scan your card on your next visit!</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {visits.slice(0, 5).map(v => (
              <div key={v.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-800 block">
                    {v.verifiedBy === 'table_qr' ? 'Table QR Check-In' : 'Counter Barista Scan'}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {new Date(v.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  {v.status === 'valid' ? (
                    <span className="font-bold text-[#D97724] bg-[#FAF0E6] px-2.5 py-1 rounded-lg">
                      +{v.pointsEarned} pts • +{v.stampsEarned} stamp
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[11px]">
                      Duplicate Blocked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
