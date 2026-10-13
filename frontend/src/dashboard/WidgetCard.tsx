import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { WidgetConfig, WidgetSize, WIDGET_CATALOG } from './types';

export const SIZE_CLASSES: Record<WidgetSize, string> = {
  s: 'col-span-1',
  m: 'col-span-1 sm:col-span-2 xl:col-span-2',
  l: 'col-span-1 sm:col-span-2 xl:col-span-3',
  xl: 'col-span-1 sm:col-span-2 xl:col-span-4',
};

interface WidgetCardProps {
  widget: WidgetConfig;
  editing: boolean;
  onUpdateSize: (id: string, size: WidgetSize) => void;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  editing,
  onUpdateSize,
  onRemove,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: !editing,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const meta = WIDGET_CATALOG[widget.type];
  const title = widget.title || meta?.name || 'Widget';

  const sizes: WidgetSize[] = ['s', 'm', 'l', 'xl'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${SIZE_CLASSES[widget.size]} min-w-0`}
    >
      <div
        className={`h-full flex flex-col rounded-2xl border bg-[var(--surface)] transition-all duration-200 ${
          editing
            ? 'border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] shadow-md'
            : 'border-[var(--border)] shadow-xs hover:border-[var(--border-strong)]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2.5">
          <div className="flex items-center gap-2 truncate">
            {editing && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition"
                title="Drag to rearrange"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            <h3 className="font-semibold text-xs text-[var(--fg)] tracking-tight truncate">
              {title}
            </h3>
          </div>

          {editing && (
            <div className="flex items-center gap-2">
              {/* Size Selector */}
              <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-0.5 text-[10px]">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onUpdateSize(widget.id, s)}
                    className={`px-1.5 py-0.5 rounded uppercase font-bold transition ${
                      widget.size === s
                        ? 'bg-[var(--fg)] text-[var(--bg)]'
                        : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => onRemove(widget.id)}
                className="p-1 rounded text-[var(--fg-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition"
                title="Remove widget"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 px-5 pb-5 pt-1">{children}</div>
      </div>
    </div>
  );
};
