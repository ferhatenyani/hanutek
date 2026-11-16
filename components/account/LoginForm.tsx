"use client";

import { Eye, EyeSlash, LockKey } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Spinner } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import Logo from "@/components/ui/Logo";
import { login, loginWithGoogle } from "@/lib/session-store";
import { toastStore } from "@/lib/toast-store";

type Errors = { email?: string; password?: string };

/** Official multicolour Google "G" mark. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/** One centred column, mobile-first: Google first, then the email fallback. */
export default function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const submit = async () => {
    setErrors({});
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.ok) {
      setErrors(
        Object.fromEntries(
          result.errors.map((error) => [
            error.field,
            t(`errors.${error.code}` as "errors.required"),
          ]),
        ) as Errors,
      );
      return;
    }
    toastStore.push({ message: t("welcome", { name: result.user.name }), tone: "success" });
    router.push(`/${locale}${next}`);
  };

  const google = async () => {
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (result.ok) {
      toastStore.push({ message: t("welcome", { name: result.user.name }), tone: "success" });
      router.push(`/${locale}${next}`);
    }
  };

  return (
    <div className="min-h-[70dvh] bg-white">
      <div className="mx-auto flex w-full max-w-[440px] flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-8 sm:px-0 sm:pt-12 lg:pb-20">
        <div className="flex justify-center">
          <Logo href={`/${locale}`} markSize={34} />
        </div>

        <div className="mt-7 rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7">
          <h1 className="display-cut text-center text-[24px] leading-tight text-ink sm:text-[28px]">
            {t("title")}
          </h1>
          <p className="mt-2 text-center text-[13px] leading-relaxed text-muted">{t("body")}</p>

          <button
            type="button"
            data-testid="google-login"
            onClick={google}
            disabled={googleLoading || loading}
            className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-control border border-line bg-white text-[14px] font-semibold text-ink transition-colors hover:bg-mist disabled:opacity-60"
          >
            {googleLoading ? <Spinner /> : <GoogleMark />}
            {t("google")}
          </button>

          <div className="mt-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
              {t("or")}
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form
            data-testid="login-form"
            className="mt-5 flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            noValidate
          >
            <TextInput
              id="login-email"
              label={t("email")}
              type="email"
              value={email}
              onChange={setEmail}
              error={errors.email}
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              placeholder="prenom@exemple.dz"
            />

            <TextInput
              id="login-password"
              label={t("password")}
              type={reveal ? "text" : "password"}
              value={password}
              onChange={setPassword}
              error={errors.password}
              hint={t("passwordHint")}
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setReveal((value) => !value)}
                  aria-label={reveal ? t("hidePassword") : t("showPassword")}
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-mist hover:text-ink"
                >
                  {reveal ? <EyeSlash size={17} /> : <Eye size={17} />}
                </button>
              }
            />

            <Button
              type="submit"
              size="lg"
              block
              loading={loading}
              className="mt-1"
              leading={<LockKey size={16} weight="fill" aria-hidden="true" />}
            >
              {t("submit")}
            </Button>
          </form>

          <p className="mt-4 rounded-control bg-mist px-3.5 py-3 text-[11.5px] leading-relaxed text-muted">
            {t("demoNote")}
          </p>
        </div>

        <p className="mt-4 text-center text-[11.5px] leading-relaxed text-faint">{t("secureNote")}</p>
      </div>
    </div>
  );
}