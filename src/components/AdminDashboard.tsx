import React, { useState, useEffect } from 'react';
import {
  Shield, BarChart3, Coffee, Settings, FileText, CheckCircle2,
  Clock, AlertTriangle, Users, DollarSign, Plus, Eye, RefreshCw,
  QrCode, Trash2, MessageSquare
} from 'lucide-react';
import {
  AnalyticsSummary, Order, MenuItem, AuditLog, CafeSettings, CustomerProfile,
  RewardNotificationRecord, Reward
} from '../types';
import {
  fetchAnalytics, fetchOrders, updateOrderStatus, fetchMenu,
  addMenuItem, updateMenuItem, deleteMenuItem, fetchAuditLogs,
  fetchSettings, updateSettings, verifyClaimCode, scanVisit, resetSeedData,
  fetchRewardNotifications, fetchRewards
} from '../api';
import { RewardNotificationHistory } from './RewardNotificationHistory';

interface AdminDashboardProps {
  currentUser: CustomerProfile | null;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'notifications' | 'orders' | 'menu' | 'verify' | 'audit' | 'settings'>('analytics');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<CafeSettings | null>(null);
  const [rewardNotifications, setRewardNotifications] = useState<RewardNotificationRecord[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Menu Item Form State
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<MenuItem['category']>('Specialty Espresso');
  const [newItemPrice, setNewItemPrice] = useState(5.50);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImg, setNewItemImg] = useState('');

