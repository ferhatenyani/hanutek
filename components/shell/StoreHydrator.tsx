"use client";

import { useEffect } from "react";
import { hydrateStores } from "@/lib/hydrate-stores";

/** Restores persisted Zustand stores once, after the first paint. */
export default function StoreHydrator() {
  useEffect(() => {
    hydrateStores();
  }, []);
  return null;
}