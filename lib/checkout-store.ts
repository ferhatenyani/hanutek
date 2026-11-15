import { createStore, useStore } from "./store";
import { isEmail } from "./session-store";
import type { ShippingMethod } from "./products";

export type CheckoutDraft = {
  contact: { email: string; firstName: string; lastName: string; phone: string };
  shipping: {
    method: ShippingMethod;
    line1: string;
    line2: string;
    postalCode: string;
    city: string;
    country: string;
    note: string;
  };
  payment: { holder: string; card: string; expiry: string; cvc: string };
  remember: boolean;
  promo: string | null;
  step: number;
};

export const emptyDraft: CheckoutDraft = {
  contact: { email: "", firstName: "", lastName: "", phone: "" },
  shipping: {
    method: "standard",
    line1: "",
    line2: "",
    postalCode: "",
    city: "",
    country: "France",
    note: "",
  },
  payment: { holder: "", card: "", expiry: "", cvc: "" },
  remember: true,
  promo: null,
  step: 0,
};

const store = createStore<CheckoutDraft>(emptyDraft, { persist: "checkout" });

export type DraftSection = "contact" | "shipping" | "payment";

export const checkoutStore = {
  get: () => store.get(),
  subscribe: store.subscribe,

  patch<K extends DraftSection>(section: K, value: Partial<CheckoutDraft[K]>) {
    const state = store.get();
    store.set({ ...state, [section]: { ...state[section], ...value } });
  },

  setStep(step: number) {
    store.set({ ...store.get(), step });
  },

  setPromo(promo: string | null) {
    store.set({ ...store.get(), promo });
  },

  /** Prefills the draft from a saved address book entry. */
  useAddress(address: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string;
    postalCode: string;
    city: string;
    country: string;
  }) {
    const state = store.get();
    const [firstName = "", lastName = ""] = address.fullName.trim().split(/\s+/);
    store.set({
      ...state,
      contact: {
        ...state.contact,
        firstName: state.contact.firstName || firstName,
        lastName: state.contact.lastName || lastName,
        phone: state.contact.phone || address.phone,
      },
      shipping: {
        ...state.shipping,
        line1: address.line1,
        line2: address.line2,
        postalCode: address.postalCode,
        city: address.city,
        country: address.country,
      },
    });
  },

  reset() {
    store.set(emptyDraft);
  },
};

export function useCheckout(): CheckoutDraft {
  return useStore(store);
}

/* ------------------------------------------------------------------ *
 * Validation. The only place the app trusts nothing: user input.
 * Codes map to messages under checkout.errors.<code>.
 * ------------------------------------------------------------------ */

export type FieldError = { code: "required" | "invalid" | "past" | "tooShort" };
export type ErrorMap = Partial<Record<string, FieldError>>;

const blank = (value: string) => value.trim().length === 0;
const digits = (value: string) => value.replace(/\D/g, "");

export const validators = {
  email: (v: string): FieldError | null =>
    blank(v) ? { code: "required" } : isEmail(v) ? null : { code: "invalid" },

  name: (v: string): FieldError | null =>
    blank(v) ? { code: "required" } : v.trim().length < 2 ? { code: "tooShort" } : null,

  phone: (v: string): FieldError | null =>
    blank(v)
      ? { code: "required" }
      : digits(v).length < 8 || digits(v).length > 15
        ? { code: "invalid" }
        : null,

  line1: (v: string): FieldError | null => (blank(v) ? { code: "required" } : null),

  postalCode: (v: string): FieldError | null =>
    blank(v)
      ? { code: "required" }
      : !/^[0-9]{4,6}$/.test(v.trim().replace(/\s/g, ""))
        ? { code: "invalid" }
        : null,

  city: (v: string): FieldError | null => (blank(v) ? { code: "required" } : null),

  holder: (v: string): FieldError | null => (blank(v) ? { code: "required" } : null),

  card: (v: string): FieldError | null => {
    if (blank(v)) return { code: "required" };
    const length = digits(v).length;
    return length === 16 || length === 15 ? null : { code: "invalid" };
  },

  expiry: (v: string): FieldError | null => {
    if (blank(v)) return { code: "required" };
    const match = /^(\d{2})\/(\d{2})$/.exec(v.trim());
    if (!match) return { code: "invalid" };
    const month = Number(match[1]);
    if (month < 1 || month > 12) return { code: "invalid" };
    const now = new Date();
    const year = 2000 + Number(match[2]);
    return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)
      ? { code: "past" }
      : null;
  },

  cvc: (v: string): FieldError | null =>
    blank(v)
      ? { code: "required" }
      : digits(v).length < 3 || digits(v).length > 4
        ? { code: "invalid" }
        : null,
};

const STEP_FIELDS: Record<number, [string, keyof typeof validators][]> = {
  0: [
    ["email", "email"],
    ["firstName", "name"],
    ["lastName", "name"],
    ["phone", "phone"],
  ],
  1: [
    ["line1", "line1"],
    ["postalCode", "postalCode"],
    ["city", "city"],
  ],
  2: [
    ["holder", "holder"],
    ["card", "card"],
    ["expiry", "expiry"],
    ["cvc", "cvc"],
  ],
};

export const validateStep = (draft: CheckoutDraft, step: number): ErrorMap => {
  const section: Record<string, unknown> =
    step === 0 ? draft.contact : step === 1 ? draft.shipping : draft.payment;
  const errors: ErrorMap = {};
  for (const [field, rule] of STEP_FIELDS[step] ?? []) {
    const error = validators[rule](String(section[field] ?? ""));
    if (error) errors[field] = error;
  }
  return errors;
};

/* ------------------------------------------------------------------ *
 * Input masks. Formatting happens on the way in so the stored value is
 * always the canonical one (16 digits, MM/YY, 3 digits).
 * ------------------------------------------------------------------ */

export const maskCard = (value: string) =>
  digits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

export const maskExpiry = (value: string) => {
  const raw = digits(value).slice(0, 4);
  return raw.length <= 2 ? raw : `${raw.slice(0, 2)}/${raw.slice(2)}`;
};

export const maskPhone = (value: string) =>
  digits(value)
    .slice(0, 10)
    .replace(/(\d{2})(?=\d)/g, "$1 ")
    .trimStart();
