import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  CalendarClock,
  AlertTriangle,
  Trophy,
  ShieldAlert,
  Info,
  Sparkles,
  X,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { AppNotification, NotificationType, NavTab } from '../types';
import { api } from '../services/api';

interface NotificationCenterProps {
  onNavigateTab?: (tab: NavTab) => void;
  onOpenSettings?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNavigateTab,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<'ALL' | 'BILLS' | 'BUDGETS' | 'GOALS' | 'SECURITY'>('ALL');
  const [isScanning, setIsScanning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const [list, count] = await Promise.all([
        api.getNotifications(),
        api.getUnreadNotificationCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000); // Polling every 25s
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScanAlerts = async () => {
    try {
      setIsScanning(true);
      await api.scanAlerts();
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    if (notif.targetTab && onNavigateTab) {
      onNavigateTab(notif.targetTab);
      setIsOpen(false);
    }
  };

  const filteredList = notifications.filter((n) => {
    if (filter === 'BILLS') return n.type === 'BILL_DUE';
    if (filter === 'BUDGETS') return n.type === 'BUDGET_WARNING' || n.type === 'BUDGET_EXCEEDED';
    if (filter === 'GOALS') return n.type === 'GOAL_MILESTONE';
    if (filter === 'SECURITY') return n.type === 'SECURITY';
    return true;
  });

  const getIcon = (type: NotificationType, severity: string) => {
    switch (type) {
      case 'BILL_DUE':
        return <CalendarClock className="w-4 h-4 text-amber-400" />;
      case 'BUDGET_EXCEEDED':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'BUDGET_WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'GOAL_MILESTONE':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-indigo-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'recently';
    try {
      const now = new Date().getTime();
      const then = new Date(isoString).getTime();
      const diffSec = Math.floor((now - then) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="interactive-btn relative p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] group transition"
        title="Notifications & Alerts"
      >
        <Bell className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out / Popover Notification Center */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl modal-card-luxury ambient-accent shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col max-h-[540px] backdrop-blur-xl">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[var(--fg)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleScanAlerts}
                disabled={isScanning}
                className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] transition text-[11px] flex items-center gap-1"
                title="Scan bills & budget overruns now"
              >
                <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="text-[10px] hidden sm:inline">Scan</span>
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] transition text-[10px]"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 bg-[var(--surface)]">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'BILLS', label: 'Bills' },
                { id: 'BUDGETS', label: 'Budgets' },
                { id: 'GOALS', label: 'Milestones' },
                { id: 'SECURITY', label: 'Security' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition shrink-0 ${
                  filter === tab.id
                    ? 'bg-[var(--fg)] text-[var(--bg)] font-semibold shadow-xs'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)] no-scrollbar">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--fg-muted)]">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs font-semibold text-[var(--fg)]">All caught up</p>
                <p className="text-[11px] text-[var(--fg-muted)]">
                  No alerts in this view. We will notify you when bills are due or budgets approach thresholds.
                </p>
              </div>
            ) : (
              filteredList.map((notif) => {
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-[var(--surface-2)]/60 transition cursor-pointer flex items-start gap-3 relative group ${
                      !notif.isRead ? 'bg-emerald-500/[0.03]' : ''
                    }`}
                  >
                    {/* Unread blue/emerald badge dot */}
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-4 left-1.5 shrink-0" />
                    )}

                    {/* Icon container */}
                    <div className="w-7 h-7 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(notif.type, notif.severity)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-semibold text-[var(--fg)] truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-[var(--fg-muted)] shrink-0 font-mono">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--fg-muted)] line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.targetTab && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[var(--accent)] group-hover:underline">
                          <span>View in {notif.targetTab}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Actions on hover */}
                    <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition absolute right-2 top-3">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Mark as read"
                          className="p-1 rounded hover:bg-[var(--surface-3)] text-[var(--fg-muted)] hover:text-emerald-400 transition"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(notif.id, e)}
                        title="Delete notification"
                        className="p-1 rounded hover:bg-[var(--surface-3)] text-[var(--fg-muted)] hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between text-[11px] text-[var(--fg-muted)] shrink-0">
            <button
              type="button"
              onClick={async () => {
                await api.clearAllNotifications();
                setNotifications([]);
                setUnreadCount(0);
              }}
              className="text-[10px] text-[var(--fg-muted)] hover:text-rose-400 transition"
            >
              Clear all
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center gap-1 transition"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Alert Preferences</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
