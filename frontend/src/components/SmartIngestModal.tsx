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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-backdrop">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col modal-content">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)]">
              <Sparkles className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--fg)]">Import Transactions</h2>
              <p className="text-xs text-[var(--fg-muted)]">
                Bring in transactions from your statements, bank files, alerts, or CSV.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('statement'); setParsedItems([]); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'statement' ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>Statement Text</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('ofx'); setParsedItems([]); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'ofx' ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bank File (.OFX)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('clip'); setParsedItems([]); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'clip' ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Text / SMS Alert</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('csv'); setParsedItems([]); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'csv' ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500" />
            <span>CSV</span>
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-semibold flex items-center gap-2 animate-fadeIn shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Target Account Picker */}
          <div>
            <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Destination Account</label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
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
                <span className="text-xs text-[var(--fg-muted)]">
                  Paste rows directly from your PDF statement or online banking portal:
                </span>
                <button
                  type="button"
                  onClick={handleLoadSampleStatement}
                  className="text-xs text-[var(--fg)] hover:opacity-80 font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Load Sample
                </button>
              </div>

              <textarea
                rows={6}
                value={statementText}
                onChange={e => setStatementText(e.target.value)}
                placeholder={`10/12/2026 Whole Foods Market $64.20\n10/11/2026 Uber Technologies $22.50\n10/10/2026 Netflix Subscription $19.99...`}
                className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--fg)] placeholder:[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
              />

              <button
                type="button"
                disabled={isLoading || !statementText.trim()}
                onClick={handlePreviewStatement}
                className="w-full py-2.5 rounded-xl bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-bold transition disabled:opacity-50"
              >
                {isLoading ? 'Scanning transactions...' : 'Preview Transactions'}
              </button>
            </div>
          )}

          {/* TAB 2: OFX / QFX */}
          {activeTab === 'ofx' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--fg-muted)]">
                  Paste standard banking .OFX or .QFX file text:
                </span>
                <button
                  type="button"
                  onClick={handleLoadSampleOfx}
                  className="text-xs text-[var(--fg)] hover:opacity-80 font-semibold flex items-center gap-1"
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
                className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--fg)] placeholder:[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
              />

              <button
                type="button"
                disabled={isLoading || !ofxContent.trim()}
                onClick={handlePreviewOfx}
                className="w-full py-2.5 rounded-xl bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-bold transition disabled:opacity-50"
              >
                {isLoading ? 'Parsing file...' : 'Preview OFX Transactions'}
              </button>
            </div>
          )}

          {/* TAB 3: Smart Clip */}
          {activeTab === 'clip' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--fg-muted)]">
                  Paste transaction push alert or SMS notification:
                </span>
                <button
                  type="button"
                  onClick={handleLoadSampleClip}
                  className="text-xs text-[var(--fg)] hover:opacity-80 font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Load Sample Alert
                </button>
              </div>

              <textarea
                rows={4}
                value={clipText}
                onChange={e => setClipText(e.target.value)}
                placeholder="e.g. Charged $15.50 at Blue Bottle Coffee on card ending 4242 or Sent $35.00 to Alex via Venmo"
                className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--fg)] placeholder:[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
              />

              <button
                type="button"
                disabled={isLoading || !clipText.trim()}
                onClick={handleSmartClipIngest}
                className="w-full py-2.5 rounded-xl bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-bold transition disabled:opacity-50"
              >
                {isLoading ? 'Capturing...' : 'Capture to Transactions'}
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
                className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--fg)] placeholder:[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
              />

              <button
                type="button"
                disabled={isLoading || !csvText.trim()}
                onClick={handleCsvImport}
                className="w-full py-2.5 rounded-xl bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-bold transition disabled:opacity-50"
              >
                {isLoading ? 'Importing CSV...' : 'Import CSV directly'}
              </button>
            </div>
          )}

          {/* Interactive Parsed Items Preview Table */}
          {parsedItems.length > 0 && (
            <div className="pt-3 space-y-3 border-t border-[var(--border)] animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--fg)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Found {parsedItems.length} transactions ready to save
                </h4>
                <button
                  type="button"
                  disabled={isCommitting}
                  onClick={handleCommitParsed}
                  className="px-4 py-1.5 rounded-xl bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-bold transition disabled:opacity-50"
                >
                  {isCommitting ? 'Saving...' : `Save All Transactions`}
                </button>
              </div>

              <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px] text-[var(--fg)]">
                  <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--fg-muted)] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Merchant</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-medium">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[var(--surface)] transition-colors">
                        <td className="py-2 px-3 text-[var(--fg-muted)]">{item.date}</td>
                        <td className="py-2 px-3 font-semibold">{item.merchant}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-semibold">
                            {item.suggestedCategory}
                          </span>
                          {item.ruleMatched && (
                            <span className="ml-1 text-[9px] text-emerald-500 font-mono">⚡Rule</span>
                          )}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${
                          item.type === 'INCOME' ? 'text-emerald-500' : 'text-[var(--fg)]'
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
