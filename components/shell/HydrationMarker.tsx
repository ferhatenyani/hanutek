"use client";

import { useEffect } from "react";

/**
 * Marks the document as hydrated.
 *
 * The storefront is static markup that only becomes interactive after React
 * attaches its handlers, and `networkidle` is an unreliable proxy for that
 * moment because the router keeps prefetching in the background. This gives
 * both the e2e suite and any future integration a single, exact signal.
 */
export default function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);

  return null;
}
