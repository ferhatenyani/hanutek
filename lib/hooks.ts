"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const noSubscribe = () => () => {};

/**
 * False on the server and during hydration, true after mount. Implemented as a
 * store so React swaps the snapshot without an extra render triggered from an
 * effect.
 */
export const useMounted = () =>
  useSyncExternalStore(noSubscribe, () => true, () => false);

/**
 * Reads the query synchronously on the client. Safe for components that only
 * ever mount after hydration (sheets, overlays); never use it in server-rendered
 * markup, where the first paint would disagree with the document.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const usePrefersReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");

let lockCount = 0;
let savedScrollY = 0;

/**
 * Blocks background scrolling while an overlay is open.
 *
 * `overflow: hidden` on the root is what actually stops wheel, keyboard and
 * touch scrolling behind the sheet; the scroll offset is remembered so the
 * page lands exactly where it was when the sheet closes. Reference counted,
 * because a sheet can open on top of another overlay.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;

    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      root.classList.add("sheet-open");
    }
    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        root.classList.remove("sheet-open");
        if (window.scrollY !== savedScrollY) window.scrollTo(0, savedScrollY);
      }
    };
  }, [active]);
}

/** Scrim handler: swallows wheel/touch gestures that would scroll the page. */
export const blockBackgroundGesture = (event: { preventDefault: () => void }) => {
  event.preventDefault();
};

const FOCUSABLE =
  "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])";

/**
 * Everything a modal surface needs from the document: focus moves in on open
 * and back out on close, Tab stays inside, Escape dismisses.
 */
export function useDialog<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  // Latest-callback ref, written in an effect so the listeners below are bound
  // once rather than on every render of the sheet body.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFrame = requestAnimationFrame(() => {
      const target =
        node.querySelector<HTMLElement>("[data-autofocus]") ??
        node.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? node).focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement;

      if (event.shiftKey && (activeEl === first || !node.contains(activeEl))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      node.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [active]);

  return ref;
}
