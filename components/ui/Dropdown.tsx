"use client";

import { CaretDown, Check } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

export type DropdownOption = {
  value: string;
  label: string;
  shortLabel?: string;
};

type DropdownProps = {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  prefix?: string;
  variant?: "outline" | "ghost";
  shape?: "rect" | "pill" | "square";
  align?: "start" | "end";
  compact?: boolean;
  className?: string;
};

const TRIGGER_BASE =
  "inline-flex h-10 items-center gap-2 border px-3.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function Dropdown({
  label,
  value,
  options,
  onChange,
  icon,
  prefix,
  variant = "outline",
  shape = "rect",
  align = "end",
  compact = false,
  className = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  const listId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const openMenu = (index = selectedIndex) => {
    setActive(index);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      listRef.current
        ?.querySelectorAll<HTMLButtonElement>('[role="option"]')
        [active]?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, active]);

  const move = (next: number) => {
    const clamped = Math.min(options.length - 1, Math.max(0, next));
    setActive(clamped);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="option"]')
      [clamped]?.focus();
  };

  const choose = (next: string) => {
    onChange(next);
    close();
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (open) move(active + (event.key === "ArrowDown" ? 1 : -1));
            else openMenu(selectedIndex);
          }
          if (event.key === "Escape" && open) {
            event.preventDefault();
            close();
          }
        }}
        className={`${TRIGGER_BASE} ${
          shape === "pill"
            ? "rounded-full"
            : shape === "square"
              ? "rounded-soft-sm"
              : "rounded-soft-sm"
        } ${
          variant === "ghost"
            ? "border-transparent bg-transparent text-muted hover:bg-mist hover:text-ink"
            : "border-hairline bg-white text-ink shadow-soft hover:border-brand/30 hover:bg-brand-tint"
        }`}
      >
        {icon && <span className="text-muted">{icon}</span>}
        {prefix && <span className="hidden text-muted sm:inline">{prefix}</span>}
        <span className={`font-medium ${compact ? "max-sm:hidden" : ""}`}>
          {selected?.shortLabel ?? selected?.label}
        </span>
        <CaretDown
          size={14}
          weight="bold"
          aria-hidden="true"
          className={`text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          } ${compact ? "max-sm:hidden" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            initial={reduced ? false : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                move(active + 1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                move(active - 1);
              } else if (event.key === "Home") {
                event.preventDefault();
                move(0);
              } else if (event.key === "End") {
                event.preventDefault();
                move(options.length - 1);
              } else if (event.key === "Escape") {
                event.preventDefault();
                close();
              } else if (event.key === "Tab") {
                close(false);
              }
            }}
            className={`absolute z-50 mt-2 w-max min-w-full max-w-[280px] ${
              shape === "square" ? "rounded-soft-sm" : "rounded-soft-sm"
            } border border-hairline bg-white p-1.5 shadow-pop ${
              align === "end" ? "end-0" : "start-0"
            }`}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    onClick={() => choose(option.value)}
                    onMouseEnter={() => setActive(index)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[9px] px-2.5 py-2 text-start text-sm transition-colors ${
                      index === active ? "bg-brand-tint" : ""
                    } ${isSelected ? "font-semibold text-ink" : "text-muted"}`}
                  >
                    <span className="whitespace-nowrap">{option.label}</span>
                    {isSelected && (
                      <Check
                        size={15}
                        weight="bold"
                        aria-hidden="true"
                        className="shrink-0 text-brand"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}