import React, { useState } from 'react';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { api } from '../services/api';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ importedCount: number; skippedCount: number; errors: string[] } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Keyboard shortcut listener (Escape to close)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      setCsvContent(content || '');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) return;
    setIsImporting(true);
    setResult(null);
    try {
      const res = await api.importTransactionsCsv(csvContent);
      setResult(res);
      if (res.importedCount > 0) {
        onImportSuccess();
      }
    } catch (err: any) {
      setResult({ importedCount: 0, skippedCount: 0, errors: [err.message || 'Import failed'] });
    } finally {
      setIsImporting(false);
    }
  };

  const sampleCsv = `Date,Description,Merchant,Category,Amount
2026-10-10,Grocery run,Trader Joe's,Groceries,-68.40
2026-10-11,Monthly Netflix,Netflix,Entertainment,-19.99
2026-10-12,Direct Deposit,Tech Corp,Salary,4500.00`;

  const handlePasteSample = () => {
    setFileName('sample_ledger.csv');
    setCsvContent(sampleCsv);
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-luxury overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-card-luxury w-full max-w-xl p-6 space-y-5 shadow-2xl ambient-accent my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--fg)] tracking-tight">Import Transactions CSV</h3>
              <p className="text-[11px] text-[var(--fg-muted)]">Upload bank ledger files or exports from Monarch / Mint</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-transparent hover:border-[var(--border)]"
            title="Press Esc to close"
          >
            <span className="text-[10px] uppercase font-mono opacity-60 tracking-wider">esc</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[var(--fg-muted)]">
          Upload any CSV from your bank or export from Monarch, Mint, etc. Matching rules will apply automatically.
        </p>

        {/* Upload or Drop */}
        <div className="space-y-3">
          <label className="border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[var(--surface-2)]">
            <Upload className="w-8 h-8 text-[var(--accent)] mb-2" />
            <span className="text-xs font-semibold text-[var(--fg)]">
              {fileName ? fileName : 'Choose CSV file from computer'}
            </span>
            <span className="text-[11px] text-[var(--fg-muted)] mt-1">.csv format supported</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--fg-muted)]">Or paste CSV text below:</span>
            <button
              type="button"
              onClick={handlePasteSample}
              className="text-xs text-[var(--fg)] hover:opacity-80 font-medium flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Load Sample Template
            </button>
          </div>

          <textarea
            rows={5}
            value={csvContent}
            onChange={e => setCsvContent(e.target.value)}
            placeholder={`Date,Description,Merchant,Category,Amount\n2026-10-10,Whole Foods,Whole Foods,Groceries,-54.20...`}
            className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--fg)] placeholder:[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Results */}
        {result && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium space-y-1 animate-fadeIn ${
              result.importedCount > 0
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {result.importedCount > 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>
                {result.importedCount > 0
                  ? `Successfully imported ${result.importedCount} transactions!`
                  : 'Import could not complete'}
              </span>
            </div>
            {result.skippedCount > 0 && (
              <p className="text-[var(--fg-muted)] text-[11px]">
                {result.skippedCount} rows skipped due to invalid format or empty amounts.
              </p>
            )}
            {result.errors.length > 0 && (
              <div className="text-[11px] text-rose-500 font-normal">
                {result.errors.slice(0, 3).map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)] text-xs font-medium"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isImporting || !csvContent.trim()}
            onClick={handleImport}
            className="px-5 py-2 rounded-xl bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-bold transition-all disabled:opacity-50"
          >
            {isImporting ? 'Importing...' : 'Import Transactions'}
          </button>
        </div>
      </div>
    </div>
  );
};
