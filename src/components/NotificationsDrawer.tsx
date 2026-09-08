import React from 'react';
import { X, Bell, Check, Sparkles, Coffee, Gift, ShieldAlert, Tag } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'visit': return <Sparkles className="w-4 h-4 text-[#D97724]" />;
      case 'order': return <Coffee className="w-4 h-4 text-[#A64A00]" />;
      case 'reward': return <Gift className="w-4 h-4 text-emerald-600" />;
      case 'tier': return <Sparkles className="w-4 h-4 text-[#E5A93C]" />;
      default: return <Tag className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-xs" />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl border-l border-[#EADFCF] flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#FAF7F2]">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#D97724]" />
              <h3 className="font-bold text-base text-[#29221D]">In-App Notifications</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                No notifications right now.
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => onMarkRead(notif.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-stone-50/70 border-stone-200 text-stone-600'
                      : 'bg-[#FAF0E6]/50 border-[#EAC9A8] text-[#29221D] shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-xl bg-white border border-stone-200 shrink-0 mt-0.5">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs">{notif.title}</h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#D97724] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">{notif.message}</p>
                      <span className="text-[9px] text-stone-400 block pt-0.5">
                        {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer mark all */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-stone-100 bg-[#FAF7F2] flex justify-end">
              <button
                onClick={onMarkAllRead}
                className="text-xs font-bold text-[#A64A00] hover:underline"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
