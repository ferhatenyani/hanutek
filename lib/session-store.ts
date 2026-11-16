import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  provider: "password" | "google";
};

type SessionState = {
  user: User | null;
  signIn: (user: User) => void;
  signOut: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
    }),
    {
      name: "hanutek:v2:session",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ user: s.user }),
    },
  ),
);

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

export type LoginField = "email" | "password";
export type LoginError = { field: LoginField; code: "required" | "invalid" };
export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; errors: LoginError[] };

const makeUser = (email: string, provider: User["provider"]): User => ({
  id: `u-${email.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18)}`,
  name: nameFromEmail(email),
  email: email.trim().toLowerCase(),
  phone: "05 60 12 34 56",
  joinedAt: new Date().toISOString().slice(0, 10),
  provider,
});

/**
 * Mock sign-in. There is no backend: any well-formed address plus a 6-character
 * password succeeds after a short delay, so the whole authenticated surface of
 * the app can be exercised.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const errors: LoginError[] = [];
  if (!email.trim()) errors.push({ field: "email", code: "required" });
  else if (!isEmail(email)) errors.push({ field: "email", code: "invalid" });

  if (!password) errors.push({ field: "password", code: "required" });
  else if (password.length < 6) errors.push({ field: "password", code: "invalid" });

  await new Promise((resolve) => setTimeout(resolve, 600));
  if (errors.length > 0) return { ok: false, errors };

  const user = makeUser(email, "password");
  useSessionStore.getState().signIn(user);
  return { ok: true, user };
}

/** Mock Google sign-in: same local session, believable Google profile. */
export async function loginWithGoogle(): Promise<LoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const user = makeUser("imane.bennani@gmail.com", "google");
  user.name = "Imane Bennani";
  useSessionStore.getState().signIn(user);
  return { ok: true, user };
}

export function logout() {
  useSessionStore.getState().signOut();
}

export function useSession(): User | null {
  return useSessionStore((s) => s.user);
}