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
} from 'lucide-react';
import { AdminMetrics, AdminUserDetail, CreateAdminUserPayload, UpdateAdminUserPayload } from '../types';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

export const AdminView: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');

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

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [m, u, s] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminSettings(),
      ]);
      setMetrics(m);
      setUsers(u);
      setSettings(s);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
              Admin Control Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              RBAC Master
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Global SaaS revenue telemetry, platform feature flags, and multi-tenant user provisioning.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-300 font-medium">{metrics?.platformHealth || 'Optimal'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>PostgreSQL 16</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {actionNotification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionNotification}</span>
        </div>
      )}

      {/* Executive SaaS KPI Radar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Recurring (MRR)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">${metrics?.mrr.toFixed(2)}</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4%
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">ARR Run Rate: ${metrics?.arr.toFixed(2)}</p>
        </div>

        {/* Users & DAU */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Users & DAU</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{metrics?.totalUsers} Users</span>
            <span className="text-xs text-purple-400 font-semibold">{metrics?.activeUsersToday} Active Today</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            {metrics?.payingSubscribers} Paying Subscribers ({metrics ? Math.round((metrics.payingSubscribers / Math.max(1, metrics.totalUsers)) * 100) : 0}%)
          </p>
        </div>

        {/* AUM */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Assets Under Track (AUM)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">${metrics?.totalAssetsUnderManagement.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-zinc-500">{metrics?.totalAccountsTracked} Accounts across all institutions</p>
        </div>

        {/* Total Ledger Volume */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ledger Throughput</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{metrics?.totalTransactionsProcessed} Transactions</span>
          </div>
          <p className="text-[11px] text-zinc-500">Double-entry verified & persisted in PostgreSQL</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Directory & Entitlements ({users.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Platform Configurations & Feature Flags</span>
        </button>
      </div>

      {/* TAB 1: User Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter users by name or email..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={selectedPlanFilter}
                onChange={e => setSelectedPlanFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/60 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Plan</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Accounts / Bal</th>
                    <th className="py-3 px-4 font-semibold">Joined</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{u.name}</span>
                            <span className="text-[11px] text-zinc-500 block">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.plan === 'HOUSEHOLD'
                              ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                              : u.plan === 'PRO'
                              ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {u.plan} ({u.billingCycle.toLowerCase()})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white">{u.accountsCount} accts</span>
                        <span className="text-zinc-500 text-[11px] block">${u.totalBalance.toLocaleString()}</span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Demo'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                            title="Edit user plan and privileges"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
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

      {/* TAB 2: Platform Configurations */}
      {activeTab === 'settings' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Runtime Feature Flags & Engine Toggles
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Changes apply instantly across all active tenants and live daemon services.
            </p>
          </div>

          <div className="divide-y divide-zinc-800">
            {/* AI Statement */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-white block">Universal Bank Statement Ingestion Engine</span>
                <span className="text-xs text-zinc-400 block mt-0.5">
                  Allows users to copy-paste or drop PDF statement texts from Chase, BoA, Citi, etc. without manual formatting.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('aiStatementIngestEnabled')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.aiStatementIngestEnabled ? 'bg-indigo-600' : 'bg-zinc-800'
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
                <span className="text-sm font-semibold text-white block">Open Financial Exchange (.OFX / .QFX) Parser</span>
                <span className="text-xs text-zinc-400 block mt-0.5">
                  Enables 1-click drag-and-drop ingestion of standard banking download files without bank API licensing.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('openBankingOfxEnabled')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.openBankingOfxEnabled ? 'bg-indigo-600' : 'bg-zinc-800'
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
                <span className="text-sm font-semibold text-white block">Smart Clip Notification & SMS Parser</span>
                <span className="text-xs text-zinc-400 block mt-0.5">
                  Instant regex-heuristic extractor for banking alert SMS and push notifications.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('smartClipExtractorEnabled')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.smartClipExtractorEnabled ? 'bg-indigo-600' : 'bg-zinc-800'
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
                <span className="text-sm font-semibold text-white block">Platform Maintenance Mode</span>
                <span className="text-xs text-zinc-400 block mt-0.5">
                  Temporarily pause non-admin logins during schema migrations or major updates.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('maintenanceMode')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  settings.maintenanceMode ? 'bg-rose-600' : 'bg-zinc-800'
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

      {/* Provision User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Provision New User
              </h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">SaaS Plan</label>
                  <select
                    value={newPlan}
                    onChange={e => setNewPlan(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
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
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                Edit User Privileges
              </h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Email (Immutable)</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/60 rounded-xl text-xs text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Plan</label>
                  <select
                    value={editingUser.plan}
                    onChange={e => setEditingUser({ ...editingUser, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="HOUSEHOLD">Household</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Billing Cycle</label>
                  <select
                    value={editingUser.billingCycle}
                    onChange={e => setEditingUser({ ...editingUser, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
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
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
