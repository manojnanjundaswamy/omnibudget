import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Zap,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Download,
  Building2,
  Tag,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Account, ParsedTransaction } from '../types';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

interface SmartIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSuccess: () => void;
}

export const SmartIngestModal: React.FC<SmartIngestModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSuccess,
}) => {
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<'statement' | 'ofx' | 'clip' | 'csv'>('statement');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');

  // Input states
  const [statementText, setStatementText] = useState('');
  const [ofxContent, setOfxContent] = useState('');
  const [clipText, setClipText] = useState('');
  const [csvText, setCsvText] = useState('');

  // Processing state
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedTransaction[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Samples
  const handleLoadSampleStatement = () => {
    setStatementText(`10/12/2026 Whole Foods Market $64.20
10/11/2026 Uber Technologies Inc $22.50
10/10/2026 Netflix Subscription $19.99
10/09/2026 Trader Joe's Supermarket $48.70
10/08/2026 Equinox Fitness Club $180.00
10/05/2026 Stripe Inc Direct Deposit +$4,500.00`);
  };

  const handleLoadSampleOfx = () => {
    setOfxContent(`<OFX>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20261012120000</DTPOSTED>
<TRNAMT>-64.20</TRNAMT>
<NAME>Whole Foods Market</NAME>
<MEMO>GROCERY STORE #412</MEMO>
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20261011120000</DTPOSTED>
<TRNAMT>-22.50</TRNAMT>
<NAME>Uber Technologies</NAME>
<MEMO>RIDESHARE SAN FRANCISCO</MEMO>
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT</TRNTYPE>
<DTPOSTED>20261005120000</DTPOSTED>
<TRNAMT>4500.00</TRNAMT>
<NAME>Stripe Inc</NAME>
<MEMO>PAYROLL DIRECT DEPOSIT</MEMO>
</STMTTRN>
</BANKTRANLIST>
</OFX>`);
  };

  const handleLoadSampleClip = () => {
    setClipText('Charged $15.50 at Blue Bottle Coffee on card ending 4242');
  };

  // Preview Parsers
  const handlePreviewStatement = async () => {
    if (!statementText.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const items = await api.previewStatementText(statementText);
      if (items.length === 0) {
        setErrorMessage('No valid transactions detected. Please verify date and amount columns.');
      } else {
        setParsedItems(items);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse statement');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewOfx = async () => {
    if (!ofxContent.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const items = await api.previewOfxContent(ofxContent);
      if (items.length === 0) {
        setErrorMessage('No transactions found in OFX/QFX data block.');
      } else {
        setParsedItems(items);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse OFX/QFX');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitParsed = async () => {
    if (parsedItems.length === 0 || !selectedAccountId) return;
    setIsCommitting(true);
    setErrorMessage(null);
    try {
      const res = await api.commitIngest({
        accountId: selectedAccountId,
        transactions: parsedItems,
      });
      setSuccessMessage(`Successfully ingested ${res.importedCount} transactions into ${res.accountName}!`);
      setParsedItems([]);
      onSuccess();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to commit transactions');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleSmartClipIngest = async () => {
    if (!clipText.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const tx = await api.ingestSmartClip({
        text: clipText.trim(),
        accountId: selectedAccountId || undefined,
      });
      setSuccessMessage(`Instant capture: ${tx.merchant} ($${Math.abs(tx.amount).toFixed(2)}) recorded into ledger!`);
      setClipText('');
      onSuccess();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to extract transaction from alert text');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvText.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.importTransactionsCsv(csvText);
      if (res.importedCount > 0) {
        setSuccessMessage(`Successfully imported ${res.importedCount} transactions via CSV!`);
        onSuccess();
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 2000);
      } else {
        setErrorMessage('Could not import any rows from CSV data.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'CSV import error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Smart Financial Ingestion Hub</h2>
              <p className="text-xs text-zinc-400">
                Zero-friction data onboarding • 100% license-free & open banking standards
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('statement'); setParsedItems([]); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'statement' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bank Statement Drop</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('ofx'); setParsedItems([]); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'ofx' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Banking (.OFX)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('clip'); setParsedItems([]); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'clip' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart Clip (SMS / Alerts)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('csv'); setParsedItems([]); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'csv' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
            <span>Standard CSV</span>
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Target Account Picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Destination Financial Account</label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type}) — Balance: {formatAmount(acc.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* TAB 1: Bank Statement Drop */}
          {activeTab === 'statement' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Paste rows directly from your PDF statement or online banking portal (Chase, BoA, Citi, etc.):
                </span>
                <button
                  type="button"
                  onClick={handleLoadSampleStatement}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Load Sample Statement
                </button>
              </div>

              <textarea
                rows={6}
                value={statementText}
                onChange={e => setStatementText(e.target.value)}
                placeholder={`10/12/2026 Whole Foods Market $64.20\n10/11/2026 Uber Technologies $22.50\n10/10/2026 Netflix Subscription $19.99...`}
                className="w-full p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                disabled={isLoading || !statementText.trim()}
                onClick={handlePreviewStatement}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {isLoading ? 'Scanning & Auto-Categorizing...' : 'Analyze & Preview Statement'}
              </button>
            </div>
          )}

          {/* TAB 2: OFX / QFX */}
          {activeTab === 'ofx' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Paste or drop standard banking .OFX or .QFX export:
                </span>
                <button
                  type="button"
                  onClick={handleLoadSampleOfx}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Load Sample OFX
                </button>
              </div>

              <textarea
                rows={6}
                value={ofxContent}
                onChange={e => setOfxContent(e.target.value)}
                placeholder="<OFX><BANKTRANLIST><STMTTRN>...</STMTTRN></BANKTRANLIST></OFX>"
                className="w-full p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                disabled={isLoading || !ofxContent.trim()}
                onClick={handlePreviewOfx}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {isLoading ? 'Parsing Open Banking Data...' : 'Preview OFX Transactions'}
              </button>
            </div>
          )}

          {/* TAB 3: Smart Clip */}
          {activeTab === 'clip' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Paste transaction push alert or SMS notification:
                </span>
                <button
                  type="button"
                  onClick={handleLoadSampleClip}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Load Sample SMS
                </button>
              </div>

              <textarea
                rows={4}
                value={clipText}
                onChange={e => setClipText(e.target.value)}
                placeholder="e.g. Charged $15.50 at Blue Bottle Coffee on card ending 4242 or Sent $35.00 to Alex via Venmo"
                className="w-full p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                disabled={isLoading || !clipText.trim()}
                onClick={handleSmartClipIngest}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                {isLoading ? 'Capturing Transaction...' : 'Instant Capture to Ledger'}
              </button>
            </div>
          )}

          {/* TAB 4: Standard CSV */}
          {activeTab === 'csv' && (
            <div className="space-y-3">
              <textarea
                rows={6}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={`Date,Description,Merchant,Category,Amount\n2026-10-10,Whole Foods,Whole Foods,Groceries,-54.20...`}
                className="w-full p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                disabled={isLoading || !csvText.trim()}
                onClick={handleCsvImport}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                {isLoading ? 'Importing CSV...' : 'Import CSV directly'}
              </button>
            </div>
          )}

          {/* Interactive Parsed Items Preview Table */}
          {parsedItems.length > 0 && (
            <div className="pt-3 space-y-3 border-t border-zinc-800 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Detected {parsedItems.length} Transactions Ready for Ingestion
                </h4>
                <button
                  type="button"
                  disabled={isCommitting}
                  onClick={handleCommitParsed}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {isCommitting ? 'Writing to Ledger...' : `Commit All to Ledger`}
                </button>
              </div>

              <div className="bg-zinc-950 rounded-xl border border-zinc-800 max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px] text-zinc-300">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Merchant / Payee</th>
                      <th className="py-2 px-3">Auto-Category</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-2 px-3 text-zinc-400">{item.date}</td>
                        <td className="py-2 px-3 text-white font-semibold">{item.merchant}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
                            {item.suggestedCategory}
                          </span>
                          {item.ruleMatched && (
                            <span className="ml-1 text-[9px] text-emerald-400 font-mono">⚡Rule</span>
                          )}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${
                          item.type === 'INCOME' ? 'text-emerald-400' : 'text-zinc-200'
                        }`}>
                          {item.type === 'INCOME' ? '+' : '-'}${item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
