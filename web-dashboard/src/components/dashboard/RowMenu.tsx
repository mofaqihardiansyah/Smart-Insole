import React, { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * RowMenu — the per-row actions overflow.
 *
 * It is a real menu, not a glyph: the trigger reports `aria-haspopup` and
 * `aria-expanded`, the popup is a `role="menu"`, Arrow keys move between items,
 * Escape closes and returns focus to the trigger, and a pointer outside closes
 * it. A "..." that opens nothing is the classic dead control.
 *
 * The menu is only rendered when a row actually has actions to offer, so a row
 * without them never shows a trigger.
 */

/** One action in the overflow menu. */
interface RowMenuItem {
  id: string;
  label?: ReactNode;
  icon?: LucideIcon;
  onSelect?: () => void;
}

interface RowMenuProps {
  /** The trigger's accessible name; also names the popup. */
  label?: string;
  items?: RowMenuItem[];
  className?: string;
}

const RowMenu = ({
  label,
  items = [],
  className = "",
}: RowMenuProps) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[active]?.focus();
  }, [open, active]);

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      setActive(0);
    }
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((prev) => (prev + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((prev) => (prev - 1 + items.length) % items.length);
    }
  };

  if (items.length === 0) return null;

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex h-11 w-11 items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-[calc(100%+4px)] z-30 w-52 overflow-hidden rounded-tile border border-border-strong bg-surface py-1 shadow-lg"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
                className={`flex min-h-[44px] w-full items-center gap-2.5 px-3 text-left text-body-base transition-colors ${
                  item.id === "copied" ? "text-safe" : "text-fg-2 hover:bg-surface-2 hover:text-fg"
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { RowMenu };
export default RowMenu;
