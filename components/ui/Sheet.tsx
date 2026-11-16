"use client";

import { IconButton } from "@/components/ui/Button";
import { X } from "@phosphor-icons/react";
import { motion, useDragControls } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialog, useMediaQuery, useMounted, useScrollLock } from "@/lib/hooks";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SheetProps = {
  /** Accessible name of the surface, e.g. the product title. */
  title: string;
  onClose: () => void;
  eyebrow?: string;
  headerExtra?: React.ReactNode;
  /** Sticky action bar. Kept outside the scroll area so it never scrolls away. */
  footer?: React.ReactNode;
  /** Host-driven dismissal: play the exit without unmounting yet. */
  exiting?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * The one bottom sheet of the app, at every breakpoint: a strip of blurred
 * context above, curved top corners, drag-to-dismiss on touch. Desktop centres
 * it in a 680px column instead of stretching edge to edge.
 */
export default function Sheet({
  title,
  onClose,
  eyebrow,
  headerExtra,
  footer,
  exiting = false,
  className,
  children,
}: SheetProps) {
  const mounted = useMounted();
  const compact = useMediaQuery("(max-width: 1023px)");
  const t = useTranslations("common");
  const [phase, setPhase] = useState<"enter" | "settled" | "exit">("enter");
  const [scrolled, setScrolled] = useState(false);
  const controls = useDragControls();
  const titleId = useId();
  const timers = useRef<number[]>([]);

  const handleClose = () => {
    if (phase === "exit") return;
    setPhase("exit");
    timers.current.push(window.setTimeout(onClose, 240));
  };

  const dialogRef = useDialog<HTMLDivElement>(mounted, handleClose);
  useScrollLock(mounted);

  useEffect(() => {
    const settle = window.setTimeout(() => setPhase("settled"), 420);
    const pending = timers.current;
    return () => {
      window.clearTimeout(settle);
      pending.forEach(window.clearTimeout);
    };
  }, []);

  if (!mounted) return null;

  const leaving = phase === "exit" || exiting;
  const dragging = compact && !leaving;

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-sheet)] flex items-end justify-center">
      <motion.div
        data-testid="sheet-scrim"
        aria-hidden="true"
        style={{ touchAction: "none" }}
        className="absolute inset-0 bg-ink/30 backdrop-blur-[8px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: leaving ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: leaving ? 0.22 : DUR.micro, ease: EASE }}
        onClick={handleClose}
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="sheet-panel"
        drag={dragging ? "y" : false}
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.55 }}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 750) handleClose();
        }}
        initial={{ y: "100%" }}
        animate={{ y: leaving ? "100%" : 0 }}
        exit={{ y: "100%" }}
        transition={
          leaving
            ? { duration: 0.24, ease: EASE }
            : { type: "spring", stiffness: 320, damping: 34, mass: 0.9 }
        }
        className={cn(
          "relative flex h-[calc(100dvh-0.75rem)] w-full flex-col overflow-hidden rounded-t-sheet bg-white shadow-sheet outline-none sm:h-[calc(100dvh-1.25rem)] lg:h-[calc(100dvh-2.5rem)]",
          className,
        )}
      >
        {/* The grabber is the drag handle, so the scroll area keeps its own gesture. */}
        <div
          className={cn(
            "flex shrink-0 cursor-grab justify-center pt-2.5 active:cursor-grabbing lg:hidden",
          )}
          style={{ touchAction: "none" }}
          onPointerDown={(event) => {
            if (dragging) controls.start(event);
          }}
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-ink/15" />
        </div>

        <header
          className={cn(
            "relative z-[var(--z-sheet-content)] flex shrink-0 items-start gap-3 bg-white/95 px-4 pb-3 pt-2.5 backdrop-blur-xl transition-shadow duration-200 sm:px-6 lg:pt-5",
            scrolled && "shadow-[0_12px_28px_-24px_rgba(11,13,16,0.5)]",
          )}
        >
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue rtl:tracking-normal">
                {eyebrow}
              </p>
            )}
            <h2
              id={titleId}
              className={cn(
                "display-cut text-ink",
                eyebrow
                  ? "mt-1 text-[19px] leading-tight sm:text-[21px]"
                  : "text-[20px] leading-tight sm:text-[22px]",
              )}
            >
              {title}
            </h2>
          </div>

          {headerExtra}

          <IconButton
            label={t("close")}
            onClick={handleClose}
            className="-me-1 mt-0.5 h-10 w-10 bg-mist text-muted hover:bg-blue-soft hover:text-blue"
          >
            <X size={18} aria-hidden="true" />
          </IconButton>
        </header>

        <div
          data-testid="sheet-scroll"
          onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 4)}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
          {!footer && <div className="h-[env(safe-area-inset-bottom)]" />}
        </div>

        {footer && (
          <footer className="shrink-0 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
            {footer}
          </footer>
        )}
      </motion.div>
    </div>,
    document.body,
  );
}