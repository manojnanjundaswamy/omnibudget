import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Database,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sliders,
  RefreshCw,
  Sparkles,
  CreditCard,
  UserCheck,
  UserX,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Key,
  Globe,
  FileText,
  Lock,
} from 'lucide-react';
import {
  AdminMetrics,
  AdminUserDetail,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
  AuditLog,
} from '../types';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

export const AdminView: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<AuditLog | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'audit'>('users');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserDetail | null>(null);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // Create form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');
  const [newPlan, setNewPlan] = useState<'STARTER' | 'PRO' | 'HOUSEHOLD'>('PRO');

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAuditLogs = async (cat?: string) => {
    setIsAuditLoading(true);
    try {
      const logs = await api.getAuditLogs(100, cat || auditCategoryFilter);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [m, u, s, logs] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminSettings(),
        api.getAuditLogs(100),
      ]);
      setMetrics(m);
      setUsers(u);
      setSettings(s);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const payload: CreateAdminUserPayload = {
        email: newEmail.trim(),
        name: newName.trim() || undefined,
        role: newRole,
        plan: newPlan,
      };
      const created = await api.createAdminUser(payload);
      setUsers([created, ...users]);
      setIsCreateModalOpen(false);
      setNewEmail('');
      setNewName('');
      setActionNotification(`Successfully provisioned account for ${created.email}!`);
      setTimeout(() => setActionNotification(null), 4000);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const payload: UpdateAdminUserPayload = {
        name: editingUser.name,
        role: editingUser.role,
        plan: editingUser.plan,
        billingCycle: editingUser.billingCycle,
        status: editingUser.status,
      };
      const updated = await api.updateAdminUser(editingUser.id, payload);
      setUsers(users.map(u => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
      setActionNotification(`Updated privileges and plan for ${updated.email}`);
      setTimeout(() => setActionNotification(null), 4000);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) return;
    try {
      await api.deleteAdminUser(id);
      setUsers(users.filter(u => u.id !== id));
      setActionNotification(`User ${email} removed.`);
      setTimeout(() => setActionNotification(null), 4000);
      loadAllAdminData();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleToggleSetting = async (key: string) => {
    try {
      const updated = await api.updateAdminSettings({ [key]: !settings[key] });
      setSettings(updated);
    } catch (err) {
      console.error('Failed to toggle setting:', err);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
    const matchPlan = selectedPlanFilter === 'ALL' || u.plan === selectedPlanFilter;
    return matchSearch && matchPlan;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">Loading platform telemetry & user directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-[var(--accent)]" />
              Admin Console
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg-muted)] text-xs font-bold uppercase tracking-wider">
              Admin
            </span>
          </div>
          <p className="text-xs text-[var(--fg-muted)] mt-1">
            Manage users, monitor platform metrics, and toggle app settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--fg)] font-medium">{metrics?.platformHealth || 'Optimal'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--fg-muted)]">
            <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>PostgreSQL Database</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {actionNotification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionNotification}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Monthly Revenue (MRR)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--fg)]">${metrics?.mrr.toFixed(2)}</span>
            <span className="text-xs text-emerald-500 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4%
            </span>
          </div>
          <p className="text-[11px] text-[var(--fg-muted)]">Annualized: ${metrics?.arr.toFixed(2)}</p>
        </div>

        {/* Users & DAU */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Users & Activity</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--fg)]">{metrics?.totalUsers} Users</span>
            <span className="text-xs text-purple-500 font-semibold">{metrics?.activeUsersToday} Active Today</span>
          </div>
          <p className="text-[11px] text-[var(--fg-muted)]">
            {metrics?.payingSubscribers} Paying Subscribers ({metrics ? Math.round((metrics.payingSubscribers / Math.max(1, metrics.totalUsers)) * 100) : 0}%)
          </p>
        </div>

        {/* Total Monitored Balances */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Monitored Balances</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--fg)]">${metrics?.totalAssetsUnderManagement.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-[var(--fg-muted)]">{metrics?.totalAccountsTracked} Accounts across all users</p>
        </div>

        {/* Total Ledger Volume */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Total Transactions</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--fg)]">{metrics?.totalTransactionsProcessed} Transactions</span>
          </div>
          <p className="text-[11px] text-[var(--fg-muted)]">All recorded transactions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-[var(--accent)] text-[var(--fg)]'
              : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users ({users.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('audit');
            loadAuditLogs();
          }}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-[var(--accent)] text-[var(--fg)]'
              : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
          <span>Security & Audit Trail ({auditLogs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-[var(--accent)] text-[var(--fg)]'
              : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Feature Settings</span>
        </button>
      </div>

      {/* TAB 1: User Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-[var(--fg-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter users by name or email..."
                  className="w-full pl-9 pr-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <select
                value={selectedPlanFilter}
                onChange={e => setSelectedPlanFilter(e.target.value)}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="ALL">All Plans</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="HOUSEHOLD">Household</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--fg)]">
                <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[11px] text-[var(--fg-muted)] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Plan</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Accounts / Balance</th>
                    <th className="py-3 px-4 font-semibold">Joined</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-bold flex items-center justify-center text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-[var(--fg)] block">{u.name}</span>
                            <span className="text-[11px] text-[var(--fg-muted)] block">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-500/10 border border-purple-500/20 text-purple-500'
                              : 'bg-[var(--surface-2)] text-[var(--fg-muted)]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.plan === 'HOUSEHOLD'
                              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                              : u.plan === 'PRO'
                              ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-500'
                              : 'bg-[var(--surface-2)] text-[var(--fg-muted)]'
                          }`}
                        >
                          {u.plan} ({u.billingCycle.toLowerCase()})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                              : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[var(--fg)]">{u.accountsCount} accts</span>
                        <span className="text-[var(--fg-muted)] text-[11px] block">${u.totalBalance.toLocaleString()}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--fg-muted)] text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Demo'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition"
                            title="Edit user plan and privileges"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Feature Settings */}
      {activeTab === 'settings' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--fg)] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--accent)]" />
              App Feature Settings
            </h3>
            <p className="text-xs text-[var(--fg-muted)] mt-1">
              Toggle platform features on or off. Changes take effect immediately.
            </p>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {/* AI Statement */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-[var(--fg)] block">Statement Text Ingestion</span>
                <span className="text-xs text-[var(--fg-muted)] block mt-0.5">
                  Allows users to copy-paste or drop bank statement texts from Chase, BoA, Citi, etc.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('aiStatementIngestEnabled')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.aiStatementIngestEnabled ? 'bg-indigo-600' : 'bg-[var(--surface-2)] border border-[var(--border)]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.aiStatementIngestEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Open Banking OFX */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-[var(--fg)] block">Bank File (.OFX / .QFX) Import</span>
                <span className="text-xs text-[var(--fg-muted)] block mt-0.5">
                  Enables 1-click drag-and-drop ingestion of standard banking download files without bank API licensing.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('openBankingOfxEnabled')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.openBankingOfxEnabled ? 'bg-indigo-600' : 'bg-[var(--surface-2)] border border-[var(--border)]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.openBankingOfxEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Smart Clip */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-[var(--fg)] block">Notification & SMS Quick Capture</span>
                <span className="text-xs text-[var(--fg-muted)] block mt-0.5">
                  Instant extractor for banking alert SMS and push notifications.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('smartClipExtractorEnabled')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.smartClipExtractorEnabled ? 'bg-indigo-600' : 'bg-[var(--surface-2)] border border-[var(--border)]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.smartClipExtractorEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Maintenance Mode */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-[var(--fg)] block">Maintenance Mode</span>
                <span className="text-xs text-[var(--fg-muted)] block mt-0.5">
                  Temporarily pause non-admin logins during database migrations or updates.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('maintenanceMode')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.maintenanceMode ? 'bg-rose-600' : 'bg-[var(--surface-2)] border border-[var(--border)]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Security & Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Audit Controls & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-[var(--fg-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  placeholder="Filter by user, action, description, or IP..."
                  className="w-full pl-9 pr-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditCategoryFilter}
                onChange={e => {
                  setAuditCategoryFilter(e.target.value);
                  loadAuditLogs(e.target.value);
                }}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="ALL">All Categories</option>
                <option value="AUTH">Authentication & Logins</option>
                <option value="TRANSACTION">Transactions</option>
                <option value="LEDGER">Ledger & Settlements</option>
                <option value="ADMIN">Admin Actions</option>
                <option value="SECURITY">Security Events</option>
              </select>

              <button
                type="button"
                onClick={() => loadAuditLogs()}
                disabled={isAuditLoading}
                className="interactive-btn px-3 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--fg)] flex items-center gap-1.5 transition"
                title="Refresh audit stream"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditLoading ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Metrics summary banner for audits */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--fg-muted)] uppercase tracking-wider block">Total Audit Trail</span>
              <span className="text-lg font-bold text-[var(--fg)] mt-0.5 block">{auditLogs.length} Events</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Auth Sessions</span>
              <span className="text-lg font-bold text-[var(--fg)] mt-0.5 block">
                {auditLogs.filter(l => l.category === 'AUTH').length}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Transactions</span>
              <span className="text-lg font-bold text-[var(--fg)] mt-0.5 block">
                {auditLogs.filter(l => l.category === 'TRANSACTION').length}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Settlements & Groups</span>
              <span className="text-lg font-bold text-[var(--fg)] mt-0.5 block">
                {auditLogs.filter(l => l.category === 'LEDGER').length}
              </span>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--fg)]">
                <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[11px] text-[var(--fg-muted)] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Action & Category</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Severity</th>
                    <th className="py-3 px-4 font-semibold">IP Address</th>
                    <th className="py-3 px-4 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {auditLogs
                    .filter(l => {
                      const q = auditSearch.toLowerCase();
                      const matchSearch =
                        !q ||
                        l.description.toLowerCase().includes(q) ||
                        l.action.toLowerCase().includes(q) ||
                        l.userEmail.toLowerCase().includes(q) ||
                        (l.userName && l.userName.toLowerCase().includes(q)) ||
                        (l.ipAddress && l.ipAddress.includes(q));
                      return matchSearch;
                    })
                    .map(log => {
                      const categoryColors: Record<string, string> = {
                        AUTH: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                        TRANSACTION: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        LEDGER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                        ADMIN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                        SECURITY: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                      };
                      const catClass = categoryColors[log.category] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

                      return (
                        <tr key={log.id} className="hover:bg-[var(--surface-2)]/60 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[var(--fg-muted)]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-semibold text-[var(--fg)] block">{log.userName || 'OmniUser'}</span>
                              <span className="text-[11px] text-[var(--fg-muted)] font-mono block">{log.userEmail}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${catClass}`}>
                                {log.category}
                              </span>
                              <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                                {log.action}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-md">
                            <p className="text-xs text-[var(--fg)] leading-relaxed line-clamp-2">
                              {log.description}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                log.severity === 'WARNING'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : log.severity === 'CRITICAL' || log.severity === 'SECURITY'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}
                            >
                              {log.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[var(--fg-muted)]">
                            {log.ipAddress || '127.0.0.1'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedAuditDetail(log)}
                              className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs font-medium text-[var(--fg)] border border-[var(--border)] transition"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {auditLogs.length === 0 && (
                <div className="p-12 text-center text-xs text-[var(--fg-muted)]">
                  No audit logs recorded yet. Security logins and financial activities will stream here live.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--fg)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--accent)]" />
                Add User
              </h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Plan</label>
                  <select
                    value={newPlan}
                    onChange={e => setNewPlan(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="STARTER">Starter ($0)</option>
                    <option value="PRO">Pro ($9.99/mo)</option>
                    <option value="HOUSEHOLD">Household ($14.99/mo)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)] rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] rounded-xl text-xs font-bold transition"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--fg)] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[var(--accent)]" />
                Edit User
              </h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Email</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 bg-[var(--surface-2)]/60 border border-[var(--border)] rounded-xl text-xs text-[var(--fg-muted)] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Plan</label>
                  <select
                    value={editingUser.plan}
                    onChange={e => setEditingUser({ ...editingUser, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="HOUSEHOLD">Household</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Billing Cycle</label>
                  <select
                    value={editingUser.billingCycle}
                    onChange={e => setEditingUser({ ...editingUser, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)] rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] rounded-xl text-xs font-bold transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Detail Inspector Modal */}
      {selectedAuditDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAuditDetail(null);
          }}
        >
          <div className="modal-card-luxury w-full max-w-lg rounded-3xl p-6 border border-[var(--border)] shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl bg-[var(--surface-modal)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--fg)]">Security Audit Record</h3>
                  <span className="text-[10px] font-mono text-[var(--fg-muted)]">ID: {selectedAuditDetail.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditDetail(null)}
                className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider block font-bold">Category & Action</span>
                <span className="font-bold text-[var(--fg)] mt-0.5 block">{selectedAuditDetail.category}</span>
                <span className="text-[11px] font-mono text-purple-400 block">{selectedAuditDetail.action}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider block font-bold">Severity & Client</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">{selectedAuditDetail.severity}</span>
                <span className="text-[11px] font-mono text-[var(--fg-muted)] block">IP: {selectedAuditDetail.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1 text-xs">
              <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider block font-bold">User Identity</span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--fg)]">{selectedAuditDetail.userName || 'OmniUser'}</span>
                <span className="font-mono text-[11px] text-[var(--fg-muted)]">{selectedAuditDetail.userEmail}</span>
              </div>
              {selectedAuditDetail.userId && (
                <span className="text-[10px] font-mono text-[var(--fg-muted)] block truncate">
                  User ID: {selectedAuditDetail.userId}
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1 text-xs">
              <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider block font-bold">Event Description</span>
              <p className="text-xs text-[var(--fg)] leading-relaxed">
                {selectedAuditDetail.description}
              </p>
            </div>

            {selectedAuditDetail.metadataJson && (
              <div className="p-3.5 rounded-xl bg-black/40 border border-[var(--border)] space-y-1">
                <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider block font-bold font-mono">Metadata Payload</span>
                <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-32">
                  {selectedAuditDetail.metadataJson}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                Recorded: {new Date(selectedAuditDetail.createdAt).toISOString()}
              </span>
              <button
                type="button"
                onClick={() => setSelectedAuditDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-bold text-xs hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
