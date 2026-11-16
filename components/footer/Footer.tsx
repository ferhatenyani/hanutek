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

/**
 * Light, three-zone footer: brand statement + newsletter, sitemap columns
 * (zero-JS accordion on phones), legal bar, and a dissolving wordmark.
 */
export default async function Footer() {
  const t = await getTranslations("footer");
  const locale = await getLocale();

  const columns = [
    {
      title: t("shop"),
      links: [
        { href: `/${locale}/products`, label: t("shopLinks.all") },
        { href: `/${locale}/products?cat=cameras`, label: t("shopLinks.new") },
        { href: `/${locale}/products`, label: t("shopLinks.best") },
        { href: `/${locale}/favorites`, label: t("shopLinks.gift") },
      ],
    },
    {
      title: t("help"),
      links: [
        { href: `/${locale}/products`, label: t("helpLinks.shipping") },
        { href: `/${locale}/profile`, label: t("helpLinks.returns") },
        { href: `/${locale}/products`, label: t("helpLinks.faq") },
        { href: `/${locale}/profile`, label: t("helpLinks.contact") },
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
    <footer
      className="relative isolate overflow-hidden bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Fade-in top divider, brighter at centre. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(11,13,16,0.12) 25%, rgba(11,13,16,0.12) 75%, transparent 100%)",
        }}
      />
      {/* Ambient blue wash, invisible until noticed. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(46,98,245,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        {/* Brand statement + newsletter */}
        <div className="grid gap-8 lg:grid-cols-[1fr_460px] lg:items-end lg:gap-16">
          <div className="max-w-xl">
            <Logo href={`/${locale}`} />
            <h2 className="display-cut mt-6 text-[26px] leading-[1.15] text-ink sm:text-[30px]">
              {t("newsTitle")}
            </h2>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted">
              {t("newsText")}
            </p>
          </div>
          <div className="rounded-panel border border-line bg-mist p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-deep rtl:tracking-normal">
              {t("news")}
            </p>
            <div className="mt-3">
              <FooterNewsletter />
            </div>
          </div>
        </div>

        <div className="mt-12 h-px w-full bg-ink/[0.06] sm:mt-14" />

        {/* Sitemap: accordion on phones, grid from sm up. */}
        <div className="mt-8 grid grid-cols-1 gap-2 sm:mt-12 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 lg:grid-cols-4">
          {columns.map((column) => (
            <details
              key={column.title}
              className="group border-b border-ink/[0.06] py-1 open:pb-3 sm:border-none sm:py-0 sm:open:pb-0"
            >
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-1.5 rounded-control px-2 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-mist sm:pointer-events-none sm:px-0 sm:hover:bg-transparent [&::-webkit-details-marker]:hidden">
                <span>{column.title}</span>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180 sm:hidden"
                >
                  <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <ul className="mt-2 flex flex-col gap-0.5 sm:mt-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group/link flex min-h-[40px] items-center justify-between gap-3 rounded-control px-2 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-mist hover:text-ink"
                    >
                      <span className="truncate">{link.label}</span>
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 -translate-x-0.5 text-faint opacity-60 transition-all duration-150 group-hover/link:translate-x-0 group-hover/link:text-blue group-hover/link:opacity-100 rtl:-scale-x-100"
                      >
                        <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
        {/* Force the accordion open from sm up without JS. */}
        <style>{`
          @media (min-width: 640px) {
            footer details > ul { display: block; }
          }
        `}</style>

        {/* Legal bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-ink/[0.06] pt-6 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:flex-row sm:items-center sm:justify-between lg:pb-8">
          <p className="text-[12px] text-faint">© 2026 Hanutek. {t("rights")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-control border border-line bg-mist px-2.5 py-1 text-[11px] font-semibold text-muted">
              {t("codBadge")}
            </span>
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={`/${locale}`}
                aria-label={social.name}
                className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-muted transition-colors hover:border-ink/25 hover:bg-mist hover:text-ink"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Dissolving wordmark */}
        <div
          aria-hidden="true"
          className="pointer-events-none relative select-none overflow-hidden"
          style={{ height: "clamp(56px, 12vw, 160px)" }}
        >
          <span
            className="absolute inset-x-0 top-0 block whitespace-nowrap bg-clip-text text-center text-transparent"
            style={{
              fontSize: "clamp(72px, 18vw, 240px)",
              lineHeight: 0.9,
              fontWeight: 800,
              letterSpacing: "-0.06em",
              backgroundImage:
                "linear-gradient(180deg, rgba(11,13,16,0.06) 0%, rgba(11,13,16,0.02) 55%, rgba(11,13,16,0) 100%)",
            }}
          >
            HANUTEK
          </span>
        </div>
      </div>
    </footer>
  );
}