  // Barista Claim Verification state
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // In-store visit scan simulation
  const [visitScanEmail, setVisitScanEmail] = useState('');
  const [visitScanFeedback, setVisitScanFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Settings form
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [anData, ordData, menuData, auditData, settData, notifData, rewardData] = await Promise.all([
        fetchAnalytics(),
        fetchOrders(),
        fetchMenu(),
        fetchAuditLogs(),
        fetchSettings(),
        fetchRewardNotifications(),
        fetchRewards()
      ]);
      setAnalytics(anData);
      setOrders(ordData);
      setMenu(menuData);
      setAuditLogs(auditData);
      setSettings(settData);
      setRewardNotifications(notifData || []);
      setRewards(rewardData || []);
    } catch (err) {
      console.error('Failed loading admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      const updated = await fetchOrders();
      setOrders(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleMenuAvailable = async (item: MenuItem) => {
    try {
      await updateMenuItem(item.id, { available: !item.available });
      const updated = await fetchMenu();
      setMenu(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await deleteMenuItem(id);
      const updated = await fetchMenu();
      setMenu(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      await addMenuItem({
        name: newItemName.trim(),
        category: newItemCategory,
        price: Number(newItemPrice),
        description: newItemDesc.trim() || 'Single-origin specialty item.',
        image: newItemImg.trim() || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
        dietary: [],
        available: true
      });
      setShowAddMenuModal(false);
      setNewItemName('');
      setNewItemDesc('');
      setNewItemImg('');
      const updated = await fetchMenu();
      setMenu(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCodeInput.trim()) return;
    setVerificationFeedback(null);

    try {
      const res = await verifyClaimCode(claimCodeInput.trim(), currentUser?.email || 'admin@azrocafe.com');
      setVerificationFeedback({ success: true, message: res.message });
      setClaimCodeInput('');
      loadAllAdminData();
    } catch (err: any) {
      setVerificationFeedback({ success: false, message: err.message || 'Verification failed' });
    }
  };

  const handleRecordInStoreVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = visitScanEmail.trim();
    if (!query) return;
    setVisitScanFeedback(null);

    try {
      const isEmail = query.includes('@');
      const res = await scanVisit(
        undefined,
        'AZRO_COUNTER_STAFF_TERMINAL',
        'counter_staff',
        isEmail ? query : undefined,
        !isEmail ? query : undefined
      );

      if (res.cooldown) {
        setVisitScanFeedback({
          success: false,
          message: `Duplicate visit prevented! Customer is in cooldown (${res.minutesRemaining}m remaining).`
        });
      } else {
        let unlockText = '';
        if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
          const names = res.newlyUnlocked.map((r: any) => `"${r.title}"`).join(', ');
          unlockText = ` 🎉 REWARD UNLOCKED: ${names}! Automatic WhatsApp/SMS notification sent to customer's mobile!`;
        }
        setVisitScanFeedback({
          success: true,
          message: `Visit recorded successfully! Customer earned +${res.pointsAwarded} points.${unlockText}`
        });
        setVisitScanEmail('');
        loadAllAdminData();
      }
    } catch (err: any) {
      setVisitScanFeedback({ success: false, message: err.message || 'Scan error' });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      await updateSettings(settings);
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 3000);
      loadAllAdminData();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetSeed = async () => {
    if (!confirm('Reset all databases to default demo seed data?')) return;
    await resetSeedData();
    await loadAllAdminData();
  };

  return (
    <div className="space-y-8 pb-28">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#29221D] text-white p-6 rounded-3xl border border-[#3E332B] shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF0E6] text-[#A64A00] text-[10px] font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>AZRO CAFE Management Console</span>
          </div>
          <h1 className="text-2xl font-bold font-['Playfair_Display',serif]">
            Admin & Barista Operations Hub
          </h1>
          <p className="text-xs text-stone-300">
            Real-time orders queue, dynamic QR visit validation, loyalty rules, and analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllAdminData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Reload Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleResetSeed}
            className="px-3 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold border border-rose-700/50 transition-colors"
          >
            Reset Seed Data
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'analytics', label: 'Analytics & Charts', icon: BarChart3 },
          { id: 'notifications', label: `Reward Notifications (${rewardNotifications.length})`, icon: MessageSquare },
          { id: 'orders', label: `Kitchen Queue (${orders.filter(o => o.status !== 'completed').length})`, icon: Coffee },
          { id: 'menu', label: `Menu Manager (${menu.length})`, icon: Plus },
          { id: 'verify', label: 'Terminal & QR Verification', icon: QrCode },
          { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: FileText },
          { id: 'settings', label: 'Loyalty Policies', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#29221D] text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-[#EFE6DA] border border-[#EADFCF]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#D97724]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS & INTERACTIVE CHARTS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] shadow-2xs space-y-1">
              <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">
                Total Revenue
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#29221D] font-mono">
                ${analytics.totalRevenue.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block">+14% vs last week</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] shadow-2xs space-y-1">
              <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">
                Verified Visits
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#29221D] font-mono">
                {analytics.totalVisits}
              </span>
              <span className="text-[10px] text-stone-500 font-semibold block">Via dynamic QR</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] shadow-2xs space-y-1">
              <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">
                Active Patrons
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#29221D] font-mono">
                {analytics.activeCustomers}
              </span>
              <span className="text-[10px] text-stone-500 font-semibold block">Enrolled members</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] shadow-2xs space-y-1">
              <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">
                Rewards Claimed
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#D97724] font-mono">
                {analytics.rewardsRedeemedCount}
              </span>
              <span className="text-[10px] text-stone-500 font-semibold block">Redeemed vouchers</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] shadow-2xs space-y-1 col-span-2 lg:col-span-1">
              <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider block">
                Duplicates Blocked
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-900 font-mono">
                {analytics.duplicateScansBlocked}
              </span>
              <span className="text-[10px] text-stone-500 font-semibold block">Cooldown protected</span>
            </div>
          </div>

          {/* Interactive Chart 1: 7-Day Visit Volume & Blocked Duplicate Scans */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-[#EADFCF] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#29221D]">
                    7-Day Visit Scans & Cooldown Prevention
                  </h3>
                  <p className="text-xs text-stone-500">
                    Daily valid in-cafe visits vs. blocked rapid duplicate scans
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-[#D97724]">
                    <span className="w-3 h-3 rounded-sm bg-[#D97724]" /> Valid Visits
                  </span>
                  <span className="flex items-center gap-1 text-rose-600">
                    <span className="w-3 h-3 rounded-sm bg-rose-400" /> Duplicates Blocked
                  </span>
                </div>
              </div>

              {/* SVG Bar Chart */}
              <div className="pt-4 h-56 flex items-end justify-between gap-3 border-b border-stone-100 px-2">
                {analytics.visitsOverTime.map((d, i) => {
                  const maxVal = 16;
                  const validHeight = (d.visits / maxVal) * 100;
                  const blockedHeight = ((d.scansBlocked || 1) / maxVal) * 100;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#29221D] text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-10">
                        {d.visits} Valid | {d.scansBlocked} Blocked
                      </div>

                      <div className="w-full max-w-[28px] flex items-end gap-1 h-44">
                        {/* Valid visits bar */}
                        <div
                          className="flex-1 bg-[#D97724] rounded-t-md transition-all duration-300 group-hover:bg-[#C2651B]"
                          style={{ height: `${validHeight}%` }}
                        />
                        {/* Blocked scans bar */}
                        <div
                          className="flex-1 bg-rose-300 rounded-t-md transition-all duration-300 group-hover:bg-rose-400"
                          style={{ height: `${blockedHeight}%` }}
                        />
                      </div>

                      <span className="text-[11px] text-stone-500 font-bold">{d.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Chart 2: Revenue Trend Line */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-[#EADFCF] shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-base text-[#29221D]">
                  Daily Cafe Ticket Sales ($)
                </h3>
                <p className="text-xs text-stone-500">
                  Total revenue across in-store and order-ahead tickets
                </p>
              </div>

              {/* SVG Area chart */}
              <div className="pt-4 h-56 flex items-end justify-between gap-2 border-b border-stone-100 px-2">
                {analytics.revenueOverTime.map((d, i) => {
                  const maxRev = 350;
                  const h = Math.min(100, (d.amount / maxRev) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[#29221D] text-white text-[10px] py-1 px-1.5 rounded-md pointer-events-none whitespace-nowrap z-10">
                        ${d.amount}
                      </div>
                      <div
                        className="w-full max-w-[24px] bg-[#29221D] rounded-t-lg transition-all duration-300 group-hover:bg-[#E5A93C]"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[11px] text-stone-500 font-bold">{d.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Breakdown: Popular Items & Membership Tier Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Items */}
            <div className="p-6 rounded-3xl bg-white border border-[#EADFCF] shadow-xs space-y-4">
              <h3 className="font-bold text-base text-[#29221D]">Top Selling Items</h3>
              <div className="space-y-3">
                {analytics.popularItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#A64A00] font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-stone-800 block">{item.name}</span>
                        <span className="text-[10px] text-stone-400">{item.category}</span>
                      </div>
                    </div>
                    <span className="font-bold text-stone-900 bg-stone-50 px-2 py-1 rounded-md border border-stone-200">
                      {item.count} sold
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier Distribution */}
            <div className="p-6 rounded-3xl bg-white border border-[#EADFCF] shadow-xs space-y-4">
              <h3 className="font-bold text-base text-[#29221D]">Membership Tier Distribution</h3>
              <div className="space-y-3">
                {analytics.tierDistribution.map(t => {
                  const totalMembers = analytics.tierDistribution.reduce((sum, item) => sum + item.count, 0);
                  const pct = Math.round((t.count / totalMembers) * 100);

                  return (
                    <div key={t.tier} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-stone-700">
                        <span>{t.tier} Tier</span>
                        <span>{t.count} members ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            t.tier === 'Platinum' ? 'bg-[#845EC2]' :
                            t.tier === 'Gold' ? 'bg-[#E5A93C]' :
                            t.tier === 'Silver' ? 'bg-stone-400' : 'bg-[#D97724]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: REWARD NOTIFICATIONS HISTORY */}
      {activeTab === 'notifications' && (
        <RewardNotificationHistory
          notifications={rewardNotifications}
          rewards={rewards}
          onRefresh={loadAllAdminData}
        />
      )}

      {/* TAB 2: LIVE ORDERS KITCHEN QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-[#29221D]">
              Real-Time Kitchen / Barista Order Dispatch
            </h3>
            <span className="text-xs text-stone-500">
              Update status as drinks are prepared and dispatched to tables
            </span>
          </div>

          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order.id}
                className="p-5 rounded-3xl bg-white border border-[#EADFCF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-[#29221D]">{order.orderNumber}</span>
                    <span className="text-xs text-stone-500">• {order.customerName} ({order.customerEmail})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0E6] text-[#A64A00]">
                      {order.orderType === 'dine_in' ? `Dine-in (${order.tableNumber || 'Table'})` : 'Takeaway'}
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="text-xs text-stone-600 space-y-0.5">
                    {order.items.map(item => (
                      <div key={item.id}>
                        • {item.quantity}x <span className="font-semibold">{item.menuItem.name}</span>
                        {item.customization && (
                          <span className="text-[11px] text-stone-400 ml-1">
                            ({[item.customization.size, item.customization.milk, item.customization.syrup].filter(Boolean).join(', ')})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-lg">
                      Note: {order.notes}
                    </p>
                  )}
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {(['pending', 'brewing', 'ready', 'completed'] as const).map(st => {
                    const isCurrent = order.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleUpdateOrderStatus(order.id, st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                          isCurrent
                            ? 'bg-[#29221D] text-white shadow-xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MENU MANAGER */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#29221D]">Menu Catalog Management</h3>
              <p className="text-xs text-stone-500">Toggle item availability or add new specialty roasts</p>
            </div>
            <button
              onClick={() => setShowAddMenuModal(true)}
              className="px-4 py-2 rounded-xl bg-[#29221D] text-white text-xs font-bold hover:bg-[#3D322B] flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menu.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-white border border-[#EADFCF] shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0"
                  />
                  <div className="space-y-0.5 flex-1">
                    <span className="text-[10px] text-[#A64A00] font-bold uppercase">{item.category}</span>
                    <h4 className="font-bold text-sm text-[#29221D] line-clamp-1">{item.name}</h4>
                    <span className="font-mono font-bold text-xs text-[#29221D] block">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <button
                    onClick={() => handleToggleMenuAvailable(item)}
                    className={`px-3 py-1 rounded-xl font-semibold transition-colors ${
                      item.available
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {item.available ? 'In Stock' : 'Sold Out'}
                  </button>

                  <button
                    onClick={() => handleDeleteMenuItem(item.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Menu Item Modal */}
          {showAddMenuModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#EADFCF] shadow-2xl space-y-4">
                <h3 className="font-bold text-base text-[#29221D]">Add New Artisan Menu Item</h3>
                <form onSubmit={handleCreateMenuItem} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Item Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Geisha Anaerobic Pour Over"
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Category</label>
                    <select
                      value={newItemCategory}
                      onChange={e => setNewItemCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-white"
                    >
                      <option value="Specialty Espresso">Specialty Espresso</option>
                      <option value="Pour Over & Cold">Pour Over & Cold</option>
                      <option value="Signature Lattes">Signature Lattes</option>
                      <option value="Artisan Pastries">Artisan Pastries</option>
                      <option value="Savory & Brunch">Savory & Brunch</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.10"
                      required
                      value={newItemPrice}
                      onChange={e => setNewItemPrice(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-stone-300"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Description</label>
                    <textarea
                      placeholder="Tasting notes and ingredients..."
                      value={newItemDesc}
                      onChange={e => setNewItemDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 h-20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Image URL (Unsplash or direct)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newItemImg}
                      onChange={e => setNewItemImg(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMenuModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-stone-300 font-bold text-stone-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-[#29221D] text-white font-bold"
                    >
                      Save Item
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TERMINAL & QR VERIFICATION */}
      {activeTab === 'verify' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Claim Code Verification Box */}
          <div className="p-6 rounded-3xl bg-white border border-[#EADFCF] shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[#29221D]">Staff Reward Claim Terminal</h3>
            <p className="text-xs text-stone-600">
              When a customer shows a reward claim code (e.g. AZRO-LATTE-8931), enter it here to redeem.
            </p>

            <form onSubmit={handleVerifyClaimCode} className="space-y-3">
              <input
                type="text"
                placeholder="AZRO-BAKE-8931"
                value={claimCodeInput}
                onChange={e => setClaimCodeInput(e.target.value.toUpperCase())}
                className="w-full p-3 font-mono text-sm uppercase rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#D97724] outline-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#29221D] text-white text-xs font-bold hover:bg-[#3D322B]"
              >
                Verify & Redeem Voucher
              </button>
            </form>

            {verificationFeedback && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                verificationFeedback.success ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
              }`}>
                {verificationFeedback.message}
              </div>
            )}
          </div>

          {/* Barista In-Store Visit Logger */}
          <div className="p-6 rounded-3xl bg-white border border-[#EADFCF] shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[#29221D]">Barista Manual Visit Check-In</h3>
            <p className="text-xs text-stone-600">
              Log visit for customer without mobile app. Duplicate scan cooldown will automatically apply.
            </p>

            <form onSubmit={handleRecordInStoreVisit} className="space-y-3">
              <input
                type="email"
                placeholder="customer@azrocafe.com"
                value={visitScanEmail}
                onChange={e => setVisitScanEmail(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#D97724] outline-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#D97724] text-white text-xs font-bold hover:bg-[#C2651B]"
              >
                Award Visit Points & Stamp
              </button>
            </form>

            {visitScanFeedback && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                visitScanFeedback.success ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'
              }`}>
                {visitScanFeedback.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-[#29221D]">System Audit & Security Logs</h3>
            <span className="text-xs text-stone-500">Chronological history of auth, scans, orders, and setting changes</span>
          </div>

          <div className="divide-y divide-stone-100 rounded-3xl bg-white border border-[#EADFCF] overflow-hidden shadow-xs">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] text-[#29221D] bg-stone-100 px-2 py-0.5 rounded-md">
                      {log.action}
                    </span>
                    <span className="text-stone-500">by {log.actorEmail} ({log.actorRole})</span>
                  </div>
                  <p className="text-stone-700 font-medium">{log.details}</p>
                </div>
                <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CAFE SETTINGS & LOYALTY POLICIES */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white border border-[#EADFCF] shadow-xs max-w-2xl space-y-4">
          <h3 className="font-bold text-base text-[#29221D]">Loyalty & Anti-Fraud Parameters</h3>
          <p className="text-xs text-stone-500">
            Configure visit scan cooldown intervals, point multipliers, and welcome bonuses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Duplicate Scan Cooldown (Minutes)
              </label>
              <input
                type="number"
                value={settings.duplicateScanCooldownMinutes}
                onChange={e => setSettings({ ...settings, duplicateScanCooldownMinutes: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-300"
              />
              <span className="text-[10px] text-stone-400">Minimum delay before next visit reward scan is allowed</span>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Points per In-Store Visit
              </label>
              <input
                type="number"
                value={settings.pointsPerVisit}
                onChange={e => setSettings({ ...settings, pointsPerVisit: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Points per Dollar Spent
              </label>
              <input
                type="number"
                value={settings.pointsPerDollar}
                onChange={e => setSettings({ ...settings, pointsPerDollar: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Welcome Bonus Points (New Signups)
              </label>
              <input
                type="number"
                value={settings.welcomeBonusPoints}
                onChange={e => setSettings({ ...settings, welcomeBonusPoints: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-300"
              />
            </div>
          </div>

          {settingsSavedMessage && (
            <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-xl">
              Settings updated successfully!
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-[#29221D] text-white text-xs font-bold hover:bg-[#3D322B] transition-colors"
            >
              {savingSettings ? 'Saving...' : 'Save Loyalty Policy'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
