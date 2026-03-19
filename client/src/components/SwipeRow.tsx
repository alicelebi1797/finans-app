import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className: string;
}

interface SwipeRowProps {
  id: string;
  openRowId: string | null;
  setOpenRowId: (id: string | null) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
  className?: string;
  alwaysShowActions?: boolean;
  hideDesktopActions?: boolean;
  editOnly?: boolean;
  customActions?: SwipeAction[];
}

export function SwipeRow({ id, openRowId, setOpenRowId, onEdit, onDelete, children, className, alwaysShowActions, hideDesktopActions, editOnly, customActions }: SwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startXRef = useRef(0);
  const dragging = useRef(false);
  const SNAP = customActions ? customActions.length * 72 : (editOnly ? 72 : 144);

  useEffect(() => {
    if (openRowId !== id) { setAnimating(true); setOffset(0); }
  }, [openRowId, id]);

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    dragging.current = true;
    setAnimating(false);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const delta = startXRef.current - e.touches[0].clientX;
    setOffset(Math.max(0, Math.min(SNAP, delta)));
  };
  const onTouchEnd = () => {
    dragging.current = false;
    setAnimating(true);
    if (offset > SNAP / 3) { setOffset(SNAP); setOpenRowId(id); }
    else { setOffset(0); if (openRowId === id) setOpenRowId(null); }
  };
  const close = () => { setAnimating(true); setOffset(0); setOpenRowId(null); };

  return (
    <div className={cn('relative overflow-hidden select-none group', className)}>
      {/* Mobile: swipe-reveal buttons */}
      <div className="absolute right-0 top-0 bottom-0 flex md:hidden" style={{ width: SNAP }}>
        {customActions ? (
          customActions.map((action, i) => (
            <button
              key={i}
              onClick={() => { close(); action.onClick(); }}
              className={cn("flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors", action.className)}>
              {action.icon}
              <span className="text-white text-[11px] font-semibold">{action.label}</span>
            </button>
          ))
        ) : (
          <>
            <button
              onClick={() => { close(); onEdit?.(); }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-primary hover:bg-primary/90 transition-colors">
              <Pencil size={16} className="text-white" />
              <span className="text-white text-[11px] font-semibold">Düzenle</span>
            </button>
            {!editOnly && onDelete && (
              <button
                onClick={() => { close(); onDelete(); }}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-rose-500 hover:bg-rose-600 transition-colors">
                <Trash2 size={16} className="text-white" />
                <span className="text-white text-[11px] font-semibold">Sil</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Desktop: hover-reveal icon buttons (only when no customActions) */}
      {!hideDesktopActions && !customActions && (
        <div className={cn("hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 z-20 transition-opacity duration-150", alwaysShowActions ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
          <button
            onClick={onEdit}
            className="h-7 w-7 rounded-lg bg-background/95 border border-border/80 shadow-sm flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
            <Pencil size={12} />
          </button>
          {!editOnly && onDelete && (
            <button
              onClick={onDelete}
              className="h-7 w-7 rounded-lg bg-background/95 border border-border/80 shadow-sm flex items-center justify-center text-muted-foreground hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div
        style={{ transform: `translateX(-${offset}px)`, transition: animating ? 'transform 0.25s cubic-bezier(0.25,1,0.5,1)' : 'none' }}
        className="relative bg-card z-10"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (openRowId === id) close(); }}
      >
        {children}
      </div>
    </div>
  );
}
