import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";
import AppDock from "@/components/shell/AppDock";
import Footer from "@/components/footer/Footer";
import HydrationMarker from "@/components/shell/HydrationMarker";
import Navbar from "@/components/navbar/Navbar";
import Toaster from "@/components/ui/Toaster";
import "../globals.css";

const generalSans = localFont({
  src: [
    { path: "../fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/GeneralSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  modal,
  params,
}: {
  children: React.ReactNode;
  /** Parallel slot: intercepted routes render here as sliding sheets. */
  modal?: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${generalSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-obsidian">
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-control focus:bg-obsidian focus:px-4 focus:py-2.5 focus:text-[13px] focus:font-semibold focus:text-white"
          >
            {t("skipToContent")}
          </a>

          {/* The dock and the bar read the URL, so they stream in behind a
              boundary rather than blocking the prerender of every route. */}
          <Suspense fallback={<TopBarSkeleton />}>
            <Navbar />
          </Suspense>

          <main id="main" className="flex-1">
            {children}
          </main>

          <Footer />

          <Suspense fallback={null}>
            <AppDock />
            {modal}
            <Toaster />
            {/* Inside the boundary on purpose: the marker must only fire once
                the shared chrome has actually rendered, not merely hydrated. */}
            <HydrationMarker />
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

/** Same height as the real bar, so streaming it in cannot shift the layout. */
function TopBarSkeleton() {
  return (
    <header className="sticky top-0 z-[var(--z-appbar)] border-b border-transparent bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:h-16 sm:px-6 lg:h-[72px] lg:px-8">
        <span className="h-7 w-7 shrink-0 rounded-full bg-well" />
        <span className="h-4 w-24 rounded-full bg-well" />
        <span className="ms-2 hidden h-10 w-40 rounded-full bg-well lg:block" />
        <span className="ms-auto hidden h-11 w-[300px] rounded-full bg-well lg:block" />
        <span className="ms-auto h-10 w-10 rounded-full bg-well lg:ms-0" />
        <span className="hidden h-10 w-28 rounded-full bg-well lg:block" />
      </div>
    </header>
  );
}
