# Hanutek storefront

Mobile-first storefront for automotive accessories and car gadgets, in French and
Arabic. Front-end only: there is no backend, no database and no payment call.
Cart, favourites, session, checkout draft and orders live in `localStorage`.

## Commands

```bash
pnpm dev              # development server
pnpm build            # production build (type checks as part of the build)
pnpm start            # serve the production build
pnpm lint             # eslint
pnpm exec tsc --noEmit  # type check only
node scripts/check-messages.mjs   # every translation key resolves in both locales
pnpm test:e2e         # Playwright suite (builds nothing; expects `pnpm build` first)
```

The e2e suite owns its server: `playwright.config.ts` starts `next start -p 3100`
and never reuses an outside process, because a rebuild replaces the chunks an
older server is still serving.

## Routes

| Path | Surface |
| --- | --- |
| `/{locale}` | Home: hero, category browse, 8 curated products, service band |
| `/{locale}/products` | Full catalogue with search, category, price, rating, stock and sort facets |
| `/{locale}/product/{id}` | Product detail. Opens as a sliding sheet on in-app navigation, as a full page on direct load |
| `/{locale}/cart` | Cart. Sheet on in-app navigation, full page on direct load |
| `/{locale}/checkout` | Three-step checkout: coordonnées, livraison, paiement |
| `/{locale}/order/{ref}` | Order confirmation |
| `/{locale}/favorites` | Saved products |
| `/{locale}/login` | Mock sign-in |
| `/{locale}/profile` | Account: orders, addresses, shortcuts |

The sheet behaviour is real routing, not client state. `app/[locale]/@modal` is a
parallel slot whose `(.)product/[id]` and `(.)cart` intercepting routes render the
sheet, so the URL changes, the browser back button dismisses it, and a hard load
or a shared link gets the standalone page.

## Design system

Tokens live in `app/globals.css` under `@theme`, sourced from
`hanutek_graphic_chart_brand_system.html` at the workspace root.

- **Colour**: neutral slate/obsidian canvas with one brand accent, `#2563eb`.
  `obsidian` carries every primary action; `sale` is price and promo only;
  `success-deep` is the AA-safe green for confirmations.
- **Shape scale**, applied as one rule: `rounded-card` (4px) for cards,
  `rounded-control` (3px) for buttons, inputs and chips, `rounded-panel` (20px)
  for sheets and hero panels, `rounded-pill` for global chrome.
- **Layer scale**: `--z-appbar` 40, `--z-dock` 45, `--z-sheet` 60,
  `--z-sheet-content` 61, `--z-toast` 70.
- **Type**: GeneralSans served locally through `next/font/local`. Tabular figures
  via the `num` utility for every money, quantity and date value.

`globals.css` also resets the surfaces the browser would otherwise control:
native appearance on buttons, inputs and selects, number and search decorations,
calendar and reveal indicators, autofill colours, scrollbars, `dialog`,
`progress`, `summary` markers and list semantics. Keyboard focus always paints a
2px `primary` outline, and `prefers-reduced-motion` collapses transitions.

## State

`lib/store.ts` is a small `useSyncExternalStore` wrapper with optional
`localStorage` persistence. `getServer` returns the pristine initial value, so
server markup and the first client paint agree and the real state arrives in the
post-hydration render. On top of it:

- `lib/cart-store.ts` - lines keyed by product + colourway, clamped to 9 units
- `lib/favorites-store.ts`, `lib/session-store.ts`, `lib/orders-store.ts`
- `lib/checkout-store.ts` - the persisted draft plus the validators and input masks
- `lib/toast-store.ts` - three most recent notices, 5s each

Pricing rules are in `lib/products.ts`: standard 4,90 € (free from 60 €), express
9,90 € (free from 150 €), pickup free, and three promo codes. `totalsFor` is the
only place totals are computed, so cart, checkout and confirmation never disagree.

## Vendored components

`components/ui/library/` holds verbatim copies from `work/utils/components`:

- `floating-dock.tsx` - the navigation dock. Unstyled apart from four functional
  additions: `next/link` instead of `href` anchors (SPA navigation, identical
  appearance), `type="button"` plus `aria-label`/`aria-expanded`/`aria-controls`
  on the mobile toggle, `aria-label` from each item's `title` because icon-only
  links otherwise have no accessible name at all, and a `menuLabel` prop to carry
  that label.
- `stateful-button.tsx` - the pay control, themed through its own `className` API.
- `animated-number.tsx` - the rolling quantity digits.

The copies are excluded from eslint (`eslint.config.mjs`) so they stay byte-faithful.

## e2e suite

`e2e/` runs every spec in three projects: `mobile` (Pixel 7, 393×851, touch),
`small-phone` (360×640) and `desktop` (1440×900). French and Arabic are covered
inside the specs rather than as separate projects.

- `shop.spec.ts` - shell, dock, badges, persistence, language switch, RTL, facets
- `product-sheet.spec.ts` - the sheet contract: coverage over 70% of the viewport,
  blurred and scroll-locked background, dismiss by scrim, Escape and back button,
  focus trap, add-to-cart, related products, standalone page fallback
- `cart-checkout.spec.ts` - cart lines, quantities, promo codes, and the whole
  three-step payment through to the order reference
- `account.spec.ts` - mock sign-in, guards, favourites, order history
- `quality.spec.ts` - console-error sweep over every route, horizontal overflow at
  360px, touch target minimum, reduced motion, and the "no browser default survives"
  checks

`test-results/` and `playwright-report/` are gitignored; failures keep a trace and
a screenshot.
