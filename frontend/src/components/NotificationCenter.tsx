import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AppNotification, NotificationType, NavTab } from '../types';
import { api } from '../services/api';

interface NotificationCenterProps {
  onNavigateTab?: (tab: NavTab) => void;
  onOpenSettings?: (subTab?: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNavigateTab,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVITY' | 'BILLS' | 'BUDGETS' | 'SPLITS' | 'GOALS' | 'SECURITY'>('ALL');
  const [isScanning, setIsScanning] = useState(false);
  const [latestIncomingAlert, setLatestIncomingAlert] = useState<AppNotification | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastSeenIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);

  const fetchNotifications = async () => {
    try {
      const [list, count] = await Promise.all([
        api.getNotifications(),
        api.getUnreadNotificationCount(),
      ]);

      // Detect incoming real-time notifications from other users / concurrent sessions
      if (!isInitialMountRef.current && list.length > 0) {
        const newArrivals = list.filter(
          (n) => !lastSeenIdsRef.current.has(n.id) && !n.isRead
        );
        if (newArrivals.length > 0) {
          const newest = newArrivals[0];
          setLatestIncomingAlert(newest);
        }
      }

      lastSeenIdsRef.current = new Set(list.map((n) => n.id));
      isInitialMountRef.current = false;

      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  // Active polling every 5s for real-time multi-user cross synchronization
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-dismiss top floating toast after 6 seconds
  useEffect(() => {
    if (!latestIncomingAlert) return;
    const timer = setTimeout(() => {
      setLatestIncomingAlert(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [latestIncomingAlert]);

  // Click outside and Escape key listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
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
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchNotifications();
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

  const resolveTargetTab = (notif: AppNotification): NavTab | undefined => {
    if (notif.targetTab) {
      const target = notif.targetTab as string;
      if (target === 'splits') return 'household';
      return notif.targetTab as NavTab;
    }
    // Fallback routing by notification type
    switch (notif.type) {
      case 'BILL_DUE':
        return 'recurring';
      case 'BUDGET_WARNING':
      case 'BUDGET_EXCEEDED':
        return 'budgets';
      case 'PEER_DEBT_UPDATE':
        return 'household';
      case 'GOAL_MILESTONE':
        return 'goals';
      case 'SECURITY':
        return 'admin';
      case 'TRANSACTION_ALERT':
      case 'LARGE_TRANSACTION':
        return 'transactions';
      default:
        return 'dashboard';
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    const destination = resolveTargetTab(notif);
    if (destination && onNavigateTab) {
      onNavigateTab(destination);
      setIsOpen(false);
    }
  };

  const filteredList = notifications.filter((n) => {
    if (filter === 'ACTIVITY') {
      return n.type === 'TRANSACTION_ALERT' || n.type === 'LARGE_TRANSACTION';
    }
    if (filter === 'BILLS') return n.type === 'BILL_DUE';
    if (filter === 'BUDGETS') return n.type === 'BUDGET_WARNING' || n.type === 'BUDGET_EXCEEDED';
    if (filter === 'SPLITS') return n.type === 'PEER_DEBT_UPDATE';
    if (filter === 'GOALS') return n.type === 'GOAL_MILESTONE';
    if (filter === 'SECURITY') return n.type === 'SECURITY' || n.type === 'SYSTEM';
    return true;
  });

  const getIcon = (type: NotificationType, severity: string) => {
    switch (type) {
      case 'TRANSACTION_ALERT':
        return severity === 'SUCCESS' ? (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-sky-400" />
        );
      case 'PEER_DEBT_UPDATE':
        return <Users className="w-3.5 h-3.5 text-indigo-400" />;
      case 'BILL_DUE':
        return <CalendarClock className="w-3.5 h-3.5 text-amber-400" />;
      case 'BUDGET_EXCEEDED':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      case 'BUDGET_WARNING':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'GOAL_MILESTONE':
        return <Trophy className="w-3.5 h-3.5 text-emerald-400" />;
      case 'SECURITY':
        return <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const now = Date.now();
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
    <div className="relative inline-block" ref={containerRef}>
      {/* Launcher Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="interactive-btn relative p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] group transition"
        title="Open Notification Center & Security Logs"
        aria-expanded={isOpen}
      >
        <Bell className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* TOP FLOATING REAL-TIME ALERT TOAST (No black backdrop) */}
      {latestIncomingAlert &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] w-[92vw] max-w-md animate-fade-in pointer-events-auto">
            <div className="p-3 rounded-2xl border border-emerald-500/30 bg-[var(--surface)] shadow-2xl backdrop-blur-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                {getIcon(latestIncomingAlert.type, latestIncomingAlert.severity)}
              </div>

              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  setIsOpen(true);
                  setLatestIncomingAlert(null);
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Real-Time Notification
                  </span>
                  <span className="text-[10px] text-[var(--fg-muted)]">Just now</span>
                </div>
                <h4 className="text-xs font-semibold text-[var(--fg)] truncate">
                  {latestIncomingAlert.title}
                </h4>
                <p className="text-[11px] text-[var(--fg-muted)] truncate">
                  {latestIncomingAlert.message}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(true);
                    setLatestIncomingAlert(null);
                  }}
                  className="px-2 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs font-medium text-[var(--fg)] transition flex items-center gap-1"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setLatestIncomingAlert(null)}
                  className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ANCHORED POPUP DROPDOWN PANEL (Anchored underneath bell icon, NO blackout overlay) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-[440px] max-w-[calc(100vw-2rem)] z-50 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[580px] animate-scale-in"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs text-[var(--fg)]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleScanAlerts}
                disabled={isScanning}
                className="interactive-btn px-2 py-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] bg-[var(--surface)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition text-xs flex items-center gap-1"
                title="Scan bills & budget overruns now"
              >
                <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="text-[11px] hidden sm:inline">Scan</span>
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="interactive-btn px-2 py-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] bg-[var(--surface)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition text-xs flex items-center gap-1"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] hidden sm:inline">Read all</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-3)] transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 bg-[var(--surface)]">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'ACTIVITY', label: 'Activity' },
                { id: 'BILLS', label: 'Bills' },
                { id: 'BUDGETS', label: 'Budgets' },
                { id: 'SPLITS', label: 'Splits' },
                { id: 'GOALS', label: 'Goals' },
                { id: 'SECURITY', label: 'Security' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition ${
                  filter === item.id
                    ? 'bg-[var(--fg)] text-[var(--bg)] shadow-xs'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)] p-1 max-h-[380px]">
            {filteredList.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto mb-2 text-[var(--fg-muted)]">
                  <Bell className="w-4 h-4 opacity-50" />
                </div>
                <h4 className="text-xs font-semibold text-[var(--fg)]">No notifications</h4>
                <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  You're fully up to date. Incoming activity will appear here.
                </p>
              </div>
            ) : (
              filteredList.map((notif) => {
                const targetTab = resolveTargetTab(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 rounded-xl transition cursor-pointer flex items-start gap-3 hover:bg-[var(--surface-2)] ${
                      !notif.isRead ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                        notif.severity === 'ALERT'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                          : notif.severity === 'WARNING'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : notif.severity === 'SUCCESS'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                      }`}
                    >
                      {getIcon(notif.type, notif.severity)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                          {notif.type.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[var(--fg-muted)]">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-[var(--fg)] mt-0.5 leading-snug">
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {targetTab && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <span>View {targetTab}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 self-center">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Mark as read"
                          className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-emerald-400 hover:bg-[var(--surface-3)] transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(notif.id, e)}
                        title="Delete notification"
                        className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-rose-400 hover:bg-[var(--surface-3)] transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Logical Preferences Link */}
          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between text-xs text-[var(--fg-muted)] shrink-0">
            <button
              type="button"
              onClick={async () => {
                await api.clearAllNotifications();
                setNotifications([]);
                setUnreadCount(0);
              }}
              className="text-[11px] text-[var(--fg-muted)] hover:text-rose-400 transition"
            >
              Clear all
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings('notifications');
                }}
                className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center gap-1.5 transition font-medium"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Preferences</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
