import { createStore, useStore } from "./store";

export type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  country: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  addresses: Address[];
};

type SessionState = { user: User | null };

const EMPTY: SessionState = { user: null };
const store = createStore<SessionState>(EMPTY, { persist: "session" });

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const isEmail = (value: string) => EMAIL.test(value.trim());

/** "imane.bennani" -> "Imane Bennani". Keeps the mock account believable. */
const nameFromEmail = (email: string) => {
  const local = email.trim().split("@")[0].replace(/\+.*$/, "");
  const words = local
    .replace(/[^a-zA-ZÀ-ÿ]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);
  if (words.length === 0) return "Client Hanutek";
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const seedAddress = (name: string): Address => ({
  id: "addr-1",
  label: "Maison",
  fullName: name,
  phone: "06 24 18 07 33",
  line1: "14 rue des Ateliers",
  line2: "Bât. B, appt. 12",
  postalCode: "75011",
  city: "Paris",
  country: "France",
});

export type LoginField = "email" | "password";
export type LoginError = { field: LoginField; code: "required" | "invalid" };
export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; errors: LoginError[] };

/**
 * Mock sign-in. There is no backend: any well-formed address plus a 6-character
 * password succeeds after a short delay, so the whole authenticated surface of
 * the app can be exercised. Every field is validated on each attempt so a form
 * with two problems reports two problems.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const errors: LoginError[] = [];
  if (!email.trim()) errors.push({ field: "email", code: "required" });
  else if (!isEmail(email)) errors.push({ field: "email", code: "invalid" });

  if (!password) errors.push({ field: "password", code: "required" });
  else if (password.length < 6) errors.push({ field: "password", code: "invalid" });

  await new Promise((resolve) => setTimeout(resolve, 700));
  if (errors.length > 0) return { ok: false, errors };

  const name = nameFromEmail(email);
  const seed = seedAddress(name);
  const user: User = {
    id: `u-${email.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18)}`,
    name,
    email: email.trim().toLowerCase(),
    phone: seed.phone,
    joinedAt: new Date().toISOString().slice(0, 10),
    addresses: [seed],
  };
  store.set({ user });
  return { ok: true, user };
}

export function saveAddress(address: Address) {
  const { user } = store.get();
  if (!user) return;
  const exists = user.addresses.some((a) => a.id === address.id);
  store.set({
    user: {
      ...user,
      addresses: exists
        ? user.addresses.map((a) => (a.id === address.id ? address : a))
        : [...user.addresses, address],
    },
  });
}

export function logout() {
  store.set(EMPTY);
}

export function useSession(): User | null {
  return useStore(store).user;
}
