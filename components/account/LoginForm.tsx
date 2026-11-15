"use client";

import { Eye, EyeSlash, LockKey, ShieldCheck, Sparkle, Star } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { login } from "@/lib/session-store";
import { toastStore } from "@/lib/toast-store";

type Errors = { email?: string; password?: string };

export default function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const benefits = [t("aside.1"), t("aside.2"), t("aside.3")];

  return (
    <div className="min-h-[70dvh] bg-mist">
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
        <Link
          href={`/${locale}`}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white px-3.5 py-2 text-[11.5px] font-semibold text-muted shadow-soft transition-colors hover:text-ink"
        >
          ← {t("backToShop")}
        </Link>

        <div className="grid overflow-hidden rounded-sheet border border-hairline bg-white shadow-pop lg:grid-cols-[minmax(0,1fr)_440px]">
          {/* Form ------------------------------------------------------ */}
          <div className="px-5 py-7 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-deep rtl:tracking-normal">
              <Sparkle size={12} weight="fill" aria-hidden="true" />
              {t("eyebrow")}
            </span>

            <h1 className="display-cut mt-3 text-[28px] leading-[1.1] text-ink sm:text-[34px]">
              {t("title")}
            </h1>
            <p className="mt-2.5 max-w-[44ch] text-[14px] leading-relaxed text-muted">
              {t("body")}
            </p>

            <form
              data-testid="login-form"
              className="mt-7 flex max-w-[420px] flex-col gap-4"
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
                placeholder="prenom@exemple.fr"
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
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-mist hover:text-ink"
                  >
                    {reveal ? <EyeSlash size={17} /> : <Eye size={17} />}
                  </button>
                }
              />

              <Button
                type="submit"
                size="lg"
                shape="pill"
                block
                loading={loading}
                className="mt-1"
                leading={<LockKey size={16} weight="fill" aria-hidden="true" />}
              >
                {t("submit")}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                <ShieldCheck size={12} aria-hidden="true" />
                {t("secureNote")}
              </p>
            </form>

            <p className="mt-5 max-w-[420px] rounded-soft-sm bg-brand-tint px-3.5 py-3 text-[11.5px] leading-relaxed text-muted">
              {t("demoNote")}
            </p>
          </div>

          {/* Brand panel ----------------------------------------------- */}
          <aside className="relative hidden overflow-hidden bg-ink lg:block lg:[border-end-end-radius:28px] lg:[border-start-end-radius:28px]">
            <Image
              src="/assets/products/p9.jpg"
              alt=""
              fill
              sizes="440px"
              className="object-cover opacity-60"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
            <div className="relative flex h-full flex-col justify-end p-7 text-white">
              <span className="flex w-fit items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[10.5px] font-semibold backdrop-blur">
                <Star size={11} weight="fill" aria-hidden="true" className="text-[#ffd66b]" />
                4,8 · 2 400 avis
              </span>
              <h2 className="mt-3 text-[24px] font-semibold leading-tight tracking-[-0.02em]">
                {t("asideTitle")}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {benefits.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[12.5px] leading-snug text-white/80">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-3 lg:hidden">
          {benefits.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2.5 rounded-soft border border-hairline bg-white px-3.5 py-3 text-[12px] leading-snug text-ink shadow-soft"
            >
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}