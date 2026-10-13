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
  onOpenSettings?: () => void;
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

  // Modal Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      const destination: NavTab = ((notif.targetTab as string) === 'splits' ? 'household' : notif.targetTab) as NavTab;
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
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-sky-400" />
        );
      case 'PEER_DEBT_UPDATE':
        return <Users className="w-4 h-4 text-indigo-400" />;
      case 'BILL_DUE':
        return <CalendarClock className="w-4 h-4 text-amber-400" />;
      case 'BUDGET_EXCEEDED':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'BUDGET_WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'GOAL_MILESTONE':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
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
    <>
      {/* Launcher Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="interactive-btn relative p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] group transition"
        title="Open Notification Center & Security Logs"
      >
        <Bell className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* TOP FLOATING TOAST (Positioned "Above" as requested) */}
      {latestIncomingAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-md animate-fade-in pointer-events-auto">
          <div className="p-3 rounded-2xl modal-card-luxury border border-emerald-500/30 bg-[var(--surface-modal)]/95 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
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
                className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs font-medium text-[var(--fg)] transition flex items-center gap-1"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setLatestIncomingAlert(null)}
                className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL CENTERED LUXURY MODAL POP-UP (Not a clipped dropdown) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="modal-card-luxury w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.85)] border border-[var(--border)] flex flex-col backdrop-blur-2xl bg-[var(--surface-modal)] animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[var(--fg)]">Notification Center</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--fg-muted)]">
                    Audit trail, security sign-ins, debt settlements, and cash flow alerts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleScanAlerts}
                  disabled={isScanning}
                  className="interactive-btn px-2.5 py-1.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition text-xs flex items-center gap-1.5"
                  title="Scan bills & budget overruns now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-400' : ''}`} />
                  <span className="text-xs hidden sm:inline">Scan Radar</span>
                </button>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="interactive-btn px-2.5 py-1.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition text-xs flex items-center gap-1.5"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs hidden sm:inline">Mark all read</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-3)] transition border border-transparent hover:border-[var(--border)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Chips Bar */}
            <div className="px-6 py-2.5 border-b border-[var(--border)] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-[var(--surface)]">
              {(
                [
                  { id: 'ALL', label: 'All Alerts' },
                  { id: 'ACTIVITY', label: 'Transactions' },
                  { id: 'BILLS', label: 'Bills & Radar' },
                  { id: 'BUDGETS', label: 'Envelopes' },
                  { id: 'SPLITS', label: 'Peer Debts' },
                  { id: 'GOALS', label: 'Milestones' },
                  { id: 'SECURITY', label: 'Security & Auth' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                    filter === tab.id
                      ? 'bg-[var(--fg)] text-[var(--bg)] font-semibold shadow-sm'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notifications Scroll List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)] no-scrollbar p-2">
              {filteredList.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--fg-muted)]">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--fg)]">All Caught Up</h4>
                  <p className="text-xs text-[var(--fg-muted)] max-w-sm mx-auto">
                    No active notifications in this category. We monitor your ledger, bill renewals, peer debts, and sign-ins 24/7.
                  </p>
                </div>
              ) : (
                filteredList.map((notif) => {
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 rounded-2xl hover:bg-[var(--surface-2)]/70 transition cursor-pointer flex items-start gap-3.5 relative group ${
                        !notif.isRead ? 'bg-emerald-500/[0.04]' : ''
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-5 left-2 shrink-0 animate-pulse" />
                      )}

                      {/* Icon container */}
                      <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                        {getIcon(notif.type, notif.severity)}
                      </div>

                      {/* Main Message Content */}
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-xs font-semibold text-[var(--fg)] truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-[var(--fg-muted)] shrink-0 font-mono">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
                          {notif.message}
                        </p>

                        {notif.targetTab && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] group-hover:underline">
                            <span>Open in {(notif.targetTab as string) === 'splits' ? 'Splits & Household' : notif.targetTab}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Quick Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition absolute right-3 top-4">
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            title="Mark as read"
                            className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--fg-muted)] hover:text-emerald-400 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(notif.id, e)}
                          title="Delete notification"
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--fg-muted)] hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]/60 flex items-center justify-between text-xs text-[var(--fg-muted)] shrink-0">
              <button
                type="button"
                onClick={async () => {
                  await api.clearAllNotifications();
                  setNotifications([]);
                  setUnreadCount(0);
                }}
                className="text-xs text-[var(--fg-muted)] hover:text-rose-400 transition"
              >
                Clear all notifications
              </button>

              <div className="flex items-center gap-4">
                <span className="text-[11px] text-[var(--fg-muted)] hidden sm:inline">
                  Real-time synchronization active
                </span>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenSettings();
                    }}
                    className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center gap-1 transition"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Preferences</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
