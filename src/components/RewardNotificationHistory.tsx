import React, { useState } from 'react';
import {
  MessageSquare, Search, Send, CheckCircle2, Clock, Smartphone,
  ExternalLink, Copy, Check, RefreshCw, X, Gift, Sparkles, Filter
} from 'lucide-react';
import { RewardNotificationRecord, Reward } from '../types';
import { sendTestRewardNotification, resendRewardNotification } from '../api';

interface RewardNotificationHistoryProps {
  notifications: RewardNotificationRecord[];
  rewards: Reward[];
  onRefresh: () => void;
}

export const RewardNotificationHistory: React.FC<RewardNotificationHistoryProps> = ({
  notifications,
  rewards,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Delivered' | 'Sent'>('all');
  const [selectedNotif, setSelectedNotif] = useState<RewardNotificationRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendSuccessId, setResendSuccessId] = useState<string | null>(null);

  // Test notification modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testForm, setTestForm] = useState({
    customerName: 'Alex Mercer',
    mobileNumber: '+91 98765 43210',
    rewardTitle: 'Free Specialty Beverage',
    rewardValue: 350
  });
  const [testSending, setTestSending] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Filtered list
  const filtered = notifications.filter(n => {
    const matchesSearch =
      n.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.mobileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.rewardName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      await resendRewardNotification(id);
      setResendSuccessId(id);
      setTimeout(() => setResendSuccessId(null), 3000);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setResendingId(null);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSending(true);
    setTestSuccessMessage(null);
    try {
      const res = await sendTestRewardNotification({
        customerName: testForm.customerName,
        mobileNumber: testForm.mobileNumber,
        rewardTitle: testForm.rewardTitle,
        rewardValue: Number(testForm.rewardValue)
      });
      if (res.success) {
        setTestSuccessMessage(`Notification successfully triggered and recorded for ${testForm.mobileNumber}!`);
        setTimeout(() => {
          setShowTestModal(false);
          setTestSuccessMessage(null);
        }, 1800);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestSending(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="reward-notification-history-section" className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#29221D] via-[#352B24] to-[#29221D] text-white border border-[#4A3B30] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Automatic WhatsApp & SMS Trigger Active
          </div>
          <h2 className="text-xl font-bold font-['Playfair_Display',serif]">
            Customer Reward Notification History
          </h2>
          <p className="text-xs text-stone-300 max-w-2xl">
            Automatically dispatches branded WhatsApp and SMS alerts to customer registered mobile numbers the instant their required visits unlock a reward.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="trigger-test-notif-btn"
            onClick={() => setShowTestModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#D97724] hover:bg-[#C2651B] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Notification</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Refresh History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] shadow-2xs space-y-1">
          <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">
            Total Dispatched
          </span>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#D97724]" />
            <span className="text-2xl font-extrabold text-[#29221D] font-mono">
              {notifications.length}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] shadow-2xs space-y-1">
          <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">
            Delivery Status
          </span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-2xl font-extrabold text-emerald-700 font-mono">
              100%
            </span>
            <span className="text-[10px] text-stone-400 font-medium">Delivered</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] shadow-2xs space-y-1">
          <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">
            Primary Channel
          </span>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-[#29221D]">
              WhatsApp & SMS
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] shadow-2xs space-y-1">
          <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">
            Anti-Duplicate Guard
          </span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97724]" />
            <span className="text-xs font-bold text-stone-800">
              Idempotent (1/Unlock)
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EADFCF]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="notification-search-input"
            type="text"
            placeholder="Search by customer, phone, reward..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#D97724] bg-stone-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 text-xs text-stone-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            id="notification-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#D97724]"
          >
            <option value="all">All Notifications</option>
            <option value="Delivered">Delivered</option>
            <option value="Sent">Sent</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="rounded-3xl bg-white border border-[#EADFCF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="reward-notification-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#EADFCF] text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Mobile Number</th>
                <th className="py-3.5 px-4">Reward</th>
                <th className="py-3.5 px-4">Notification Status</th>
                <th className="py-3.5 px-4">Sent Date / Time</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <MessageSquare className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-sm">No notification records found</p>
                    <p className="text-xs text-stone-400 mt-1">
                      Notifications will automatically trigger when customers complete required visits to unlock rewards.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(record => (
                  <tr
                    key={record.id}
                    id={`notif-row-${record.id}`}
                    className="hover:bg-amber-50/40 transition-colors"
                  >
                    {/* Customer Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#29221D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {record.customerName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-stone-900 block">
                            {record.customerName}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            ID: {record.customerId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Mobile Number */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono text-[11px] font-semibold border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {record.mobileNumber}
                        </span>
                        <a
                          href={`https://wa.me/${record.mobileNumber.replace(/\D/g, '')}?text=${encodeURIComponent(record.message)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-stone-400 hover:text-emerald-600 transition-colors"
                          title="Open WhatsApp Chat"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Reward */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-[#D97724] shrink-0" />
                          <span className="font-semibold text-stone-900">
                            {record.rewardName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500">
                          <span className="font-bold text-[#A64A00] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                            Value: ₹{record.rewardValue}
                          </span>
                          <span>Expires: {record.expiryDate}</span>
                        </div>
                      </div>
                    </td>

                    {/* Notification Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {record.status}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">
                          via {record.channel}
                        </span>
                      </div>
                    </td>

                    {/* Sent Date / Time */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-stone-600 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{formatDate(record.sentAt)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`view-msg-btn-${record.id}`}
                          onClick={() => setSelectedNotif(record)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#29221D] hover:text-white text-stone-700 text-xs font-semibold transition-all"
                        >
                          View Message
                        </button>
                        <button
                          onClick={() => handleResend(record.id)}
                          disabled={resendingId === record.id}
                          className={`p-1.5 rounded-lg border transition-all ${
                            resendSuccessId === record.id
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'border-stone-200 text-stone-500 hover:bg-stone-100'
                          }`}
                          title="Resend WhatsApp / SMS Notification"
                        >
                          {resendSuccessId === record.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <RefreshCw className={`w-3.5 h-3.5 ${resendingId === record.id ? 'animate-spin' : ''}`} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Message Preview Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#EFEAE2] max-w-md w-full rounded-3xl overflow-hidden shadow-2xl border border-stone-300 animate-in fade-in zoom-in-95">
            {/* WhatsApp App Header Bar */}
            <div className="bg-[#075E54] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center font-bold text-white shadow-xs">
                  ☕
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">AZRO CAFE</span>
                    <span className="bg-emerald-400 text-[#075E54] rounded-full p-0.5 text-[9px] font-black">✓</span>
                  </div>
                  <span className="text-[11px] text-emerald-100 block">
                    Verified Business • WhatsApp & SMS
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="text-center">
                <span className="px-3 py-1 rounded-md bg-white/80 text-[10px] text-stone-500 font-semibold shadow-2xs">
                  Sent to {selectedNotif.mobileNumber} • {formatDate(selectedNotif.sentAt)}
                </span>
              </div>

              {/* Exact WhatsApp Bubble */}
              <div className="bg-white rounded-2xl rounded-tl-xs p-4 shadow-sm border border-stone-200 space-y-2 relative">
                <pre className="font-sans text-xs sm:text-sm text-[#111B21] whitespace-pre-wrap leading-relaxed select-text">
                  {selectedNotif.message}
                </pre>

                <div className="flex items-center justify-end gap-1 text-[10px] text-stone-400 pt-1">
                  <span>{new Date(selectedNotif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-sky-500 font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-[#F0F2F5] border-t border-stone-200 flex items-center justify-between gap-3">
              <button
                onClick={() => handleCopyMessage(selectedNotif.message)}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold border border-stone-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Message'}</span>
              </button>

              <a
                href={`https://wa.me/${selectedNotif.mobileNumber.replace(/\D/g, '')}?text=${encodeURIComponent(selectedNotif.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Notification Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl border border-stone-300 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D97724] text-white flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#29221D]">Trigger Test Reward Notification</h3>
                  <p className="text-[11px] text-stone-500">Test automatic WhatsApp & SMS dispatch format</p>
                </div>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {testSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{testSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendTest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={testForm.customerName}
                    onChange={e => setTestForm({ ...testForm, customerName: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#D97724] outline-none"
                    placeholder="e.g. Alex Mercer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={testForm.mobileNumber}
                    onChange={e => setTestForm({ ...testForm, mobileNumber: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#D97724] outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Reward Name</label>
                  <select
                    value={testForm.rewardTitle}
                    onChange={e => {
                      const sel = rewards.find(r => r.title === e.target.value);
                      setTestForm({
                        ...testForm,
                        rewardTitle: e.target.value,
                        rewardValue: sel?.rewardValue || testForm.rewardValue
                      });
                    }}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#D97724] outline-none bg-white"
                  >
                    {rewards.map(r => (
                      <option key={r.id} value={r.title}>
                        {r.title} (Visits: {r.requiredVisits}, ₹{r.rewardValue})
                      </option>
                    ))}
                    <option value="Free Specialty Beverage">Free Specialty Beverage</option>
                    <option value="Free Artisanal Pastry or Cookie">Free Artisanal Pastry or Cookie</option>
                    <option value="25% Off Entire Order">25% Off Entire Order</option>
                    <option value="AZRO Private Cupping Experience">AZRO Private Cupping Experience</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Reward Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={testForm.rewardValue}
                    onChange={e => setTestForm({ ...testForm, rewardValue: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#D97724] outline-none"
                    placeholder="e.g. 350"
                  />
                </div>
              </div>

              {/* Live Preview of formatted template */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  Live Message Preview (Exact Output):
                </span>
                <div className="p-3 bg-white rounded-lg border border-stone-200 text-[11px] font-sans text-stone-800 whitespace-pre-wrap max-h-36 overflow-y-auto">
{`🎉 AZRO CAFE – Reward Unlocked! ☕✨

Hi ${testForm.customerName || '[Customer Name]'}! 👋

Congratulations! 🎊 You have successfully unlocked a reward from AZRO CAFE.

Your reward is now ready to claim. 🎁

You can claim your reward at AZRO CAFE by showing your registered mobile number or QR code.

🔥 Reward: ${testForm.rewardTitle}
🎟️ Reward Value: ₹${testForm.rewardValue}
📅 Valid Until: 30 Days From Today

Thank you for being a loyal AZRO CAFE customer! ❤️

— Team AZRO CAFE ☕
"Your Loyalty, Our Reward."`}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testSending}
                  className="flex-1 py-2.5 rounded-xl bg-[#29221D] hover:bg-[#3D322B] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className={`w-3.5 h-3.5 ${testSending ? 'animate-spin' : ''}`} />
                  <span>{testSending ? 'Dispatching...' : 'Dispatch Notification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
