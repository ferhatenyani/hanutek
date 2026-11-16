"use client";

import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { isEmail } from "@/lib/session-store";

/** Newsletter block in the light footer aesthetic: mist card, blue action. */
export default function FooterNewsletter() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p
        role="status"
        className="flex items-center gap-2.5 rounded-control border border-success/25 bg-success-soft px-4 py-3.5 text-sm font-medium text-success"
      >
        <CheckCircle size={18} weight="fill" aria-hidden="true" />
        {t("thanks")}
      </p>
    );
  }

  return (
    <form
      className="flex min-w-0 flex-col gap-2.5 sm:flex-row"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!isEmail(email)) {
          setError(true);
          return;
        }
        setError(false);
        setSubmitted(true);
      }}
    >
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor="newsletter-email">
          {t("placeholder")}
        </label>
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(false);
          }}
          placeholder={t("placeholder")}
          aria-invalid={error || undefined}
          aria-describedby={error ? "newsletter-error" : undefined}
          className={`h-12 w-full rounded-control border bg-white px-4 text-sm text-ink transition-colors placeholder:text-faint focus:outline-none focus-visible:ring-4 focus-visible:ring-blue/10 ${
            error ? "border-sale" : "border-line hover:border-muted/40 focus:border-blue/50"
          }`}
        />
        {error && (
          <p id="newsletter-error" role="alert" className="mt-1.5 text-[12px] font-medium text-sale">
            {t("invalidEmail")}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-control bg-blue px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-deep active:scale-[0.99]"
      >
        {t("submit")}
        <ArrowRight
          size={15}
          weight="bold"
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        />
      </button>
    </form>
  );
}