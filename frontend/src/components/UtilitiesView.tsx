import React, { useState, useEffect } from 'react';
import { ExternalLink, Layers, Sparkles } from 'lucide-react';
import { cn } from '../utilities/cn';
import { TOOLS, TOOL_IDS, GROUPS, type ToolId, type ToolGroup } from '../utilities/registry';
import { Switch } from '../utilities/parts';

const DOCK_HIDDEN_KEY = 'omnibudget-edge-dock-hidden';

interface UtilitiesViewProps {
  initialTool?: ToolId;
  onPopOut?: (toolId: ToolId) => void;
}

export const UtilitiesView: React.FC<UtilitiesViewProps> = ({
  initialTool = 'calculator',
  onPopOut,
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolId>(initialTool);
  const [dockHidden, setDockHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DOCK_HIDDEN_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleDock = (show: boolean) => {
    try {
      localStorage.setItem(DOCK_HIDDEN_KEY, show ? '0' : '1');
    } catch {
      // ignore
    }
    setDockHidden(!show);
    window.dispatchEvent(new Event('edge-dock-change'));
  };

  const currentTool = TOOLS[selectedTool] || TOOLS.calculator;
  const ToolComponent = currentTool.component;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Finance Utilities</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            12 financial calculators & daily money tools • Calculate on page or pop out into floating windows
          </p>
        </div>

        {/* Global Edge Dock Toggle */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--fg-muted)] cursor-pointer hover:border-[var(--fg-muted)] transition">
          <Switch
            label="Edge panel on every page"
            checked={!dockHidden}
            onCheckedChange={toggleDock}
          />
          <span className="font-medium text-[var(--fg)]">Edge panel on every page</span>
        </label>
      </div>

      {/* Main Responsive Layout: Left Sidebar + Right Workspace (Desktop/Laptop Optimized) */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Master Navigation Column */}
        <nav
          aria-label="Utilities Menu"
          className="w-full lg:w-64 lg:shrink-0 flex flex-col gap-4 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs"
        >
          {GROUPS.map((g) => {
            const groupTools = TOOL_IDS.filter((id) => TOOLS[id].group === g);
            return (
              <div key={g} className="flex flex-col gap-1">
                <span className="px-2.5 pb-1 text-[10px] font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
                  {g}
                </span>
                <div className="flex flex-col gap-0.5">
                  {groupTools.map((id) => {
                    const t = TOOLS[id];
                    const isSelected = id === selectedTool;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedTool(id)}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition',
                          isSelected
                            ? 'bg-[var(--surface-2)] text-[var(--fg)] font-semibold shadow-xs'
                            : 'text-[var(--fg-muted)] hover:bg-[var(--surface-2)]/60 hover:text-[var(--fg)]'
                        )}
                      >
                        <t.icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-transform',
                            isSelected ? 'text-emerald-500 scale-110' : 'text-[var(--fg-muted)]'
                          )}
                        />
                        <span className="truncate flex-1">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Right Detail Workspace */}
        <div className="flex-1 min-w-0 w-full max-w-4xl p-5 sm:p-7 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-6">
          {/* Workspace Title & Pop Out Action */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
                <currentTool.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[var(--fg)]">
                  {currentTool.name}
                </h3>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5 leading-relaxed">
                  {currentTool.does}
                </p>
              </div>
            </div>

            {onPopOut && (
              <button
                type="button"
                onClick={() => onPopOut(selectedTool)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg)] border border-[var(--border)] transition shadow-xs self-start shrink-0 group"
                title="Pop out into a floating window you can move around"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400 transition-transform group-hover:scale-110" />
                <span>Pop out window</span>
              </button>
            )}
          </div>

          {/* Active Tool Interactive Interface */}
          <div className="pt-1">
            <ToolComponent />
          </div>
        </div>
      </div>
    </div>
  );
};
