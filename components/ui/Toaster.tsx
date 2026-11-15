"use client";

import { CheckCircle, Info, X, XCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { toastStore, useToasts, type Toast } from "@/lib/toast-store";
import { EASE } from "@/lib/motion";

const TONE = {
  neutral: { Icon: Info, chip: "bg-brand-soft text-brand" },
  success: { Icon: CheckCircle, chip: "bg-mint-soft text-mint-deep" },
  alert: { Icon: XCircle, chip: "bg-sale/10 text-sale" },
} as const;

function Row({ toast }: { toast: Toast }) {
  const { Icon, chip } = TONE[toast.tone];
  const t = useTranslations("common");

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${chip}`}
      >
        <Icon size={17} weight="fill" />
      </span>
      <span className="min-w-0 flex-1 self-center text-[13px] font-medium leading-snug text-ink">
        {toast.message}
      </span>
      {toast.actionLabel && (
        <span className="shrink-0 self-center text-[12px] font-semibold text-brand underline underline-offset-4">
          {toast.actionLabel}
        </span>
      )}
    </>
  );

  return (
    <motion.li
      layout
      data-testid="toast"
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.24, ease: EASE }}
      className="pointer-events-auto w-full max-w-[min(420px,100%)]"
    >
      <div className="flex items-start gap-3 rounded-soft border border-hairline bg-white px-3.5 py-3 shadow-pop">
        {toast.href ? (
          <Link href={toast.href} className="flex flex-1 items-start gap-3">
            {content}
          </Link>
        ) : (
          <div className="flex flex-1 items-start gap-3">{content}</div>
        )}
        <button
          type="button"
          onClick={() => toastStore.dismiss(toast.id)}
          aria-label={t("dismissToast")}
          className="relative -me-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-mist hover:text-ink"
        >
          <X size={13} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </motion.li>
  );
}

export default function Toaster() {
  const toasts = useToasts();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-[var(--z-toast)] flex justify-center px-4 lg:bottom-6 lg:justify-end lg:pe-6">
      <ul
        aria-live="polite"
        aria-relevant="additions"
        className="flex w-full max-w-[420px] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <Row key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}