import React, { useState, useEffect, useRef } from 'react';
import {
  Calculator as CalcIcon,
  Percent,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowRightLeft,
  X,
  Minus,
  Maximize2,
  Minimize2,
  ChevronRight,
  GripVertical,
  History,
  RotateCcw,
  Sparkles,
  Building2,
  FileText,
  BadgePercent,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';

export type UtilityTab = 'calculator' | 'loan' | 'tax' | 'sip' | 'currency' | 'inflation';

export interface FinanceUtilitiesSystemProps {
  isOpen?: boolean;
  onOpen?: (tab?: UtilityTab) => void;
  onClose?: () => void;
  defaultTab?: UtilityTab;
}

export const FinanceUtilitiesSystem: React.FC<FinanceUtilitiesSystemProps> = ({
  isOpen: controlledIsOpen,
  onOpen: controlledOnOpen,
  onClose: controlledOnClose,
  defaultTab = 'calculator',
}) => {
  const { currentCurrency, formatAmount } = useCurrency();

  // Window State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<UtilityTab>(defaultTab);

  // Edge Panel Handle State
  const [isEdgeShelfOpen, setIsEdgeShelfOpen] = useState(false);
  const [handleY, setHandleY] = useState<number>(() => {
    const saved = localStorage.getItem('omnibudget_edge_handle_y');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);

  // Floating Window Position
  const [windowPos, setWindowPos] = useState<{ x: number; y: number }>(() => {
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 530) : 100;
    return { x: defaultX, y: 75 };
  });
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; winX: number; winY: number }>({
    mouseX: 0,
    mouseY: 0,
    winX: 0,
    winY: 0,
  });

  // Sync controlled state if provided
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
      if (controlledIsOpen) setIsMinimized(false);
    }
  }, [controlledIsOpen]);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Handle Edge Handle Dragging
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDraggingHandle) {
        const clampedY = Math.max(70, Math.min(window.innerHeight - 80, e.clientY));
        setHandleY(clampedY);
        localStorage.setItem('omnibudget_edge_handle_y', clampedY.toString());
      }
    };
    const handlePointerUp = () => {
      setIsDraggingHandle(false);
    };
    if (isDraggingHandle) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingHandle]);

  // Handle Window Dragging
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDraggingWindow && !isMaximized) {
        const dx = e.clientX - dragStartRef.current.mouseX;
        const dy = e.clientY - dragStartRef.current.mouseY;
        const newX = Math.max(10, Math.min(window.innerWidth - 320, dragStartRef.current.winX + dx));
        const newY = Math.max(10, Math.min(window.innerHeight - 150, dragStartRef.current.winY + dy));
        setWindowPos({ x: newX, y: newY });
      }
    };
    const handlePointerUp = () => {
      setIsDraggingWindow(false);
    };
    if (isDraggingWindow) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingWindow, isMaximized]);

  const handleStartWindowDrag = (e: React.PointerEvent) => {
    if (isMaximized) return;
    setIsDraggingWindow(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: windowPos.x,
      winY: windowPos.y,
    };
  };

  const handleOpenUtility = (tab: UtilityTab) => {
    setActiveTab(tab);
    setIsOpen(true);
    setIsMinimized(false);
    setIsEdgeShelfOpen(false);
    controlledOnOpen?.(tab);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    controlledOnClose?.();
  };

  const UTILITIES: { id: UtilityTab; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    { id: 'calculator', label: 'Calculator', icon: CalcIcon, desc: 'Financial & Scientific' },
    { id: 'loan', label: 'Loan & EMI', icon: Building2, desc: 'Mortgages & Amortization' },
    { id: 'tax', label: 'Income Tax', icon: FileText, desc: 'Federal Brackets & Net Pay' },
    { id: 'sip', label: 'SIP & Wealth', icon: TrendingUp, desc: 'Compound Interest Forecaster' },
    { id: 'currency', label: 'Currency FX', icon: ArrowRightLeft, desc: 'Cross-Rate Currency Converter' },
    { id: 'inflation', label: 'Inflation', icon: Clock, desc: 'Purchasing Power Over Time' },
  ];

  const currentDef = UTILITIES.find((u) => u.id === activeTab) || UTILITIES[0];
  const CurrentIcon = currentDef.icon;

  return (
    <>
      {/* 1. SAMSUNG-STYLE EDGE HANDLE (Right edge of screen) */}
      {!isOpen && !isMinimized && (
        <div
          style={{ top: `${handleY}px` }}
          className="fixed right-0 z-40 select-none group"
        >
          {/* Edge Handle Grip Tab */}
          <div className="relative flex items-center">
            {/* Slide-out Shelf Container */}
            {isEdgeShelfOpen && (
              <div className="absolute right-9 top-1/2 -translate-y-1/2 bg-[var(--surface)] border border-[var(--border)] shadow-2xl rounded-2xl p-2.5 flex flex-col gap-1.5 w-48 modal-content backdrop-blur-md">
                <div className="px-2 py-1 flex items-center justify-between border-b border-[var(--border)] text-[10px] font-bold text-[var(--fg-muted)] uppercase tracking-wider">
                  <span>Finance Utilities</span>
                  <button
                    type="button"
                    onClick={() => setIsEdgeShelfOpen(false)}
                    className="hover:text-[var(--fg)] p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {UTILITIES.map((u) => {
                  const Icon = u.icon;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleOpenUtility(u.id)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs hover:bg-[var(--surface-2)] text-[var(--fg)] transition interactive-row group/btn text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--fg)] shrink-0 group-hover/btn:border-emerald-500/40">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="font-semibold block truncate leading-tight">{u.label}</span>
                        <span className="text-[10px] text-[var(--fg-muted)] block truncate">{u.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Draggable Tab Button */}
            <div
              onClick={() => setIsEdgeShelfOpen((prev) => !prev)}
              onPointerDown={(e) => {
                if (e.button === 0) setIsDraggingHandle(true);
              }}
              title="Drag up/down, click to open Financial Utilities"
              className="flex items-center justify-center w-7 h-16 rounded-l-xl bg-[var(--fg)] text-[var(--bg)] cursor-pointer shadow-xl hover:w-8 transition-all duration-150 active:scale-95"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <GripVertical className="w-3.5 h-3.5 opacity-60" />
                <CalcIcon className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MINIMIZED FLOATING DOCK PILL (Bottom right) */}
      {isOpen && isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-2xl cursor-pointer hover:border-emerald-500/50 transition-all active:scale-95 interactive-card group"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CurrentIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-[var(--fg)]">{currentDef.label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--fg-muted)] font-mono">
            Click to Restore
          </span>
        </div>
      )}

      {/* 3. MULTI-WINDOW FLOATING UTILITY DIALOG (Samsung Dex / Tablet style) */}
      {isOpen && !isMinimized && (
        <div
          style={
            isMaximized
              ? { inset: '16px' }
              : {
                  left: `${windowPos.x}px`,
                  top: `${windowPos.y}px`,
                  width: 'min(510px, calc(100vw - 24px))',
                  height: 'min(640px, calc(100vh - 40px))',
                }
          }
          className={`fixed z-50 flex flex-col bg-[var(--surface)] border border-[var(--border)] shadow-2xl rounded-2xl overflow-hidden modal-content backdrop-blur-md ${
            isMaximized ? 'w-auto h-auto' : ''
          }`}
        >
          {/* WINDOW TITLE BAR (Draggable) */}
          <div
            onPointerDown={handleStartWindowDrag}
            className="flex items-center justify-between px-4 h-12 bg-[var(--surface-2)] border-b border-[var(--border)] shrink-0 cursor-move select-none"
          >
            {/* Title & Icon */}
            <div className="flex items-center gap-2">
              <CurrentIcon className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-[var(--fg)] tracking-tight">
                Finance Utility: {currentDef.label}
              </span>
            </div>

            {/* Window Action Controls (Minimize, Maximize, Close) */}
            <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="Minimize Window"
                className="p-1 rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-3)] transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMaximized((prev) => !prev)}
                title={isMaximized ? 'Restore Size' : 'Maximize Window'}
                className="p-1 rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-3)] transition"
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleClose}
                title="Close Utility"
                className="p-1 rounded-md text-[var(--fg-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* UTILITIES SUB-TAB SELECTOR */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] border-b border-[var(--border)] overflow-x-auto no-scrollbar shrink-0">
            {UTILITIES.map((u) => {
              const Icon = u.icon;
              const isActive = activeTab === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setActiveTab(u.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${
                    isActive
                      ? 'bg-[var(--fg)] text-[var(--bg)] font-semibold shadow-xs'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{u.label}</span>
                </button>
              );
            })}
          </div>

          {/* UTILITY CONTENT VIEWPORT */}
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            {activeTab === 'calculator' && <ScientificCalculator />}
            {activeTab === 'loan' && <LoanEmiCalculator formatAmount={formatAmount} />}
            {activeTab === 'tax' && <IncomeTaxCalculator formatAmount={formatAmount} />}
            {activeTab === 'sip' && <SipWealthCalculator formatAmount={formatAmount} />}
            {activeTab === 'currency' && <CurrencyFxCalculator />}
            {activeTab === 'inflation' && <InflationCalculator formatAmount={formatAmount} />}
          </div>
        </div>
      )}
    </>
  );
};

