import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import FooterNewsletter from "./FooterNewsletter";

const SOCIALS = [
  {
    name: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[17px] w-[17px]" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden="true">
        <path d="M15 3h-3a4 4 0 0 0-4 4v3H5v3h3v8h3v-8h3l1-3h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: "X",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px]" aria-hidden="true">
        <path d="M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.4L6.2 22H3l7.3-8.4L1 2h6.4l4.4 5.9L18.9 2z" />
      </svg>
    ),
  },
];

const linkClass =
  "inline-block py-2.5 text-sm text-slate-400 transition-colors hover:text-white";
const headingClass =
  "text-xs font-semibold uppercase tracking-[0.14em] text-white rtl:tracking-normal";

const PAYMENTS = ["Visa", "Mastercard", "PayPal", "Apple Pay"];

export default async function Footer() {
  const t = await getTranslations("footer");
  const locale = await getLocale();

  const columns = [
    {
      title: t("shop"),
      links: [
        { href: `/${locale}#selection`, label: t("shopLinks.all") },
        { href: `/${locale}#selection`, label: t("shopLinks.new") },
        { href: `/${locale}#selection`, label: t("shopLinks.best") },
        { href: `/${locale}#selection`, label: t("shopLinks.gift") },
      ],
    },
    {
      title: t("help"),
      links: [
        { href: `/${locale}`, label: t("helpLinks.shipping") },
        { href: `/${locale}`, label: t("helpLinks.returns") },
        { href: `/${locale}`, label: t("helpLinks.faq") },
        { href: `/${locale}`, label: t("helpLinks.contact") },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: `/${locale}`, label: t("companyLinks.about") },
        { href: `/${locale}`, label: t("companyLinks.careers") },
        { href: `/${locale}`, label: t("companyLinks.partners") },
        { href: `/${locale}`, label: t("companyLinks.press") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: `/${locale}`, label: t("legalLinks.privacy") },
        { href: `/${locale}`, label: t("legalLinks.terms") },
        { href: `/${locale}`, label: t("legalLinks.cookies") },
        { href: `/${locale}`, label: t("legalLinks.notice") },
      ],
    },
  ];

  return (
    <footer className="mt-0 bg-obsidian text-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 border-b border-white/10 py-12 lg:grid-cols-[1fr_460px] lg:items-center lg:gap-16 lg:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary rtl:tracking-normal">
              {t("news")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t("newsTitle")}
            </h2>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-slate-400">
              {t("newsText")}
            </p>
          </div>
          <FooterNewsletter />
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-16">
          <div className="sm:col-span-2 lg:col-span-4">
            <Logo href={`/${locale}`} tone="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              {t("tagline")}
            </p>
            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={`/${locale}`}
                  aria-label={social.name}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:col-span-2 lg:col-span-8 lg:grid-cols-4 lg:gap-8">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className={headingClass}>{column.title}</h3>
                <ul className="mt-4">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 pb-[calc(env(safe-area-inset-bottom)+7rem)] sm:flex-row sm:items-center sm:justify-between lg:pb-6">
          <p className="text-xs text-slate-400">
            © 2026 Hanutek. {t("rights")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="me-1 text-[11px] uppercase tracking-[0.12em] text-slate-400 rtl:tracking-normal">
              {t("payments")}
            </span>
            {PAYMENTS.map((payment) => (
              <span
                key={payment}
                className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-slate-400"
              >
                {payment}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}