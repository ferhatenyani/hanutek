"use client";

import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import PaginationDots from "@/components/ui/PaginationDots";
import { formatDA } from "@/lib/money";
import type { Product } from "@/lib/products";

/**
 * One home section: ruled header with a see-more arrow, a snap-scrolling rail
 * of cards, and windowed dots + prev/next controls beneath.
 */
export default function HomeRail({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: Product[];
}) {
  const t = useTranslations("products");
  const th = useTranslations("home");
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [index, setIndex] = useState(0);
  const [edges, setEdges] = useState({ left: false, right: true });

  // Coalesce scroll events into one measurement per frame.
  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(measure);
  };

  const measure = () => {
    const node = scrollRef.current;
    if (!node) return;
    const card = node.firstElementChild as HTMLElement | null;
    if (!card) return;
    const gap = parseFloat(getComputedStyle(node).columnGap || "0") || 0;
    const step = card.offsetWidth + gap;
    const max = node.scrollWidth - node.clientWidth;
    setIndex(Math.max(0, Math.min(items.length - 1, Math.round(node.scrollLeft / step))));
    setEdges({ left: node.scrollLeft > 4, right: node.scrollLeft < max - 4 });
  };

  useEffect(() => {
    measure();
    const node = scrollRef.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const scrollTo = (target: number) => {
    const node = scrollRef.current;
    if (!node) return;
    const card = node.firstElementChild as HTMLElement | null;
    if (!card) return;
    const gap = parseFloat(getComputedStyle(node).columnGap || "0") || 0;
    const step = card.offsetWidth + gap;
    const max = node.scrollWidth - node.clientWidth;
    const left =
      target === 0
        ? 0
        : target === items.length - 1
          ? max
          : Math.max(0, Math.min(max, target * step - (node.clientWidth - card.offsetWidth) / 2));
    node.scrollTo({ left, behavior: "smooth" });
  };

  const nudge = (direction: -1 | 1) => {
    const node = scrollRef.current;
    if (!node) return;
    const card = node.firstElementChild as HTMLElement | null;
    if (!card) return;
    const gap = parseFloat(getComputedStyle(node).columnGap || "0") || 0;
    node.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  };

  return (
    <section className="mt-12 first:mt-0">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
        <div className="min-w-0">
          <h2 className="display-cut text-[22px] leading-tight text-ink sm:text-[26px]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-[13px] leading-snug text-muted">{subtitle}</p>
          )}
        </div>
        <Link
          href={`/${locale}/products`}
          className="group inline-flex shrink-0 items-center gap-1 pb-0.5 text-[13px] font-semibold text-muted transition-colors hover:text-ink"
        >
          {th("seeMore")}
          <ArrowRight
            size={14}
            weight="bold"
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
          />
        </Link>
      </div>

      <div className="relative -mx-4 mt-5 sm:-mx-6 lg:-mx-8">
        <div
          ref={scrollRef}
          data-testid="rail-scroll"
          onScroll={onScroll}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:gap-4 sm:px-6 lg:px-8"
        >
          {items.map((product) => (
            <div
              key={product.id}
              className="w-[46%] shrink-0 snap-start min-[480px]:w-[38%] sm:w-[236px] lg:w-[264px]"
            >
              <ProductCard
                product={product}
                title={t(`items.${product.id}.title` as "items.p1.title")}
                price={formatDA(product.price, locale)}
                oldPrice={product.oldPrice ? formatDA(product.oldPrice, locale) : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="flex-1" />
        <div className="flex flex-1 justify-center">
          <PaginationDots
            total={items.length}
            current={index}
            onSelect={scrollTo}
            labelFor={(i) => th("railDot", { index: i + 1, total: items.length })}
          />
        </div>
        <div className="flex flex-1 justify-end gap-2">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={!edges.left}
            aria-label={th("railPrev")}
            className="flex h-9 w-9 items-center justify-center rounded-control border border-line bg-white text-ink transition-colors hover:border-ink/30 disabled:cursor-not-allowed disabled:text-line rtl:-scale-x-100"
          >
            <CaretLeft size={15} weight="bold" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            disabled={!edges.right}
            aria-label={th("railNext")}
            className="flex h-9 w-9 items-center justify-center rounded-control border border-line bg-white text-ink transition-colors hover:border-ink/30 disabled:cursor-not-allowed disabled:text-line rtl:-scale-x-100"
          >
            <CaretRight size={15} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}