import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  MessageSquare,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Inbox,
  ChevronDown,
  X,
  Smartphone,
  Download,
  Info,
  Layers,
  ArrowRight,
  Sliders,
  Send,
  Clock,
  Building2,
  Wallet,
} from 'lucide-react';
import {
  Account,
  BudgetEnvelope,
  CaptureView as ICaptureView,
  CapturedItem,
  AddCapturedItemPayload,
} from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

const BANK_FILTER =
  'from:(hdfcbank.net OR hdfcbank.bank.in OR icicibank.com OR icici.bank.in OR sbi.co.in OR sbi.bank.in OR axisbank.com OR axis.bank.in OR kotak.com OR kotak.bank.in OR yesbank.in OR idfcfirstbank.com OR indusind.com OR federalbank.co.in OR aubank.in OR americanexpress.com OR sc.com OR chase.com OR bankofamerica.com OR wellsfargo.com OR citi.com)';

interface CaptureViewProps {
  accounts: Account[];
  envelopes: BudgetEnvelope[];
  onNavigateToTransactions?: () => void;
  onRefreshAll?: () => void;
}

export const CaptureView: React.FC<CaptureViewProps> = ({
  accounts,
  envelopes,
  onNavigateToTransactions,
  onRefreshAll,
}) => {
  const { formatAmount } = useCurrency();
  const [data, setData] = useState<ICaptureView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [method, setMethod] = useState<'email' | 'sms' | 'email_paste' | 'share'>('email');
  const [smsText, setSmsText] = useState('');
  const [emailText, setEmailText] = useState('');
  const [isProcessingPaste, setIsProcessingPaste] = useState(false);
  const [pasteFeedback, setPasteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Poll for Gmail confirmation code or new email arrivals
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchView = async (quiet = false) => {
    try {
      if (!quiet) setIsLoading(true);
      const res = await api.getCaptureView();
      setData(res);
    } catch (err) {
      console.error('Failed to load capture view:', err);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchView();

    // Check query params for shared SMS
    const params = new URLSearchParams(window.location.search);
    const sharedText = [params.get('title'), params.get('text')].filter(Boolean).join('\n').trim();
    if (sharedText) {
      handlePasteSubmit(sharedText, 'SHARE');
      // clean URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname + '?tab=capture');
    }

    // PWA install prompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Set up polling while waiting for confirmation or initial email
  useEffect(() => {
    if (data && data.emailReady && !data.lastEmailAt && !data.confirmation) {
      pollIntervalRef.current = setInterval(() => {
        fetchView(true);
      }, 5000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [data?.emailReady, data?.lastEmailAt, data?.confirmation]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleResetAddress = async () => {
    if (!window.confirm('Generate a new personal forwarding address? The old address will cease to accept incoming emails.')) {
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.resetCaptureAddress();
      setData(res);
      setPasteFeedback({ type: 'success', message: 'New private forwarding address generated successfully.' });
    } catch (err: any) {
      setPasteFeedback({ type: 'error', message: err.message || 'Failed to reset address' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install on your mobile device: tap Chrome/Safari menu (⋮ or Share) and select "Add to Home screen" or "Install App".');
    }
  };

  const handlePasteSubmit = async (text: string, source: 'PASTE' | 'SHARE' = 'PASTE') => {
    if (!text.trim()) return;
    setIsProcessingPaste(true);
    setPasteFeedback(null);
    try {
      const res = await api.pasteCapture({ text, source });
      let msg = '';
      if (res.added > 0) {
        msg = `Successfully parsed and queued ${res.added} ${res.added === 1 ? 'alert' : 'alerts'} for review!`;
        if (source === 'PASTE') {
          setSmsText('');
          setEmailText('');
        }
      } else if (res.duplicates > 0) {
        msg = `Alert is already recorded in your ledger (${res.duplicates} duplicate ignored).`;
      } else {
        msg = `No financial transactions detected (security OTPs and marketing promos are automatically skipped).`;
      }
      setPasteFeedback({ type: res.added > 0 ? 'success' : 'error', message: msg });
      await fetchView(true);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      setPasteFeedback({ type: 'error', message: err.message || 'Failed to process pasted text' });
    } finally {
      setIsProcessingPaste(false);
    }
  };

  const handleAddCapturedItem = async (item: CapturedItem, override?: AddCapturedItemPayload) => {
    try {
      await api.addCapturedItem(item.id, override);
      await fetchView(true);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert(`Could not add transaction: ${err.message}`);
    }
  };

  const handleDismissCapturedItem = async (id: string) => {
    try {
      await api.dismissCapturedItem(id);
      await fetchView(true);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert(`Could not dismiss item: ${err.message}`);
    }
  };

  const handleAddAllReady = async () => {
    const ready = (data?.items || []).filter((i) => i.status === 'PENDING' && i.accountId && !i.duplicateOf);
    if (ready.length === 0) return;
    for (const item of ready) {
      try {
        await api.addCapturedItem(item.id);
      } catch (e) {
        console.error('Failed to auto-add item:', item.id, e);
      }
    }
    await fetchView(true);
    if (onRefreshAll) onRefreshAll();
  };

  const handleSimulateWebhook = async (type: 'confirmation' | 'hdfc' | 'chase') => {
    if (!data?.address) return;
    setIsSimulating(true);
    try {
      if (type === 'confirmation') {
        const dummyCode = Math.floor(10000000 + Math.random() * 90000000).toString();
        await api.sendInboundEmailWebhook({
          to: data.address,
          from: 'forwarding-noreply@google.com',
          subject: 'Gmail Forwarding Confirmation - Receive Mail from your account',
          text: `has requested to automatically forward mail to your email address ${data.address}. Confirmation code: ${dummyCode}. Click to confirm: https://mail.google.com/mail/vf-${dummyCode}`,
        });
      } else if (type === 'hdfc') {
        await api.sendInboundEmailWebhook({
          to: data.address,
          from: 'alerts@hdfcbank.net',
          subject: 'Transaction alert on your HDFC Bank Credit Card',
          text: `Alert: Rs 2,450.00 spent on your HDFC Bank Card ending 8812 at Starbucks Coffee on ${new Date().toISOString().slice(0, 10)}. Avl limit: Rs 1,42,000.00.`,
        });
      } else if (type === 'chase') {
        await api.sendInboundEmailWebhook({
          to: data.address,
          from: 'no-reply@alertsp.chase.com',
          subject: 'Your Single Transaction Alert from Chase',
          text: `Chase Bank Alert: You made a $64.50 debit card transaction with Whole Foods Market on ${new Date().toISOString().slice(0, 10)}. Account ending in (...4012).`,
        });
      }
      await fetchView(true);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const pendingItems = (data?.items || []).filter((i) => i.status === 'PENDING');
  const readyToAddCount = pendingItems.filter((i) => i.accountId && !i.duplicateOf).length;
  const recentItems = (data?.items || []).filter((i) => i.status === 'ADDED' || i.status === 'DISMISSED');

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Automated Bank Alert & Ingestion Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Auto-Pull & Smart Capture
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Zero manual typing. Forward transaction emails from Gmail or Outlook, paste SMS alerts,
              or tap <span className="text-indigo-400 font-medium">Share → OmniBudget</span> from your phone's Messages app.
              Every alert is safely parsed and staged in your Review Queue before hitting your ledger.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {pendingItems.length > 0 ? (
              <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold flex items-center justify-center gap-2 shadow-inner">
                <Inbox className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>{pendingItems.length} Waiting for Review</span>
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2 shadow-inner">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All Alerts Reviewed</span>
              </div>
            )}

            <button
              onClick={handleInstallApp}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
              title="Install OmniBudget as a Mobile or Desktop App"
            >
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>{isInstalled ? 'App Installed' : 'Install Mobile App'}</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Global Feedback Banner */}
      {pasteFeedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            pasteFeedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/40 border-rose-800 text-rose-200'
          }`}
        >
          {pasteFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm">{pasteFeedback.message}</div>
          <button
            onClick={() => setPasteFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section 1: "To Review" Queue */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                To Review Queue
                {pendingItems.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-600 text-white">
                    {pendingItems.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Double-check parsed transactions before adding them to your permanent ledger.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {readyToAddCount > 1 && (
              <button
                onClick={handleAddAllReady}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Check className="w-4 h-4" />
                Add all {readyToAddCount} that look right
              </button>
            )}

            <button
              onClick={() => fetchView()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {pendingItems.length > 0 ? (
          <div className="grid gap-4">
            {pendingItems.map((item) => (
              <ReviewItemCard
                key={item.id}
                item={item}
                accounts={accounts}
                envelopes={envelopes}
                onAdd={(override) => handleAddCapturedItem(item, override)}
                onDismiss={() => handleDismissCapturedItem(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-slate-800/80 text-emerald-400 border border-slate-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              Your Review Queue is completely clear!
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Any forwarded bank emails, pasted SMS alerts, or shared mobile messages will appear here
              for one-click confirmation.
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Ingestion Methods */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          Ways to Capture Transactions
        </h2>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            onClick={() => setMethod('email')}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
              method === 'email'
                ? 'border-indigo-500/60 bg-indigo-500/10 shadow-md ring-1 ring-indigo-500/30'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            <div className={`p-2 rounded-lg ${method === 'email' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold ${method === 'email' ? 'text-white' : 'text-slate-200'}`}>
                  Auto Forward
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">Automated via Gmail/Outlook</p>
            </div>
          </button>

          <button
            onClick={() => setMethod('sms')}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
              method === 'sms'
                ? 'border-indigo-500/60 bg-indigo-500/10 shadow-md ring-1 ring-indigo-500/30'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            <div className={`p-2 rounded-lg ${method === 'sms' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className={`text-sm font-semibold block ${method === 'sms' ? 'text-white' : 'text-slate-200'}`}>
                Paste Bank SMS
              </span>
              <p className="text-xs text-slate-400 truncate mt-0.5">Batch paste single or multiple</p>
            </div>
          </button>

          <button
            onClick={() => setMethod('email_paste')}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
              method === 'email_paste'
                ? 'border-indigo-500/60 bg-indigo-500/10 shadow-md ring-1 ring-indigo-500/30'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            <div className={`p-2 rounded-lg ${method === 'email_paste' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Copy className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className={`text-sm font-semibold block ${method === 'email_paste' ? 'text-white' : 'text-slate-200'}`}>
                Paste Raw Email
              </span>
              <p className="text-xs text-slate-400 truncate mt-0.5">Copy full bank statement email</p>
            </div>
          </button>

          <button
            onClick={() => setMethod('share')}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
              method === 'share'
                ? 'border-indigo-500/60 bg-indigo-500/10 shadow-md ring-1 ring-indigo-500/30'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            <div className={`p-2 rounded-lg ${method === 'share' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className={`text-sm font-semibold block ${method === 'share' ? 'text-white' : 'text-slate-200'}`}>
                Share from Phone
              </span>
              <p className="text-xs text-slate-400 truncate mt-0.5">Android Share sheet target</p>
            </div>
          </button>
        </div>

        {/* Tab 1: Email Forwarding Guide */}
        {method === 'email' && data && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6 shadow-lg">
            {/* Visual Process Flow */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">1. Bank Alert</div>
                  <div className="text-slate-400">Card or UPI spend triggered</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">2. Auto-Forward</div>
                  <div className="text-slate-400">Gmail filter sends to your token</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">3. Intelligent Parse</div>
                  <div className="text-slate-400">Regex reads amount, merchant & date</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">4. To Review</div>
                  <div className="text-slate-400">One-click addition to ledger</div>
                </div>
              </div>
            </div>

            {/* Step-by-step instructions */}
            <ol className="space-y-6">
              {/* Step 1 */}
              <li className="flex gap-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
                  1
                </span>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-white">
                    Your Personal OmniBudget Forwarding Address
                  </h3>
                  <p className="text-xs text-slate-400">
                    This email is exclusively linked to your account. Anything forwarded here is parsed and staged for your review.
                  </p>
                  <div className="flex items-center gap-2 max-w-xl">
                    <div className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-indigo-300 font-mono text-xs select-all truncate">
                      {data.address}
                    </div>
                    <button
                      onClick={() => copyToClipboard(data.address, 'address')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      {copiedKey === 'address' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'address' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleResetAddress}
                      className="px-3 py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 text-xs transition-colors"
                      title="Generate new email address if compromised"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </li>

              {/* Step 2 */}
              <li className="flex gap-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
                  2
                </span>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-white">
                    Add Forwarding Address in Gmail or Outlook
                  </h3>
                  <div className="text-xs text-slate-300 space-y-1.5">
                    <p>
                      1. Open{' '}
                      <a
                        href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                      >
                        Gmail's Forwarding & POP/IMAP Settings
                        <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                      </a>
                    </p>
                    <p>2. Click <strong className="text-white">Add a forwarding address</strong> and paste your address from Step 1.</p>
                    <p>3. Click <strong className="text-white">Next → Proceed → OK</strong>. Google sends a verification code to your address.</p>
                  </div>
                </div>
              </li>

              {/* Step 3: Confirmation Code Card */}
              <li className="flex gap-4">
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                    data.confirmation || data.lastEmailAt ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {data.confirmation || data.lastEmailAt ? <Check className="w-4 h-4" /> : '3'}
                </span>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-white">Confirm Forwarding in Gmail</h3>

                  {data.confirmation ? (
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Gmail's Forwarding Confirmation Code Received!
                      </div>
                      <p className="text-xs text-slate-300">
                        Paste this confirmation code into Gmail settings, or tap the direct verification link:
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {data.confirmation.code && (
                          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                            <span className="font-mono text-base font-bold text-emerald-400 tracking-wider">
                              {data.confirmation.code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(data.confirmation?.code || '', 'code')}
                              className="p-1 text-slate-400 hover:text-white"
                              title="Copy Code"
                            >
                              {copiedKey === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}

                        {data.confirmation.link && (
                          <a
                            href={data.confirmation.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Confirm with Gmail Link
                          </a>
                        )}
                      </div>
                    </div>
                  ) : data.lastEmailAt ? (
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Forwarding is active and functioning. Last transaction received{' '}
                      {new Date(data.lastEmailAt).toLocaleDateString()} at{' '}
                      {new Date(data.lastEmailAt).toLocaleTimeString()}.
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        <span>Waiting for Gmail's verification code. This box updates automatically...</span>
                      </div>
                      <button
                        onClick={() => handleSimulateWebhook('confirmation')}
                        disabled={isSimulating}
                        className="text-[11px] text-indigo-400 hover:underline"
                      >
                        Simulate Arrival (Dev Test)
                      </button>
                    </div>
                  )}
                </div>
              </li>

              {/* Step 4: Gmail Bank Filter */}
              <li className="flex gap-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
                  4
                </span>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-white">
                    Forward Only Bank Alerts (Using Gmail Search Filter)
                  </h3>
                  <p className="text-xs text-slate-400">
                    To protect your privacy and ensure personal emails stay strictly in your inbox, set up a filter that only forwards transaction alerts from your financial institutions.
                  </p>

                  <div className="space-y-2 max-w-3xl">
                    <div className="text-xs text-slate-300">
                      In Gmail's search bar, click the <strong className="text-white">Sliders icon</strong>, paste this into <strong className="text-white">From</strong>, then click <strong className="text-white">Create filter → Forward it to your OmniBudget address</strong>:
                    </div>

                    <div className="relative">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed break-all select-all max-h-24 overflow-y-auto">
                        {BANK_FILTER}
                      </div>
                      <button
                        onClick={() => copyToClipboard(BANK_FILTER, 'filter')}
                        className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 transition-colors"
                      >
                        {copiedKey === 'filter' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'filter' ? 'Copied' : 'Copy Filter'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            </ol>

            {/* Quick Test Webhook Triggers */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Want to test email ingestion immediately?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSimulateWebhook('hdfc')}
                  disabled={isSimulating}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  Simulate HDFC Alert (₹2,450)
                </button>
                <button
                  onClick={() => handleSimulateWebhook('chase')}
                  disabled={isSimulating}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  Simulate Chase Alert ($64.50)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Paste Bank SMS */}
        {method === 'sms' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-lg">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Paste Bank SMS Alerts
              </h3>
              <p className="text-xs text-slate-400">
                Copy one or multiple SMS alerts from your messaging app and paste them below. Single or multi-line batch pasting is supported.
              </p>
            </div>

            <textarea
              rows={6}
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="Example SMS:\nRs.450.00 debited from a/c **1234 on 14-10-26 to VPA swiggy@icici - HDFC Bank\n\nINR 1,20,000.00 credited to A/c XX8943 on 01-10-26 by SALARY - ICICI Bank\n\nAlert: Rs 3,299 spent on Axis Bank Credit Card ending 7731 at AMAZON INDIA on 12-Oct-26."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePasteSubmit(smsText, 'PASTE')}
                  disabled={!smsText.trim() || isProcessingPaste}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {isProcessingPaste ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Read and Stage for Review
                </button>
                <button
                  onClick={() =>
                    setSmsText(
                      'Rs 1,840.00 spent on HDFC Bank Card ending 4412 at Swiggy on 14-Oct-26. Avl bal: Rs 45,210.00\n\nINR 7,500.00 debited from SBI a/c **9812 on 13-10-26 for UPI/Netflix. Ref 482910.'
                    )
                  }
                  className="px-3 py-2 rounded-xl text-xs text-indigo-400 hover:bg-indigo-950/30 transition-colors"
                >
                  Load Sample SMS
                </button>
              </div>

              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Security OTPs and promotional spam are filtered automatically.
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Paste Full Email */}
        {method === 'email_paste' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-lg">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-indigo-400" />
                Paste Raw Transaction Email or Statement Body
              </h3>
              <p className="text-xs text-slate-400">
                If you prefer not to set up auto-forwarding, simply copy the text of any bank notification email and paste it here.
              </p>
            </div>

            <textarea
              rows={6}
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste raw email alert body:\nDear Customer, Your account ending in 8912 has been debited for INR 4,890.00 on 14-Oct-2026 at ZOMATO ORDER. The available balance is INR 62,400.00."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handlePasteSubmit(emailText, 'PASTE')}
                disabled={!emailText.trim() || isProcessingPaste}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                {isProcessingPaste ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Parse Bank Email
              </button>

              <button
                onClick={() =>
                  setEmailText(
                    'Subject: Transaction Alert - Your Chase Card ending in 4102\n\nYou made a debit card transaction of $128.40 at Apple Store on October 14, 2026. If this was not you, please contact Chase fraud department.'
                  )
                }
                className="px-3 py-2 rounded-xl text-xs text-indigo-400 hover:bg-indigo-950/30 transition-colors"
              >
                Load Sample Email
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Web Share Target / PWA Guide */}
        {method === 'share' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6 shadow-lg">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                Share Directly from Phone Messages (Android / PWA)
              </h3>
              <p className="text-xs text-slate-400">
                When OmniBudget is installed as a Progressive Web App, it registers as a native Share Target. You can share bank SMS straight from your SMS app into OmniBudget.
              </p>
            </div>

            <ol className="space-y-4 text-xs text-slate-300">
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
                  1
                </span>
                <div className="space-y-1">
                  <div className="font-semibold text-white">Install OmniBudget on your device</div>
                  <p className="text-slate-400">
                    In Chrome or Edge on Android / Desktop, click the install button in the address bar or tap the menu (⋮) → <strong className="text-white">Install App</strong>.
                  </p>
                  <button
                    onClick={handleInstallApp}
                    className="mt-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install OmniBudget App
                  </button>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
                  2
                </span>
                <div className="space-y-1">
                  <div className="font-semibold text-white">Share from your Messages App</div>
                  <p className="text-slate-400">
                    When you receive a bank debit or credit SMS, long-press the message, tap <strong className="text-white">Share</strong>, and select <strong className="text-white">OmniBudget</strong>.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
                  3
                </span>
                <div className="space-y-1">
                  <div className="font-semibold text-white">Review and Add</div>
                  <p className="text-slate-400">
                    OmniBudget opens directly to this review screen with the amount, merchant, and bank account automatically extracted.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Section 3: Recently Decided Transactions */}
      {recentItems.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recently Processed Alerts
          </h2>

          <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            {recentItems.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3.5 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {item.status === 'ADDED' ? (
                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-full bg-slate-800 text-slate-500">
                      <X className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-medium text-slate-200 block truncate">
                      {item.merchant || item.bank || 'Bank Transaction'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {[item.bank, item.accountHint && `••${item.accountHint}`, item.occurredOn, item.source]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.amount && (
                    <span className="font-semibold tabular-nums text-slate-300">
                      {formatAmount(item.amount)}
                    </span>
                  )}
                  {item.status === 'ADDED' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Added
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                      Dismissed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Privacy & Zero Vendor Lock-in Guarantee */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-200">Zero vendor lock-in & privacy guarantee:</strong> We never connect directly to your email provider or read personal messages. Only transaction alerts that match your forward filter or pasted text are evaluated. Raw alert bodies are completely wiped once decided, and your entire database remains exportable to CSV anytime.
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Review Item Card Component
// ---------------------------------------------------------------------------

interface ReviewItemCardProps {
  item: CapturedItem;
  accounts: Account[];
  envelopes: BudgetEnvelope[];
  onAdd: (override: AddCapturedItemPayload) => void;
  onDismiss: () => void;
}

const ReviewItemCard: React.FC<ReviewItemCardProps> = ({
  item,
  accounts,
  envelopes,
  onAdd,
  onDismiss,
}) => {
  const { formatAmount } = useCurrency();
  const [merchant, setMerchant] = useState(item.merchant || item.bank || '');
  const [amount, setAmount] = useState(item.amount?.toString() || '');
  const [date, setDate] = useState(item.occurredOn || new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState(item.accountId || (accounts[0]?.id ?? ''));
  const [category, setCategory] = useState(item.category || 'General');
  const [envelopeId, setEnvelopeId] = useState(item.envelopeId || '');
  const [showOriginal, setShowOriginal] = useState(false);

  const isIncome = item.kind === 'INCOME';

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    onAdd({
      merchant: merchant.trim(),
      amount: isNaN(numAmount) ? item.amount : numAmount,
      occurredOn: date,
      accountId: accountId || undefined,
      category: category.trim(),
      envelopeId: envelopeId || undefined,
    });
  };

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-md hover:border-slate-700/80 transition-all space-y-4">
      {/* Top Bar: Icon, Title, and Amount */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isIncome
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {merchant || 'Bank Transaction'}
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {item.source}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {[
                item.bank,
                item.accountHint && `Account ••${item.accountHint}`,
                item.occurredOn,
                item.balance != null ? `Balance: ${formatAmount(item.balance)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div
            className={`text-xl font-bold tabular-nums ${
              isIncome ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isIncome ? '+' : '−'}
            {item.amount ? formatAmount(item.amount) : '—'}
          </div>
        </div>
      </div>

      {/* Duplicate Warning */}
      {item.duplicateOf && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Potential duplicate detected: a similar transaction on {item.occurredOn} for this amount already exists in your ledger.
          </span>
        </div>
      )}

      {/* Inline Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 font-medium mb-1">Merchant / Title</label>
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1">Category / Envelope</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Dining, Groceries, Utilities"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
        <div>
          {item.body && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOriginal ? 'rotate-180' : ''}`} />
              {showOriginal ? 'Hide original alert' : 'View original alert'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            Add to Ledger
          </button>
        </div>
      </div>

      {/* Collapsible raw alert */}
      {showOriginal && item.body && (
        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 whitespace-pre-wrap max-h-36 overflow-y-auto">
          {item.subject ? `Subject: ${item.subject}\n\n` : ''}
          {item.body}
        </pre>
      )}
    </div>
  );
};
