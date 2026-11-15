"use client";

import { IconButton } from "@/components/ui/Button";
import { X } from "@phosphor-icons/react";
import { motion, useDragControls } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialog, useMediaQuery, useMounted, useScrollLock } from "@/lib/hooks";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SheetProps = {
  /** Accessible name of the surface, e.g. the product title. */
  title: string;
  onClose: () => void;
  /** `full` owns the whole viewport on mobile; `sheet` keeps a strip of context. */
  size?: "sheet" | "full";
  /**
   * Desktop presentation: a centered dialog for product stories, a right-hand
   * panel for cart-like workflows. Phones and tablets always get a bottom sheet.
   */
  placement?: "dialog" | "panel";
  eyebrow?: string;
  headerExtra?: React.ReactNode;
  /** Sticky action bar. Kept outside the scroll area so it never scrolls away. */
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export default function Sheet({
  title,
  onClose,
  size = "sheet",
  placement = "dialog",
  eyebrow,
  headerExtra,
  footer,
  className,
  children,
}: SheetProps) {
  const mounted = useMounted();
  const compact = useMediaQuery("(max-width: 1023px)");
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [openedAt] = useState(pathname);
  const full = size === "full";
  const [phase, setPhase] = useState<"enter" | "settled" | "exit">("enter");
  const [gone, setGone] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const controls = useDragControls();
  const titleId = useId();
  const timers = useRef<number[]>([]);
  const rtl = locale === "ar";

  const handleClose = () => {
    if (phase === "exit") return;
    setPhase("exit");
    timers.current.push(
      window.setTimeout(() => {
        // Unmount our own portal: a back navigation leaves the parallel slot's
        // tree mounted, which would keep an invisible dialog in the DOM.
        setGone(true);
        onClose();
      }, 250),
    );
  };

  const dialogRef = useDialog<HTMLDivElement>(mounted && !gone, handleClose);
  // Releasing the lock is what lets the page the sheet navigated to scroll.
  useScrollLock(mounted && !gone && pathname === openedAt);

  useEffect(() => {
    const settle = window.setTimeout(() => setPhase("settled"), 420);
    const pending = timers.current;
    return () => {
      window.clearTimeout(settle);
      pending.forEach(window.clearTimeout);
    };
  }, []);

  // A link inside the sheet can navigate without going through handleClose, and
  // Next then keeps this slot's tree mounted. Left standing, its full-screen
  // layer would silently swallow every pointer event on the page behind it, so
  // the portal drops as soon as the route is no longer the one that opened it.
  if (!mounted || gone || pathname !== openedAt) return null;

  const dragging = compact && !full && phase !== "exit";
  const panel = !compact && placement === "panel";
  const enter = compact
    ? { y: "100%" }
    : panel
      ? { x: rtl ? "-100%" : "100%" }
      : { y: 26, scale: 0.975, opacity: 0 };
  const exit = compact
    ? { y: "100%" }
    : panel
      ? { x: rtl ? "-100%" : "100%" }
      : { y: 20, scale: 0.985, opacity: 0 };
  const rest = compact
    ? { y: 0 }
    : panel
      ? { x: 0 }
      : { y: 0, scale: 1, opacity: 1 };

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-sheet)]">
      <motion.div
        data-testid="sheet-scrim"
        aria-hidden="true"
        // touch-action is what stops a swipe on the scrim from scrolling the
        // page behind it; the root overflow lock covers the other gestures.
        style={{ touchAction: "none" }}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[6px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "exit" ? 0 : 1 }}
        transition={{ duration: phase === "exit" ? 0.22 : DUR.micro, ease: EASE }}
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
        initial={enter}
        animate={phase === "exit" ? exit : rest}
        transition={
          phase === "exit"
            ? { duration: 0.24, ease: EASE }
            : { type: "spring", stiffness: 320, damping: 34, mass: 0.9 }
        }
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col overflow-hidden bg-white shadow-sheet outline-none",
          full
            ? "h-[100dvh] rounded-none"
            : "h-[90dvh] max-h-[calc(100dvh-1.5rem)] rounded-t-sheet",
          panel
            ? "lg:inset-y-0 lg:end-0 lg:start-auto lg:bottom-0 lg:h-[100dvh] lg:max-h-none lg:w-[min(460px,100%)] lg:rounded-none lg:rounded-s-sheet lg:shadow-pop"
            : "lg:inset-0 lg:m-auto lg:h-[min(90dvh,860px)] lg:max-h-none lg:w-[min(1040px,calc(100%-3rem))] lg:rounded-sheet lg:shadow-pop",
          className,
        )}
      >
        {/* The grabber is the drag handle, so the scroll area keeps its own gesture. */}
        <div
          className={cn(
            "flex shrink-0 justify-center pt-2.5 lg:hidden",
            !full && "cursor-grab active:cursor-grabbing",
          )}
          style={{ touchAction: full ? "auto" : "none" }}
          onPointerDown={(event) => {
            if (dragging) controls.start(event);
          }}
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-ink/15" />
        </div>

        <header
          className={cn(
            "relative z-[var(--z-sheet-content)] flex shrink-0 items-start gap-3 bg-white/95 px-4 backdrop-blur-xl transition-shadow duration-200 sm:px-6 lg:pt-5",
            full ? "pt-3.5 pb-3" : "pt-2.5 pb-3",
            scrolled && "shadow-[0_12px_28px_-24px_rgba(16,24,40,0.5)]",
          )}
        >
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand rtl:tracking-normal">
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
            className="-me-1 mt-0.5 h-10 w-10 bg-mist text-muted hover:bg-brand-soft hover:text-brand"
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
          <footer className="shrink-0 border-t border-hairline bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
            {footer}
          </footer>
        )}
      </motion.div>
    </div>,
    document.body,
  );
}