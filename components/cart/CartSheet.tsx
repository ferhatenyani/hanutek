"use client";

import CartPanel from "@/components/cart/CartPanel";
import Sheet from "@/components/ui/Sheet";
import { ButtonLink } from "@/components/ui/Button";
import { cartTotals, useCart } from "@/lib/cart-store";
import { useCheckout } from "@/lib/checkout-store";
import useCloseSheet from "@/lib/use-close-sheet";
import { ArrowRight, LockKey } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";

export default function CartSheet() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const close = useCloseSheet(`/${locale}/products`);
  const cart = useCart();
  const draft = useCheckout();
  const count = cart.lines.reduce((sum, line) => sum + line.qty, 0);
  const total = cartTotals(cart, draft.shipping.method, draft.promo).total;
  const money = new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <Sheet
      title={t("title")}
      eyebrow={count > 0 ? t("count", { count }) : undefined}
      placement="panel"
      onClose={close}
      footer={
        count > 0 ? (
          <div className="px-4 py-3.5 sm:px-5">
            <ButtonLink
              href={`/${locale}/checkout`}
              shape="pill"
              size="xl"
              block
              trailing={
                <ArrowRight
                  size={16}
                  weight="bold"
                  aria-hidden="true"
                  className="rtl:rotate-180"
                />
              }
            >
              {t("checkout")} · {money.format(total)}
            </ButtonLink>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[10.5px] text-muted">
              <LockKey size={11} aria-hidden="true" />
              {t("secureNote")}
            </p>
          </div>
        ) : undefined
      }
    >
      <div className="px-4 pb-8 pt-2 sm:px-5">
        <CartPanel layout="sheet" />
      </div>
    </Sheet>
  );
}