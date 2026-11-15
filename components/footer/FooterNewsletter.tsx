"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function FooterNewsletter() {
  const t = useTranslations("footer");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p
        role="status"
        className="flex items-center gap-2.5 rounded-xl border border-success/25 bg-success/10 px-4 py-3.5 text-sm font-medium text-success"
      >
        <CheckCircle size={18} weight="fill" aria-hidden="true" />
        {t("thanks")}
      </p>
    );
  }

  return (
    <form
      className="flex min-w-0 flex-col gap-2.5 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <label className="sr-only" htmlFor="newsletter-email">
        {t("placeholder")}
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        placeholder={t("placeholder")}
        className="h-12 w-full min-w-0 shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-slate-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 sm:flex-1"
      />
      <button
        type="submit"
        className="h-12 w-full shrink-0 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-deep active:scale-[0.99] sm:w-auto"
      >
        {t("submit")}
      </button>
    </form>
  );
}