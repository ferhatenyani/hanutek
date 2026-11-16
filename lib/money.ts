/** Algerian dinar, the only currency in the app. Whole dinars, "DA" symbol. */
export function formatDA(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    style: "currency",
    currency: "DZD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(value);
}