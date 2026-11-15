"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Closing a sheet means leaving the route that opened it. Browser history
 * almost always has the previous page; the fallback covers a sheet that was
 * opened as the first entry in a fresh tab.
 */
export default function useCloseSheet(fallback: string) {
  const router = useRouter();
  const target = useRef(fallback);

  useEffect(() => {
    target.current = fallback;
  }, [fallback]);

  return useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push(target.current);
  }, [router]);
}
