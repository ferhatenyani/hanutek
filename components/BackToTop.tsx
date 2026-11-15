"use client";

import { ArrowUp } from "@phosphor-icons/react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function BackToTop() {
  const t = useTranslations("footer");
  const rm = useReducedMotion();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    setVisible(v > 600);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label={t("backToTop")}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          onClick={() =>
            window.scrollTo({ top: 0, behavior: rm ? "auto" : "smooth" })
          }
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] end-4 z-[var(--z-appbar)] flex h-11 w-11 items-center justify-center rounded-xl bg-obsidian text-white shadow-[0_16px_32px_-12px_rgba(15,23,42,0.5)] transition-colors hover:bg-obsidian/85 md:bottom-6 md:end-6"
        >
          <ArrowUp size={18} weight="bold" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