// =========================================================================
// SUB-UTILITY 1: FINANCIAL & SCIENTIFIC CALCULATOR
// =========================================================================
const ScientificCalculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleDigit = (d: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? d : prev + d));
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay((prev) => prev + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    setDisplay((prev) => {
      if (prev.length <= 1 || prev === 'Error') return '0';
      return prev.slice(0, -1);
    });
  };

  const handleToggleSign = () => {
    setDisplay((prev) => {
      const num = parseFloat(prev);
      if (isNaN(num)) return '0';
      return (-num).toString();
    });
  };

  const handleOperator = (op: string) => {
    setExpression((prev) => `${prev} ${display} ${op}`);
    setDisplay('0');
  };

  const handleEvaluate = () => {
    try {
      const fullExpr = `${expression} ${display}`
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .trim();
      // Safe sanitized arithmetic evaluation
      if (!/^[\d\s+\-*/.()]+$/.test(fullExpr)) {
        setDisplay('Error');
        return;
      }
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${fullExpr})`)();
      const formatted = Number.isFinite(result) ? parseFloat(result.toFixed(8)).toString() : 'Error';
      const record = `${fullExpr} = ${formatted}`;
      setHistory((prev) => [record, ...prev.slice(0, 9)]);
      setDisplay(formatted);
      setExpression('');
    } catch {
      setDisplay('Error');
    }
  };

  // Scientific functions
  const handleFunction = (fn: 'square' | 'sqrt' | 'reciprocal' | 'percent') => {
    const num = parseFloat(display);
    if (isNaN(num)) return;
    let res = 0;
    if (fn === 'square') res = num * num;
    if (fn === 'sqrt') res = Math.sqrt(num);
    if (fn === 'reciprocal') res = num !== 0 ? 1 / num : 0;
    if (fn === 'percent') res = num / 100;
    setDisplay(parseFloat(res.toFixed(8)).toString());
  };

  // Memory functions
  const memClear = () => setMemory(0);
  const memRecall = () => setDisplay(memory.toString());
  const memAdd = () => setMemory((prev) => prev + (parseFloat(display) || 0));
  const memSub = () => setMemory((prev) => prev - (parseFloat(display) || 0));

  return (
    <div className="space-y-3">
      {/* Tape / History Toggle */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] text-[var(--fg-muted)]">
          {memory !== 0 ? `Memory: ${memory}` : 'Financial Tape Ready'}
        </span>
        <button
          type="button"
          onClick={() => setShowHistory((prev) => !prev)}
          className="flex items-center gap-1 text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition"
        >
          <History className="w-3.5 h-3.5" />
          <span>{showHistory ? 'Hide Tape' : 'Tape History'}</span>
        </button>
      </div>

      {showHistory && history.length > 0 && (
        <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] max-h-28 overflow-y-auto no-scrollbar space-y-1 text-[11px] font-mono">
          {history.map((h, i) => (
            <div
              key={i}
              onClick={() => {
                const parts = h.split('=');
                if (parts[1]) setDisplay(parts[1].trim());
              }}
              className="cursor-pointer hover:text-emerald-400 transition truncate"
            >
              {h}
            </div>
          ))}
        </div>
      )}

      {/* Screen Display */}
      <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-right space-y-1">
        <div className="text-[11px] text-[var(--fg-muted)] font-mono min-h-[16px] truncate">
          {expression}
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight text-[var(--fg)] tabular-nums truncate">
          {display}
        </div>
      </div>

      {/* Memory Bar */}
      <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
        <button type="button" onClick={memClear} className="py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg-muted)] transition">MC</button>
        <button type="button" onClick={memRecall} className="py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg-muted)] transition">MR</button>
        <button type="button" onClick={memAdd} className="py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg-muted)] transition">M+</button>
        <button type="button" onClick={memSub} className="py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg-muted)] transition">M-</button>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-5 gap-1.5 text-xs font-medium">
        {/* Row 1 */}
        <button type="button" onClick={() => handleFunction('square')} className="py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg)]">x²</button>
        <button type="button" onClick={() => handleFunction('sqrt')} className="py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg)]">√x</button>
        <button type="button" onClick={() => handleFunction('reciprocal')} className="py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg)]">1/x</button>
        <button type="button" onClick={() => handleFunction('percent')} className="py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg)]">%</button>
        <button type="button" onClick={handleClear} className="py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold">AC</button>

        {/* Row 2 */}
        <button type="button" onClick={() => handleDigit('7')} className="py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold text-sm">7</button>
        <button type="button" onClick={() => handleDigit('8')} className="py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold text-sm">8</button>
        <button type="button" onClick={() => handleDigit('9')} className="py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold text-sm">9</button>
        <button type="button" onClick={() => handleOperator('÷')} className="py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] font-bold text-sm">÷</button>
        <button type="button" onClick={handleBackspace} className="py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg-muted)]">⌫</button>

        {/* Row 3 */}
        <button type="button" onClick={() => handleDigit('4')} className="py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold text-sm">4</button>
        <button type="button" onClick={() => handleDigit('5')} className="py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold text-sm">5</button>
        <button type="button" onClick={() => handleDigit('6')} className="py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold text-sm">6</button>
        <button type="button" onClick={() => handleOperator('×')} className="py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] font-bold text-sm">×</button>
        <button type="button" onClick={handleToggleSign} className="py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg-muted)]">±</button>

        {/* Row 4 */}
        <button type="button" onClick={() => handleDigit('1')} className="py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold text-sm">1</button>
        <button type="button" onClick={() => handleDigit('2')} className="py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold text-sm">2</button>
        <button type="button" onClick={() => handleDigit('3')} className="py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold text-sm">3</button>
        <button type="button" onClick={() => handleOperator('-')} className="py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] font-bold text-sm">−</button>
        <button type="button" onClick={() => handleOperator('+')} className="py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] font-bold text-sm">+</button>

        {/* Row 5 */}
        <button type="button" onClick={() => handleDigit('0')} className="col-span-2 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-semibold text-sm">0</button>
        <button type="button" onClick={handleDecimal} className="py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] font-bold text-sm">.</button>
        <button type="button" onClick={handleEvaluate} className="col-span-2 py-2.5 rounded-xl bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 font-bold text-sm shadow-sm">=</button>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-UTILITY 2: LOAN, MORTGAGE & EMI CALCULATOR
// =========================================================================
const LoanEmiCalculator: React.FC<{ formatAmount: (val: number) => string }> = ({ formatAmount }) => {
  const [principal, setPrincipal] = useState(250000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [years, setYears] = useState(30);
  const [prepayment, setPrepayment] = useState(100);

  // EMI formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = years * 12;

  const baseEmi = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : principal / numPayments;

  const totalMonthlyPayment = baseEmi + prepayment;
  const totalPaid = baseEmi * numPayments;
  const totalInterest = Math.max(0, totalPaid - principal);

  return (
    <div className="space-y-4 text-xs">
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Loan Principal</label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Math.max(1000, parseFloat(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Interest Rate (% APR)</label>
          <input
            type="number"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Math.max(0.1, parseFloat(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Term (Years)</label>
          <select
            value={years}
            onChange={(e) => setYears(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold cursor-pointer"
          >
            <option value={5}>5 Years (60 mo)</option>
            <option value={10}>10 Years (120 mo)</option>
            <option value={15}>15 Years (180 mo)</option>
            <option value={20}>20 Years (240 mo)</option>
            <option value={30}>30 Years (360 mo)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Extra Prepay / mo</label>
          <input
            type="number"
            value={prepayment}
            onChange={(e) => setPrepayment(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--fg-muted)]">Monthly Payment (EMI):</span>
          <span className="text-xl font-bold text-emerald-400 tabular">
            {formatAmount(totalMonthlyPayment)}/mo
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-[11px]">
          <div>
            <span className="text-[var(--fg-muted)] block">Total Interest:</span>
            <span className="font-bold text-rose-400 tabular">{formatAmount(totalInterest)}</span>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] block">Total Repayment:</span>
            <span className="font-bold text-[var(--fg)] tabular">{formatAmount(totalPaid)}</span>
          </div>
        </div>
      </div>

      {/* Visual Principal vs Interest Split Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-[var(--fg-muted)]">
          <span>Principal: {Math.round((principal / totalPaid) * 100)}%</span>
          <span>Interest: {Math.round((totalInterest / totalPaid) * 100)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden flex">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${(principal / totalPaid) * 100}%` }}
          />
          <div
            className="h-full bg-rose-400"
            style={{ width: `${(totalInterest / totalPaid) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-UTILITY 3: INCOME TAX & TAKE-HOME ESTIMATOR
// =========================================================================
const IncomeTaxCalculator: React.FC<{ formatAmount: (val: number) => string }> = ({ formatAmount }) => {
  const [grossIncome, setGrossIncome] = useState(110000);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('single');
  const [preTaxDeduction, setPreTaxDeduction] = useState(12000);

  const standardDeduction = filingStatus === 'single' ? 14600 : 29200;
  const taxableIncome = Math.max(0, grossIncome - standardDeduction - preTaxDeduction);

  // Progressive 2026 Federal Brackets (Single)
  let federalTax = 0;
  if (taxableIncome > 0) {
    const b1 = Math.min(taxableIncome, 11600);
    federalTax += b1 * 0.10;
    if (taxableIncome > 11600) {
      const b2 = Math.min(taxableIncome, 47150) - 11600;
      federalTax += b2 * 0.12;
    }
    if (taxableIncome > 47150) {
      const b3 = Math.min(taxableIncome, 100525) - 47150;
      federalTax += b3 * 0.22;
    }
    if (taxableIncome > 100525) {
      const b4 = taxableIncome - 100525;
      federalTax += b4 * 0.24;
    }
  }

  // FICA: 6.2% Social Security + 1.45% Medicare
  const ficaTax = grossIncome * 0.0765;
  const totalTax = federalTax + ficaTax;
  const netTakeHome = Math.max(0, grossIncome - totalTax - preTaxDeduction);
  const monthlyTakeHome = netTakeHome / 12;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Annual Gross Salary</label>
          <input
            type="number"
            value={grossIncome}
            onChange={(e) => setGrossIncome(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Filing Status</label>
          <select
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold cursor-pointer"
          >
            <option value="single">Single Filer</option>
            <option value="married">Married Joint</option>
          </select>
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Pre-Tax Retirement & HSA (401k / IRA)</label>
          <input
            type="number"
            value={preTaxDeduction}
            onChange={(e) => setPreTaxDeduction(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--fg-muted)]">Monthly Take-Home Pay:</span>
          <span className="text-xl font-bold text-emerald-400 tabular">
            +{formatAmount(monthlyTakeHome)}/mo
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-[10px]">
          <div>
            <span className="text-[var(--fg-muted)] block">Federal Tax:</span>
            <span className="font-bold text-rose-400 tabular">{formatAmount(federalTax)}</span>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] block">FICA Taxes:</span>
            <span className="font-bold text-amber-400 tabular">{formatAmount(ficaTax)}</span>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] block">Effective Rate:</span>
            <span className="font-bold text-[var(--fg)] tabular">{effectiveRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-UTILITY 4: SIP & WEALTH COMPOUNDING FORECASTER
// =========================================================================
const SipWealthCalculator: React.FC<{ formatAmount: (val: number) => string }> = ({ formatAmount }) => {
  const [monthlySip, setMonthlySip] = useState(600);
  const [expectedReturn, setExpectedReturn] = useState(11.5);
  const [years, setYears] = useState(15);

  const r = expectedReturn / 100 / 12;
  const n = years * 12;

  // Future Value of SIP: P * [((1 + r)^n - 1) / r] * (1 + r)
  const futureValue = r > 0 ? monthlySip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : monthlySip * n;
  const totalInvested = monthlySip * n;
  const estimatedReturns = Math.max(0, futureValue - totalInvested);
  const multiplier = totalInvested > 0 ? (futureValue / totalInvested).toFixed(1) : '1.0';

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Monthly SIP</label>
          <input
            type="number"
            value={monthlySip}
            onChange={(e) => setMonthlySip(Math.max(10, parseFloat(e.target.value) || 0))}
            className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Annual Return %</label>
          <input
            type="number"
            step="0.5"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(Math.max(1, parseFloat(e.target.value) || 0))}
            className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Time (Years)</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--fg-muted)]">Expected Maturity Value:</span>
          <span className="text-xl font-bold text-emerald-400 tabular">
            {formatAmount(futureValue)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-[10px]">
          <div>
            <span className="text-[var(--fg-muted)] block">Invested:</span>
            <span className="font-bold text-[var(--fg)] tabular">{formatAmount(totalInvested)}</span>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] block">Est. Returns:</span>
            <span className="font-bold text-emerald-400 tabular">+{formatAmount(estimatedReturns)}</span>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] block">Growth:</span>
            <span className="font-bold text-blue-400 tabular">{multiplier}x Capital</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-UTILITY 5: MULTI-CURRENCY CROSS-RATE CONVERTER
// =========================================================================
const CurrencyFxCalculator: React.FC = () => {
  const [amount, setAmount] = useState(100);
  const [fromCode, setFromCode] = useState('USD');
  const [toCode, setToCode] = useState('EUR');

  // Static reference FX rates to USD
  const RATES_TO_USD: Record<string, number> = {
    USD: 1.0,
    EUR: 1.08,
    GBP: 1.28,
    INR: 0.012,
    JPY: 0.0067,
    CAD: 0.73,
    AUD: 0.66,
  };

  const fromRate = RATES_TO_USD[fromCode] || 1;
  const toRate = RATES_TO_USD[toCode] || 1;
  const inUsd = amount * fromRate;
  const converted = inUsd / toRate;

  const handleSwap = () => {
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-[var(--fg-muted)]">Amount to Convert</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-lg font-bold text-[var(--fg)]"
        />
      </div>

      <div className="grid grid-cols-5 gap-2 items-center">
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] text-[var(--fg-muted)]">From</label>
          <select
            value={fromCode}
            onChange={(e) => setFromCode(e.target.value)}
            className="w-full p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] font-bold text-[var(--fg)] cursor-pointer"
          >
            {Object.keys(RATES_TO_USD).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleSwap}
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-[10px] text-[var(--fg-muted)]">To</label>
          <select
            value={toCode}
            onChange={(e) => setToCode(e.target.value)}
            className="w-full p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] font-bold text-[var(--fg)] cursor-pointer"
          >
            {Object.keys(RATES_TO_USD).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-center space-y-1">
        <span className="text-[11px] text-[var(--fg-muted)]">Converted Equivalent</span>
        <div className="text-2xl font-bold text-emerald-400 tabular">
          {converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCode}
        </div>
        <span className="text-[10px] text-[var(--fg-subtle)] block">
          1 {fromCode} ≈ {(fromRate / toRate).toFixed(4)} {toCode}
        </span>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-UTILITY 6: INFLATION & PURCHASING POWER CALCULATOR
// =========================================================================
const InflationCalculator: React.FC<{ formatAmount: (val: number) => string }> = ({ formatAmount }) => {
  const [presentAmount, setPresentAmount] = useState(10000);
  const [inflationRate, setInflationRate] = useState(3.5);
  const [years, setYears] = useState(10);

  // Future Cost of same goods: P * (1 + i)^n
  const futureCost = presentAmount * Math.pow(1 + inflationRate / 100, years);
  // Future purchasing power of current dollars: P / (1 + i)^n
  const futurePower = presentAmount / Math.pow(1 + inflationRate / 100, years);
  const powerLossPercent = ((presentAmount - futurePower) / presentAmount) * 100;

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Today's Money</label>
          <input
            type="number"
            value={presentAmount}
            onChange={(e) => setPresentAmount(Math.max(1, parseFloat(e.target.value) || 0))}
            className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">Inflation (%/yr)</label>
          <input
            type="number"
            step="0.1"
            value={inflationRate}
            onChange={(e) => setInflationRate(Math.max(0.1, parseFloat(e.target.value) || 0))}
            className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--fg-muted)]">In Years</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] font-semibold"
          />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--fg-muted)]">Future Purchasing Value:</span>
          <span className="text-xl font-bold text-amber-400 tabular">
            {formatAmount(futurePower)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-[10px]">
          <div>
            <span className="text-[var(--fg-muted)] block">Required to Match:</span>
            <span className="font-bold text-[var(--fg)] tabular">{formatAmount(futureCost)}</span>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] block">Purchasing Power Loss:</span>
            <span className="font-bold text-rose-400 tabular">-{powerLossPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
