import { useSyncExternalStore } from "react";

const NAMESPACE = "hanutek:v1:";

type Listener = () => void;

export type Store<T> = {
  /** Current client state. Never call this during render without useStore. */
  get: () => T;
  /** State React sees while the document has not hydrated yet. */
  getServer: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: Listener) => () => void;
  reset: () => void;
};

const canPersist = () => typeof window !== "undefined";

function read<T>(key: string): T | null {
  if (!canPersist()) return null;
  try {
    const raw = window.localStorage.getItem(NAMESPACE + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T) {
  if (!canPersist()) return;
  try {
    window.localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
  } catch {
    /* Private mode or a full quota must never break the shopping flow. */
  }
}

/**
 * Tiny external store with optional localStorage persistence.
 *
 * `getServer` always returns the pristine initial value, so server markup and
 * the first client paint agree; the real state lands in the post-hydration
 * render. Values are replaced immutably, which keeps `getSnapshot` stable.
 */
export function createStore<T>(
  initial: T,
  options: { persist?: string } = {},
): Store<T> {
  const key = options.persist;
  const restored = key ? read<T>(key) : null;
  let state: T = restored ?? initial;
  const listeners = new Set<Listener>();

  const emit = () => {
    if (key) write(key, state);
    for (const listener of listeners) listener();
  };

  return {
    get: () => state,
    getServer: () => initial,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(state) : next;
      if (resolved === state) return;
      state = resolved;
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset: () => {
      state = initial;
      emit();
    },
  };
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}
