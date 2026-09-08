import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Check, Clock, QrCode, Tag, AlertCircle, Shield, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import { CustomerProfile, Reward, RewardClaim } from '../types';
import { claimReward, fetchMyClaims, verifyClaimCode } from '../api';

interface RewardsViewProps {
  currentUser: CustomerProfile | null;
  rewards: Reward[];
  onOpenAuth: () => void;
  onPointsUpdated: (newPoints: number) => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  currentUser,
  rewards,
  onOpenAuth,
  onPointsUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'vouchers' | 'staff'>('catalog');
  const [myClaims, setMyClaims] = useState<RewardClaim[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);

  // Selected voucher for QR modal
  const [activeVoucherModal, setActiveVoucherModal] = useState<RewardClaim | null>(null);
  const [voucherQrUrl, setVoucherQrUrl] = useState<string>('');

  // Staff redemption terminal state
  const [staffCodeInput, setStaffCodeInput] = useState<string>('');
  const [staffResult, setStaffResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isVerifyingStaff, setIsVerifyingStaff] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadClaims();
    }
  }, [currentUser]);

  const loadClaims = async () => {
    if (!currentUser) return;
    try {
      const claims = await fetchMyClaims(currentUser.id);
      setMyClaims(claims);
    } catch (e) {
      console.error('Failed to load reward claims', e);
    }
  };

  const handleClaimReward = async (reward: Reward) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (currentUser.points < reward.pointsCost) {
      setClaimErrorMessage(`You need ${reward.pointsCost} points to claim this reward. You have ${currentUser.points} points.`);
      setTimeout(() => setClaimErrorMessage(null), 4000);
      return;
    }

    setClaimingId(reward.id);
    setClaimErrorMessage(null);

    try {
      const res = await claimReward(currentUser.id, reward.id);
      if (res.success) {
        onPointsUpdated(res.remainingPoints);
        setClaimSuccessMessage(`Reward claimed! Code: ${res.claim.claimCode}. Find it in your Vouchers tab.`);
        setTimeout(() => setClaimSuccessMessage(null), 5000);
        await loadClaims();
      }
    } catch (err: any) {
      setClaimErrorMessage(err.message || 'Failed to claim reward');
    } finally {
      setClaimingId(null);
    }
  };

  const openVoucherQR = async (claim: RewardClaim) => {
    setActiveVoucherModal(claim);
    try {
      const url = await QRCode.toDataURL(claim.claimCode, {
        width: 280,
        margin: 2,
        color: { dark: '#29221D', light: '#FAF7F2' }
      });
      setVoucherQrUrl(url);
    } catch (e) {}
  };

  const handleStaffRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffCodeInput.trim()) return;

    setIsVerifyingStaff(true);
    setStaffResult(null);

    try {
      const res = await verifyClaimCode(staffCodeInput.trim(), currentUser?.email || 'staff@azrocafe.com');
      setStaffResult({ success: true, message: res.message });
      setStaffCodeInput('');
      if (currentUser) loadClaims();
    } catch (err: any) {
      setStaffResult({ success: false, message: err.message || 'Failed to redeem' });
    } finally {
      setIsVerifyingStaff(false);
    }
  };

  const isStaffOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';

  return (
    <div className="space-y-8 pb-24">
      {/* Top Banner & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29221D] font-['Playfair_Display',serif]">
            Rewards & Vouchers
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Redeem your accrued loyalty points for specialty beverages, morning pastries, and private cupping sessions.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF7F2] border border-[#EADFCF] rounded-2xl shrink-0 self-start sm:self-auto">
          <button
            id="rewards-tab-catalog"
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'catalog' ? 'bg-[#29221D] text-white shadow-xs' : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Catalog
          </button>
          <button
            id="rewards-tab-vouchers"
            onClick={() => setActiveTab('vouchers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'vouchers' ? 'bg-[#29221D] text-white shadow-xs' : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span>My Vouchers</span>
            {myClaims.filter(c => c.status === 'active').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#D97724] text-white text-[10px] flex items-center justify-center font-bold">
                {myClaims.filter(c => c.status === 'active').length}
              </span>
            )}
          </button>
          {isStaffOrAdmin && (
            <button
              id="rewards-tab-staff"
              onClick={() => setActiveTab('staff')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'staff' ? 'bg-amber-800 text-white shadow-xs' : 'text-amber-900 hover:text-amber-950'
              }`}
            >
              <Shield className="w-3 h-3 text-[#E5A93C]" />
              <span>Staff Terminal</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Notices */}
      {claimSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{claimSuccessMessage}</span>
        </div>
      )}

      {claimErrorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{claimErrorMessage}</span>
        </div>
      )}

      {/* TAB 1: Rewards Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* User points balance strip */}
          <div className="p-5 rounded-3xl bg-[#FAF0E6] border border-[#EAC9A8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#29221D] text-[#E5A93C]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A64A00] tracking-wider block">
                  Current Balance
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-[#29221D]">
                  {currentUser ? `${currentUser.points} Points Available` : 'Sign in to view your balance'}
                </span>
              </div>
            </div>
            {!currentUser && (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-[#29221D] text-white text-xs font-bold"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rewards.map(reward => {
              const canAfford = currentUser ? currentUser.points >= reward.pointsCost : false;
              const isClaiming = claimingId === reward.id;

              return (
                <div
                  key={reward.id}
                  className="rounded-3xl bg-white border border-[#EADFCF] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
                    <img
                      src={reward.imageUrl}
                      alt={reward.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#29221D]/85 backdrop-blur-xs text-white text-[10px] font-bold">
                      {reward.category}
                    </span>
                    {reward.badge && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#D97724] text-white text-[10px] font-bold shadow-xs">
                        {reward.badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs text-[#29221D] text-sm font-extrabold shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#D97724]" />
                      <span>{reward.pointsCost} pts</span>
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-[#29221D]">{reward.title}</h3>
                      <p className="text-xs text-stone-600 leading-relaxed">{reward.description}</p>
                      <p className="text-[11px] text-stone-400 italic pt-1">{reward.terms}</p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div className="text-xs">
                        {currentUser ? (
                          canAfford ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Ready to Redeem
                            </span>
                          ) : (
                            <span className="text-stone-500 font-medium">
                              Need {reward.pointsCost - currentUser.points} more pts
                            </span>
                          )
                        ) : (
                          <span className="text-stone-400">Members only</span>
                        )}
                      </div>

                      <button
                        id={`claim-reward-${reward.id}`}
                        onClick={() => handleClaimReward(reward)}
                        disabled={isClaiming || (currentUser ? !canAfford : false)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          currentUser && canAfford
                            ? 'bg-[#29221D] hover:bg-[#D97724] text-white shadow-xs active:scale-95'
                            : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        {isClaiming ? 'Claiming...' : 'Claim Reward'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: My Vouchers / Active Wallet */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          {myClaims.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#EADFCF] p-8 space-y-3">
              <Gift className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-bold text-base text-[#29221D]">No Vouchers in Your Wallet Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Redeem rewards from the catalog with your loyalty points to generate claim vouchers.
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl bg-[#29221D] text-white text-xs font-bold mt-2"
              >
                Browse Rewards Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myClaims.map(claim => {
                const isActive = claim.status === 'active';
                return (
                  <div
                    key={claim.id}
                    className={`rounded-3xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                      isActive
                        ? 'bg-white border-[#D97724] shadow-xs'
                        : 'bg-stone-50 border-stone-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {claim.status.toUpperCase()}
                        </span>
                        <h4 className="font-bold text-base text-[#29221D] mt-1.5">
                          {claim.rewardTitle}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Spent: {claim.pointsSpent} points • Claimed {new Date(claim.claimedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">Claim Code</span>
                        <span className="font-mono text-sm font-extrabold text-[#29221D] tracking-wider">
                          {claim.claimCode}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-stone-500">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>Expires {new Date(claim.expiresAt).toLocaleDateString()}</span>
                      </div>

                      {isActive && (
                        <button
                          onClick={() => openVoucherQR(claim)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#FAF0E6] text-[#A64A00] font-bold hover:bg-[#FCEAD8] flex items-center gap-1.5 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Show QR</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Staff Verification Terminal */}
      {activeTab === 'staff' && isStaffOrAdmin && (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-3xl border border-[#EADFCF] shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-amber-900">
            <Shield className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base">Barista Claim Redemption Terminal</h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Enter or scan customer claim code (e.g. AZRO-LATTE-8931) to verify validity and mark the item as redeemed.
          </p>

          <form onSubmit={handleStaffRedeem} className="space-y-3">
            <input
              type="text"
              placeholder="Enter code e.g. AZRO-BAKE-8931"
              value={staffCodeInput}
              onChange={e => setStaffCodeInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-2xl border border-stone-300 font-mono text-base font-bold text-[#29221D] tracking-wider focus:outline-none focus:ring-2 focus:ring-[#D97724] uppercase placeholder:font-sans placeholder:normal-case placeholder:text-stone-400"
            />

            <button
              type="submit"
              disabled={!staffCodeInput.trim() || isVerifyingStaff}
              className="w-full py-3 rounded-2xl bg-[#29221D] hover:bg-[#3D322B] text-white font-bold text-sm transition-all disabled:opacity-50"
            >
              {isVerifyingStaff ? 'Verifying...' : 'Verify & Mark as Redeemed'}
            </button>
          </form>

          {staffResult && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold ${
                staffResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              {staffResult.message}
            </div>
          )}
        </div>
      )}

      {/* Voucher QR Modal */}
      {activeVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#EADFCF] p-6 text-center space-y-4">
            <h3 className="font-bold text-base text-[#29221D]">
              {activeVoucherModal.rewardTitle}
            </h3>

            <div className="mx-auto w-56 h-56 p-2 bg-[#FAF7F2] rounded-2xl border border-[#EADFCF] flex items-center justify-center">
              {voucherQrUrl && (
                <img src={voucherQrUrl} alt="Voucher QR Code" className="w-full h-full object-contain" />
              )}
            </div>

            <div className="font-mono text-base font-extrabold text-[#29221D] tracking-widest bg-[#FAF0E6] py-2 rounded-xl border border-[#EAC9A8]">
              {activeVoucherModal.claimCode}
            </div>

            <p className="text-xs text-stone-500">
              Present to your barista at checkout to redeem this item.
            </p>

            <button
              onClick={() => setActiveVoucherModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#29221D] text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
