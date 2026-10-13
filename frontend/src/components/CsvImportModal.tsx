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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Import Transactions CSV</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Compatible with CSV exports from <span className="text-white font-medium">Monarch Money</span>,{' '}
          <span className="text-white font-medium">Mint</span>, <span className="text-white font-medium">Chase</span>, and standard banks.
          Matching automated categorization rules will execute instantly on import.
        </p>

        {/* Upload or Drop */}
        <div className="space-y-3">
          <label className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/60 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-800/40">
            <Upload className="w-8 h-8 text-indigo-400 mb-2" />
            <span className="text-xs font-semibold text-white">
              {fileName ? fileName : 'Choose CSV file from computer'}
            </span>
            <span className="text-[11px] text-zinc-500 mt-1">.csv format supported</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Or paste raw CSV text below:</span>
            <button
              type="button"
              onClick={handlePasteSample}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
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
            className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Results */}
        {result && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium space-y-1 animate-fadeIn ${
              result.importedCount > 0
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
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
              <p className="text-zinc-400 text-[11px]">
                {result.skippedCount} rows skipped due to invalid format or empty amounts.
              </p>
            )}
            {result.errors.length > 0 && (
              <div className="text-[11px] text-rose-400 font-normal">
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
            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isImporting || !csvContent.trim()}
            onClick={handleImport}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isImporting ? 'Importing Ledger...' : 'Import Transactions'}
          </button>
        </div>
      </div>
    </div>
  );
};
