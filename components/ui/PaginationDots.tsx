"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

/**
 * Windowed pagination dots (EL pattern): the active dot stretches into a pill,
 * dots near the window edge taper so a long rail still reads at a glance.
 */
export default function PaginationDots({
  total,
  current,
  onSelect,
  labelFor,
  tone = "ink",
  maxVisible = 9,
}: {
  total: number;
  current: number;
  onSelect: (index: number) => void;
  labelFor: (index: number) => string;
  tone?: "ink" | "white";
  maxVisible?: number;
}) {
  const { visible, windowed } = useMemo(() => {
    if (total <= maxVisible) {
      return { visible: Array.from({ length: total }, (_, i) => i), windowed: false };
    }
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, current - half);
    const end = Math.min(total - 1, start + maxVisible - 1);
    start = Math.max(0, end - maxVisible + 1);
    return {
      visible: Array.from({ length: end - start + 1 }, (_, i) => start + i),
      windowed: true,
    };
  }, [total, current, maxVisible]);

  const sizeFor = (real: number, pos: number) => {
    if (real === current) return { width: 24, height: 8 };
    if (!windowed) return { width: 8, height: 8 };
    const before = visible[0] > 0;
    const after = visible[visible.length - 1] < total - 1;
    if (pos === 0 && before) return { width: 4, height: 4 };
    if (pos === 1 && before) return { width: 6, height: 6 };
    if (pos === visible.length - 1 && after) return { width: 4, height: 4 };
    if (pos === visible.length - 2 && after) return { width: 6, height: 6 };
    return { width: 8, height: 8 };
  };

  const active = tone === "white" ? "#ffffff" : "var(--color-ink)";
  const idle = tone === "white" ? "rgba(255,255,255,0.4)" : "var(--color-line)";
  const hover = tone === "white" ? "rgba(255,255,255,0.7)" : "var(--color-faint)";

  return (
    <div className="flex items-center justify-center" role="tablist" aria-label={labelFor(current)}>
      {visible.map((real, pos) => {
        const isActive = real === current;
        const size = sizeFor(real, pos);
        return (
          <button
            key={real}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={labelFor(real)}
            onClick={() => onSelect(real)}
            className="group inline-flex min-h-[44px] min-w-[28px] items-center justify-center px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <motion.span
              layout
              initial={false}
              animate={{
                width: size.width,
                height: size.height,
                backgroundColor: isActive ? active : idle,
              }}
              whileHover={{ backgroundColor: isActive ? active : hover }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="block rounded-full"
            />
          </button>
        );
      })}
    </div>
  );
}