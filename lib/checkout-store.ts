import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Cash-on-delivery draft: the three fields the brief asks for, nothing else. */
export type CheckoutDraft = {
  name: string;
  phone: string;
  address: string;
};

export const emptyDraft: CheckoutDraft = { name: "", phone: "", address: "" };

type CheckoutState = CheckoutDraft & {
  /** Transient: order submission in flight, shared with the sheet footer CTA. */
  processing: boolean;
  patch: (value: Partial<CheckoutDraft>) => void;
  setProcessing: (processing: boolean) => void;
  reset: () => void;
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      ...emptyDraft,
      processing: false,
      patch: (value) => set(value),
      setProcessing: (processing) => set({ processing }),
      reset: () => set(emptyDraft),
    }),
    {
      name: "hanutek:v2:checkout",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ name: s.name, phone: s.phone, address: s.address }),
    },
  ),
);

export const checkoutStore = {
  get: useCheckoutStore.getState,
  subscribe: useCheckoutStore.subscribe,
  patch: (value: Partial<CheckoutDraft>) => useCheckoutStore.getState().patch(value),
  reset: () => useCheckoutStore.getState().reset(),
};

export function useCheckout(): CheckoutDraft {
  const name = useCheckoutStore((s) => s.name);
  const phone = useCheckoutStore((s) => s.phone);
  const address = useCheckoutStore((s) => s.address);
  return { name, phone, address };
}

/* ------------------------------------------------------------------ *
 * Validation. The only place the app trusts nothing: user input.
 * Codes map to messages under checkout.errors.<code>.
 * ------------------------------------------------------------------ */

export type FieldError = { code: "required" | "invalid" | "tooShort" };
export type ErrorMap = Partial<Record<keyof CheckoutDraft, FieldError>>;

const blank = (value: string) => value.trim().length === 0;
const digits = (value: string) => value.replace(/\D/g, "");

export const validators = {
  name: (v: string): FieldError | null =>
    blank(v) ? { code: "required" } : v.trim().length < 2 ? { code: "tooShort" } : null,

  phone: (v: string): FieldError | null =>
    blank(v)
      ? { code: "required" }
      : digits(v).length < 9 || digits(v).length > 13
        ? { code: "invalid" }
        : null,

  address: (v: string): FieldError | null =>
    blank(v) ? { code: "required" } : v.trim().length < 8 ? { code: "tooShort" } : null,
};

export const validateDraft = (draft: CheckoutDraft): ErrorMap => {
  const errors: ErrorMap = {};
  for (const field of ["name", "phone", "address"] as const) {
    const error = validators[field](draft[field]);
    if (error) errors[field] = error;
  }
  return errors;
};

/** Algerian mobile/landline: 0X XX XX XX XX, grouped on the way in. */
export const maskPhone = (value: string) =>
  digits(value)
    .slice(0, 10)
    .replace(/(\d{2})(?=\d)/g, "$1 ")
    .trimStart();