import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  ChevronLeft,
  GripVertical,
} from 'lucide-react';
import { cn } from '../utilities/cn';
import { TOOLS, TOOL_IDS, type ToolId, type ToolGroup, GROUPS } from '../utilities/registry';

export type UtilityTab = ToolId;

export interface FinanceUtilitiesSystemProps {
  isOpen?: boolean;
  onOpen?: (tab?: ToolId) => void;
  onClose?: () => void;
  defaultTab?: ToolId;
}

interface WinState {
  id: ToolId;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
  z: number;
}

const STORE_KEY = 'omnibudget-utility-windows-v2';
const EDGE_Y_KEY = 'omnibudget-edge-dock-y';

function loadSavedPositions(): Partial<Record<ToolId, { x: number; y: number; w: number; h: number }>> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function savePositions(wins: WinState[]) {
  try {
    const all = loadSavedPositions();
    for (const w of wins) {
      all[w.id] = { x: w.x, y: w.y, w: w.w, h: w.h };
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage issues
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export const FinanceUtilitiesSystem: React.FC<FinanceUtilitiesSystemProps> = ({
  isOpen: controlledIsOpen,
  onOpen: controlledOnOpen,
  onClose: controlledOnClose,
  defaultTab = 'calculator',
}) => {
  const [wins, setWins] = useState<WinState[]>([]);
  const topZ = useRef<number>(10);

  // Samsung Edge Panel Handle State
  const [isEdgeOpen, setIsEdgeOpen] = useState(false);
  const [dockHidden, setDockHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('omnibudget-edge-dock-hidden') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleDockChange = () => {
      try {
        setDockHidden(localStorage.getItem('omnibudget-edge-dock-hidden') === '1');
      } catch {
        // ignore
      }
    };
    window.addEventListener('edge-dock-change', handleDockChange);
    return () => window.removeEventListener('edge-dock-change', handleDockChange);
  }, []);

  const [edgeY, setEdgeY] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(EDGE_Y_KEY);
      return saved ? Number(saved) : 45;
    } catch {
      return 45;
    }
  });

  const dragEdgeRef = useRef<{ startY: number; startPct: number; moved: boolean } | null>(null);

  // Open a specific tool window
  const openWindow = useCallback((id: ToolId) => {
    setWins((currentWins) => {
      const z = ++topZ.current;
      const existing = currentWins.find((w) => w.id === id);
      if (existing) {
        return currentWins.map((w) => (w.id === id ? { ...w, minimized: false, z } : w));
      }
      const tool = TOOLS[id] || TOOLS.calculator;
      const saved = loadSavedPositions()[id];
      const offset = (currentWins.length % 6) * 32;

      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

      const w = Math.min(saved?.w ?? tool.size.w, screenW - 24);
      const h = Math.min(saved?.h ?? tool.size.h, screenH - 90);
      const x = clamp(saved?.x ?? screenW - w - 80 - offset, 12, screenW - w - 12);
      const y = clamp(saved?.y ?? 76 + offset, 68, screenH - 60);

      return [...currentWins, { id, x, y, w, h, minimized: false, maximized: false, z }];
    });
  }, []);

  // Controlled trigger when props.isOpen becomes true
  useEffect(() => {
    if (controlledIsOpen) {
      const targetId = (defaultTab && defaultTab in TOOLS ? defaultTab : 'calculator') as ToolId;
      openWindow(targetId);
      if (controlledOnClose) {
        // Reset controlled trigger
        controlledOnClose();
      }
    }
  }, [controlledIsOpen, defaultTab, openWindow, controlledOnClose]);

  const closeWindow = useCallback((id: ToolId) => {
    setWins((current) => current.filter((w) => w.id !== id));
  }, []);

  const updateWindow = useCallback((id: ToolId, patch: Partial<WinState>) => {
    setWins((current) => {
      const next = current.map((w) => (w.id === id ? { ...w, ...patch } : w));
      if ('x' in patch || 'w' in patch) savePositions(next);
      return next;
    });
  }, []);

  const focusWindow = useCallback(
    (id: ToolId) => {
      updateWindow(id, { z: ++topZ.current });
    },
    [updateWindow]
  );

  // Edge handle vertical drag listeners
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const d = dragEdgeRef.current;
      if (!d) return;
      const diffY = e.clientY - d.startY;
      if (Math.abs(diffY) > 4) d.moved = true;
      const nextPct = clamp(d.startPct + (diffY / window.innerHeight) * 100, 12, 88);
      setEdgeY(nextPct);
    };

    const handlePointerUp = () => {
      const d = dragEdgeRef.current;
      dragEdgeRef.current = null;
      if (!d) return;
      if (d.moved) {
        try {
          localStorage.setItem(EDGE_Y_KEY, String(Math.round(edgeY)));
        } catch {
          // ignore
        }
      } else {
        setIsEdgeOpen((prev) => !prev);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [edgeY]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* 1. Floating Windows */}
      {wins.map((w) => (
        <UtilityWindowFrame
          key={w.id}
          win={w}
          update={updateWindow}
          focus={focusWindow}
          close={closeWindow}
        />
      ))}

      {/* 2. Minimized Bottom Dock Tray */}
      <MinimizedDockTray
        wins={wins.filter((w) => w.minimized)}
        restore={(id) => updateWindow(id, { minimized: false, z: ++topZ.current })}
        close={closeWindow}
      />

      {/* 3. Samsung Edge Panel Handle & Drawer (Fixed flush right to the end) */}
      {!dockHidden && (
        <div
          className="fixed right-0 z-[200] flex items-center select-none"
          style={{ top: `${edgeY}%`, transform: 'translateY(-50%)' }}
        >
        {/* Edge Shelf Flyout Menu */}
        {isEdgeOpen && (
          <div
            role="dialog"
            aria-label="Finance Utilities Shelf"
            className="mr-2 w-72 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-2xl animate-fade-in backdrop-blur-xl"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-[var(--fg)]">Finance Utilities</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--fg-muted)]">
                  {TOOL_IDS.length} tools
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEdgeOpen(false)}
                className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {GROUPS.map((group) => {
                const groupTools = TOOL_IDS.filter((id) => TOOLS[id].group === group);
                if (groupTools.length === 0) return null;
                return (
                  <div key={group} className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)] px-1">
                      {group}
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {groupTools.map((id) => {
                        const tool = TOOLS[id];
                        const isOpen = wins.some((w) => w.id === id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              openWindow(id);
                              setIsEdgeOpen(false);
                            }}
                            className={cn(
                              'flex flex-col items-center gap-1.5 p-2 rounded-xl text-center text-[10px] font-medium transition group border border-transparent',
                              isOpen
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'hover:bg-[var(--surface-2)] text-[var(--fg)] hover:border-[var(--border)]'
                            )}
                          >
                            <span
                              className={cn(
                                'w-8 h-8 rounded-xl flex items-center justify-center transition group-hover:scale-105',
                                isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[var(--surface-2)] text-[var(--fg)]'
                              )}
                            >
                              <tool.icon className="w-4 h-4" />
                            </span>
                            <span className="line-clamp-1 leading-tight">{tool.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Samsung Edge Draggable Pill Handle (Flush right to the end) */}
        <button
          type="button"
          aria-label={isEdgeOpen ? 'Close Finance Utilities' : 'Open Finance Utilities'}
          onPointerDown={(e) => {
            dragEdgeRef.current = { startY: e.clientY, startPct: edgeY, moved: false };
          }}
          className={cn(
            'flex h-20 w-5 touch-none items-center justify-center rounded-l-xl border border-r-0 border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] shadow-xl backdrop-blur-md transition-all hover:w-6 hover:text-[var(--fg)] active:w-6 group',
            isEdgeOpen && 'w-6 text-[var(--fg)] bg-[var(--surface-2)]'
          )}
          title="Drag up/down, or tap to open utilities"
        >
          <div className="flex flex-col items-center gap-1">
            <GripVertical className="w-2.5 h-2.5 opacity-40 group-hover:opacity-80" />
            <ChevronLeft
              className={cn('w-3.5 h-3.5 transition-transform duration-200', isEdgeOpen && 'rotate-180 text-emerald-400')}
            />
          </div>
        </button>
      </div>
      )}
    </>,
    document.body
  );
};

// ---------------------------------------------------------------- Frame

function UtilityWindowFrame({
  win,
  update,
  focus,
  close,
}: {
  win: WinState;
  update: (id: ToolId, p: Partial<WinState>) => void;
  focus: (id: ToolId) => void;
  close: (id: ToolId) => void;
}) {
  const tool = TOOLS[win.id];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isFull = win.maximized || isMobile;

  const dragRef = useRef<{
    dx: number;
    dy: number;
    resize: boolean;
    w: number;
    h: number;
    sx: number;
    sy: number;
  } | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.resize) {
        update(win.id, {
          w: clamp(d.w + e.clientX - d.sx, 320, window.innerWidth - win.x - 12),
          h: clamp(d.h + e.clientY - d.sy, 240, window.innerHeight - win.y - 12),
        });
      } else {
        update(win.id, {
          x: clamp(e.clientX - d.dx, 12, window.innerWidth - 100),
          y: clamp(e.clientY - d.dy, 56, window.innerHeight - 60),
        });
      }
    };

    const handlePointerUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [update, win.id, win.x, win.y]);

  const style: React.CSSProperties = isFull
    ? { zIndex: 60 + win.z }
    : {
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: 60 + win.z,
      };

  const ToolComponent = tool.component;

  return (
    <section
      role="dialog"
      aria-label={tool.name}
      style={style}
      hidden={win.minimized}
      onPointerDown={() => focus(win.id)}
      className={cn(
        'fixed flex flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-2xl transition-shadow select-text',
        isFull
          ? isMobile
            ? 'inset-x-0 bottom-0 top-16 rounded-t-3xl'
            : 'inset-6 top-20 rounded-2xl'
          : 'rounded-2xl'
      )}
    >
      {/* Titlebar Header */}
      <header
        className={cn(
          'flex h-11 shrink-0 select-none items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] pl-3.5 pr-1.5 transition-colors',
          !isFull && 'cursor-move touch-none'
        )}
        onPointerDown={(e) => {
          if (isFull || (e.target as HTMLElement).closest('button')) return;
          dragRef.current = {
            dx: e.clientX - win.x,
            dy: e.clientY - win.y,
            resize: false,
            w: win.w,
            h: win.h,
            sx: e.clientX,
            sy: e.clientY,
          };
        }}
        onDoubleClick={() => !isMobile && update(win.id, { maximized: !win.maximized })}
      >
        <tool.icon className="w-4 h-4 text-[var(--fg-muted)] shrink-0" />
        <h2 className="flex-1 truncate text-xs font-semibold text-[var(--fg)] tracking-tight">
          {tool.name}
        </h2>

        {/* Window action buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Minimize"
            title="Minimize to dock tray"
            onClick={() => update(win.id, { minimized: true })}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--fg)] transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {!isMobile && (
            <button
              type="button"
              aria-label={win.maximized ? 'Restore window size' : 'Maximize window'}
              title={win.maximized ? 'Restore' : 'Maximize'}
              onClick={() => update(win.id, { maximized: !win.maximized })}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--fg)] transition"
            >
              {win.maximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            aria-label="Close"
            title="Close window"
            onClick={() => close(win.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-rose-500/20 hover:text-rose-400 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Window Body Canvas */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 bg-[var(--surface)]">
        <ToolComponent />
      </div>

      {/* Resize corner gripper */}
      {!isFull && (
        <div
          aria-hidden="true"
          className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize touch-none text-[var(--fg-muted)] opacity-50 hover:opacity-100"
          onPointerDown={(e) => {
            e.stopPropagation();
            dragRef.current = {
              dx: 0,
              dy: 0,
              resize: true,
              w: win.w,
              h: win.h,
              sx: e.clientX,
              sy: e.clientY,
            };
          }}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4">
            <path d="M15 6 6 15M15 11l-4 4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- Tray

function MinimizedDockTray({
  wins,
  restore,
  close,
}: {
  wins: WinState[];
  restore: (id: ToolId) => void;
  close: (id: ToolId) => void;
}) {
  if (wins.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 left-4 sm:left-24 lg:left-64 z-[190] flex flex-wrap items-center gap-2 max-w-[calc(100vw-5rem)]"
      aria-label="Minimized finance utilities dock"
    >
      {wins.map((w) => {
        const tool = TOOLS[w.id];
        return (
          <span
            key={w.id}
            className="flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-lg backdrop-blur-md px-1 py-0.5 text-xs font-medium text-[var(--fg)] animate-fade-in hover:border-[var(--fg-muted)] transition"
          >
            <button
              type="button"
              onClick={() => restore(w.id)}
              className="flex items-center gap-1.5 py-1 pl-2.5 pr-1.5 hover:text-emerald-400 transition"
              aria-label={`Restore ${tool.name}`}
            >
              <tool.icon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{tool.name}</span>
            </button>
            <button
              type="button"
              onClick={() => close(w.id)}
              aria-label={`Close ${tool.name}`}
              className="rounded-full p-1 text-[var(--fg-muted)] hover:text-rose-400 hover:bg-[var(--surface-2)] transition"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}
    </div>
  );
}
