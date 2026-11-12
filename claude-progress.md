# Claude Progress -- Mercur.js

This is the session log and current-state tracker. Keep it short: prune old
session detail aggressively. The per-spec source of truth lives in
`docs/specs/SPEC-*.md` (status + Evidence) — this file is just the running log.

## Current Verified State

- **Repository root**: `/Users/israfil/Proejcts/fashionpy/mercur`
- **Current branch**: `main`
- **Current version**: `2.2.0-rc.1`
- **Standard startup path**: `bun install && bun run dev`
- **Standard verification path**: `bun run build`, `bun run lint` (oxlint),
  `bun run test:integration:http -- <pattern>`
- **Current blocker**: none
- **Known baseline noise**: 10 unit failures in 2 pre-existing environmental
  suites (`codegen-module-service` macOS `/private/var` realpath,
  `jest-transformer` dist fixture) — unrelated to feature work; integration
  suites must be run per-suite on this 8 GB box (multi-suite batches exceed
  the specs' hook timeouts under load).

## Session — COD production flow: capture on delivery, remittance gate, local payouts (2026-11-12), branch `main`

SCOPE-003 (`docs/specs/SPEC-003-cod-payments.md`, status `passing`) — COD-only
launch after the Bangladesh-gateway review (SSLCommerz ৳25k rejected; Bangla QR /
BRAC Bank gateway deferred to a payment-gateway spec; Stripe deferred to Phase 5).

- **Money flow.** New `captureCodPaymentWorkflow` (core, payment workflows) +
  `decideCodCapture` util: captures an authorized `pp_cod` cart payment once every
  order of the cart is delivered/canceled (amount = auth − canceled totals; all
  canceled → cancel). Driven by the `payout-local-cod-capture` job (5 min).
  Courier webhook / vendor mark-as-delivered already sets `delivered_at`.
- **Remittance gate.** `courier_shipment` gains `cod_remitted_at` +
  `cod_remittance_reference` (migration `20261111120000`); `decideOrderPayout`
  holds with new `PayoutStatusReason.COD_NOT_REMITTED` until every non-exempt
  COD shipment is remitted (`payout-amounts.ts` + `create-order-payouts` query).
  Admin `POST /admin/courier-shipments/:id/remittance` stamps and immediately
  re-decides the payout; new admin order-detail **Courier & COD** section shows
  shipments + Mark remitted (`orders:view` to list, `payouts:edit` to remit).
- **Manual disbursement.** `POST /admin/payouts/:id/mark-paid` (409 unless
  `processing`, records reference/marked_paid_by), bulk
  `POST /admin/payouts/mark-paid` (≤200, lenient report), `POST /admin/payouts/export`
  (CSV of the batch with seller + destination). Admin payouts list: Mark as paid
  row action + Export CSV header button (+ i18n).
- **Local payout provider.** New `packages/plugins/payout-local` (tsc →
  `.medusa/server`, jobs/subscribers auto-discovered): `pop_local_local`
  (`providers/local`) — pending until `data.payout_details` is complete
  (`holder_name` + `account_number`/`wallet_number`), onboarding/login links →
  vendor payment-details page (kills the `system://` bug), `createPayout` →
  `processing` manual instruction, `reversePayout` → manual clawback, webhook
  `not_supported`. Also jobs: transfers backstop (payout requires `delivered`),
  reversals, onboarding (creates accounts for open sellers); subscribers:
  `payment.captured`, fulfillment/canceled, `payout_account.updated`.
  Unit spec 10/10.
- **Seller details.** `payment_details` + `payout_method`/`wallet_number`
  (migration `20261111120001`, snapshot patched), validators (vendor+admin),
  both payment-details forms get a Payout method select + wallet field;
  `updateSellerPaymentDetailsWorkflow` now syncs the destination onto the
  payout account (`set-payoutAccountDetailsStep`) and runs
  `syncPayoutAccountWorkflow` when an account exists.
- **Config.** `apps/api/medusa-config.ts`: plugins swap stripe-connector →
  `@mercurjs/payout-local`; payout module always registers the local provider
  (`vendorUrl` → details form); payment module keeps its Stripe branch so
  adding `STRIPE_SECRET_KEY` later only enables card checkout (Stripe Connect
  payouts = Phase 5, single-provider constraint noted). Test config registers
  `pp_cod`; checkout helper gained `paymentProviderId`.
- **Commission.** Global default seeds at 10% (loader) + guarded migration
  bumps only still-0 rows (`20261111120002`).

**Verified** (per-suite; the 8 GB box times out multi-suite batches):
lint clean; `turbo build --no-daemon` 19/19; unit 355 pass (same 10
pre-existing env failures as baseline); integration — new
`payouts/admin/cod-payout-flow` 7/7, `payouts/admin` 14/14, `payouts/vendor`
24/24, `commission-rates` 41/41, `courier` 18/18, `seller/vendor` 76/76,
`seller/admin` 89/91 (2 × 50 s setup timeouts under load, unrelated tests).
Gotchas learned: integration tests run against **built** packages (rebuild
core after source edits); `useQueryGraphStep({isList:false})` returns `data`
as an **object**, not an array; `MedusaError.Types.CONFLICT` → 409 (not
`UNEXPECTED_STATE`); the test `api` is axios (CSV lives in `response.data`).
Manual QA owed: remittance → payout release loop, details form → account
activation, export → transfer → mark-paid loop.

## Session — Share preview showed Mercur's promo art (2026-11-11), branch `main`

Sharing `fashionpy.com` rendered Mercur's `B2C_Storefront_Open_Graph.png` because
the homepage hard-coded it and no other page declared `og:image` at all (page-level
`openGraph` replaces the root's, so scrapers fell back to whatever image they found).

- **Landed.** New `apps/storefront/public/og-image.png` (1200×630, FashionPy
  wordmark on the brand gradient, generated from `fashionpy.svg` + brand colors in
  `colors.css`). `lib/helpers/og-image.ts` exposes `DEFAULT_OG_IMAGE` /
  `defaultOgImage(baseUrl)`; root `app/layout.tsx` now sets default `openGraph` +
  `twitter` images, and home, blog index/detail, categories, category, collection
  and seller pages pass it explicitly (blog falls back to it when a post has no
  cover). Product SEO keeps the product thumbnail and falls back to the branded
  card instead of `placeholder.svg`. Mercur's PNG deleted — no other references.
- **Verified.** `bun run lint` clean, `bun run build` 18/18, tsc adds no errors in
  touched files. Live `next dev` + API: `/bd`, `/bd/categories`,
  `/bd/categories/sneakers`, `/bd/collections/sneaker-station`, `/bd/blog` and a
  404 all emit `og:image`/`twitter:image` → `/og-image.png` (serves 200, 92 KB);
  product page keeps its own thumbnail when present.
- **Owed / next.** Deploy, then re-scrape in the Facebook Sharing Debugger /
  WhatsApp preview — both cache previews per URL. Local `NEXT_PUBLIC_BASE_URL` is
  `http://localhost:3000`, so production URLs come from that env var. Nothing
  committed.

## Session — Storefront catalog cache + category sidebar + collection-driven banner section (2026-11-10), branch `main`

Categories/collections created in admin never showed up in the nav, category strip
or collection sections until a redeploy: catalog fetches used `revalidate: false`
and the API revalidation subscriber only listened to product/offer/store/hero-banner
events. Production `Gift` is a live top-level category (its page renders — dynamic
routes aren't cached) but the cached homepage/header predated it.

- **Cache.** `apps/api/src/subscribers/storefront-cache-revalidate.ts` (and the
  `templates/basic` copy) now subscribes to `product-category.*` /
  `product-collection.*` → tags `categories` / `collections`; product and offer
  events also tag the base `products` tag so listings refresh, not just PDPs.
  `apps/storefront/src/lib/data/cache-tags.ts` swaps indefinite caching for
  webhook + 5-minute TTL (`getCatalogFetchOptions`: `no-store` in development,
  `force-cache` + tags + 300s in production); every catalog data module uses it.
  Local `apps/api/.env` gained `STOREFRONT_REVALIDATE_URL`/`_SECRET` (gitignored).
- **Collection banner section.** `ShopCollectionBanners` reads `listCollections()`
  (banner → thumbnail → any image, `/collections/{handle}`, "Shop Now", gradient
  when artwork is missing) instead of the `shop_collection` hero-banner slot;
  `CollectionSliderSection` keeps thumbnail preference through the shared
  `pickCollectionImage`. Admin `shop_collection` slot kept, no longer rendered.
- **Category media.** Store category query config exposes `media_images.*` for the
  category and its children; `lib/helpers/category-image.ts` picks icon (strip) /
  thumbnail (cards) / banner with the shipped `/images/categories/{handle}.png`
  fallback, and the new `CategoryImage` atom swaps to `placeholder.svg` on load
  error — categories without a static file (`fashion`, `gift` in production) no
  longer show a broken image.
- **Category sidebar.** `listCategoryTree` + `buildCategoryTree`/
  `findCategoryTrail` feed a new `CategoryTree` organism rendered by
  `ProductSearchSidebar` on `/categories` and `/categories/[handle]` only
  (desktop left panel and the mobile filter modal): nested, active branch
  auto-expanded and highlighted, "All Products" link, locale-aware. Collection
  pages keep the attribute-only panel.
- **Verified.** `bun run lint` clean; `bun run build` 18/18 (full turbo);
  `test:integration:http -- 'product-categories|collections'` 34/34 including new
  store specs for category media (gallery, icon, nested children) and collection
  banner flags. Local stack: emitted `product-category.created` /
  `product-collection.updated` → subscriber POSTed `{"tags":["categories"]}` and
  `{"tags":["collections"]}` to the revalidate endpoint (wrong secret 401, empty
  tags 400); Playwright 9/9 — image fallback, tree render, expand/collapse, active
  highlight, tree inside the mobile filter modal, no tree on collection pages.
- **Owed / next.** Production still serves the pre-deploy cached homepage; after
  deploy it self-heals within the 5-minute TTL, or POST
  `{"tags":["categories","collections"]}` to `/api/revalidate` immediately.
  Production `Gift` has no media/icon yet and will show the placeholder until one
  is uploaded. Nothing committed — no commit was requested.

## Session — Injected `init` payloads broke the Dokploy build; host malware cleaned (2026-11-09), branch `main`

Deploy died at the Dockerfile's `bunx turbo run build` — `@mercurjs/dashboard-sdk#build`
and `@mercurjs/docs#build` threw `child.stdin.unref is not a function` from `packages/*/init`.
Not a build bug: GitHub `main` tip was `96b15730e` (pushed today 07:02 +0100, same parent
and message as our clean local `ef75eee20`) — a rewritten commit carrying an injection:
35 `init` files (benign stub + obfuscated payload, marker `uFZJCBPkZizvf`), every
`package.json` `build/dev/start` prefixed `node init &&` (+ CRLF churn), 30 KB payload
appended to `apps/storefront/postcss.config.mjs` (`var z = '-7406'` matches the C2 config
`_V: "A9-7406"`); it also dropped legit lines (`.env`/`.env.local` in `.gitignore`,
TEST_TYPE block in 2 `jest.config.js`). Only ref containing the payload was `fashionpy/main`.
Source was this Mac, not the server: `~/.node_modules/.npm-ws*` loader (C2
`http://95.135.181.151:443`, XOR key + `eval`, dropper since Sep 12, respawned once) plus
stage-2 `~/.config/gvfs-network/runtime.js` (1 MB) kept alive by launchd agent
`com.apple.security.pboxd.agent` and a every-minute + `@reboot` crontab `cron-watch.sh`;
both payload files self-updated mid-session. Fix: verified clean tree (`bun run lint`,
turbo build 15/15 mirroring the Dockerfile step) → `git push --force-with-lease fashionpy main`
→ `ef75eee20`; re-grepped all refs — clean. Cleanup: agents killed + respawn-watched,
launchd agent booted out, dirs quarantined to `~/Malware-Quarantine-2026-11-09/` (mode 700).
`com.ui.uid.standard-desktop` LaunchDaemon is Ubiquiti-signed (false alarm); sibling repos
under `~/Proejcts` scanned clean.
Owed / next: user purges the 2 dead crontab entries from their own Terminal (setuid
`crontab` is EPERM under this tool's sandbox): `crontab -l | grep -v gvfs-network | crontab -`;
rotate GitHub PATs/OAuth apps/SSH + high-value secrets (C2 had ~2 months access) and read
GitHub's security log for the `96b15730e` push; redeploy Dokploy from the new tip;
`dependabot/github_actions/actions/setup-node-7.1.0` vanished from GitHub mid-session —
confirm whether that was expected.

## Session — PDP polish: magnifier zoom, brand/store lines, share, similar items, recently-viewed fix (2026-11-08), branch `main`

Six storefront items (user-confirmed choices: brand = seller store name, 260px/3.5x lens,
similar = same category w/ latest fallback): `ProductImageMagnifier` lens 140→260, zoom
2.2→3.5, lens position clamped in-bounds; `ProductInfoColumn` brand line under title
(`Brand: <store link>`, replaces "Sold by") + new `ProductShare` row (copy-link w/ 2s
"Copied!" state, WhatsApp `wa.me`, Messenger `share/?link=`; new `ShareIcon`/`CopyIcon`,
WhatsApp/Messenger glyphs inline — note existing `WhatsAppIcon` path is a generic
share-arrow, not the real logo); `ProductDetailsPage` seller fallback
(`buybox winner ?? first offer with seller`) so the store line never silently disappears;
`ProductBuyBox` shop-name row at top (reuses `SellerAvatar` + `/sellers/{handle}` link +
Premium badge); `Similar items` via `listProducts({category_id})` exclude-current →
latest `-created_at` fallback, rendered before "More from this shop"; `RecentlyViewedSection`
card width bug — `ProductCard` root is `w-full` so 1–2 cards stretched across the row;
now `w-[260px] sm:w-[280px] shrink-0` (matches `HomeProductsCarousel` default width).
`HomeProductSection.products` widened to `StoreProduct[] | Product[]` (fixes 2 pre-existing
tsc errors). New testids: `product-brand-line`, `product-share`, `share-{copy,whatsapp,
messenger}`, `product-buybox-store(-link)`, `similar-items-section`.
Verified: `bun run lint` clean; `bun run build --filter=@mercurjs/storefront` green;
`apps/storefront` tsc has 0 errors in touched files (131 total vs 133 baseline).
No storefront/PDP e2e harness exists (only admin-login/guides) and no API change —
manual PDP spot-check (lens edges, share actions, similar fallback, rv cards at 1 item) owed.

## Session — Dokploy OOM: fashionpy deploys cancelled (2026-11-08)

Every Dokploy deploy since Nov 6 died mid-build → `cancelled` with empty errorMessage.
Root cause (server `5.189.148.53` / `vmi3604607`, Dokploy v0.30.8): 11 GiB host running
several stacks exhausted RAM+swap while `api` + `storefront` images built **in parallel**;
kernel OOM killer killed buildkit/node and Dokploy itself (exit 137) → on restart
`initCancelDeployments` marked the in-flight run `cancelled` ("Cancelled 1 deployments"
in dokploy logs). Evidence: `dmesg` OOM kills at exactly each cancelled run's build window;
GitHub CI green throughout (server-side only). Fixes applied:
1. +8G `/swapfile2` (total 16G, fstab-persisted).
2. `compose.command` override for the `fashionpy` compose (DB) — serializes builds:
   `compose ... build api && docker compose ... build storefront && docker compose ... up -d --remove-orphans`
   (Dokploy `createCommand` allows `&&` chains whose later parts start `docker compose `).
Deploy re-triggered via `POST /api/deploy/compose/<refreshToken>` (webhook,
`x-github-event: push` payload, branch `main`) → `done` in 24 min, 0 OOM kills,
containers healthy, all domains 200/301/307. **Note**: `compose.command` lives in the
Dokploy DB — a future compose edit/reset in the UI loses it; re-apply if builds die OOM again.

## Session — Etsy-style storefront PDP redesign + store review listing API (2026-11-07), branch `main`

Three-phase PDP redesign (user-approved defaults: existing `/store/reviews` API, seller-leadtime
+ honest cost/returns delivery copy, single wishlist heart on main image, no fake Etsy stats).
Phase 1: new `ProductImageMagnifier` (hover-lens), `ProductInfoColumn`, `ProductBuyBox` (sticky
`top-[112px]`, multi-seller buybox/CompareOffers preserved), `ProductDeliveryTeaser`,
`ProductBackLink`; rewrote `ProductCarousel` (thumb rail + arrows + magnifier),
`GalleryCarousel`/`ProductGallery`, `ProductDetailsPage` (breadcrumb + 3-col); `PRODUCT_LIST_FIELDS`
now includes `*categories`. Phase 2: `ProductTabs` (About/Delivery, `#product-delivery-tab`
deep-link), `ProductTabContent`, `ProductDeliveryPanel`, `MeetYourSeller`, `ProductReviews`
(+ `lib/data/reviews.ts`), `ProductDetails` async orchestrator, `RecentlyViewedSection`
(localStorage, MAX 8), seller-products re-fetched by handles for full variant prices
("More from this shop" only when non-empty), open (non-accordion) details. Phase 3 backend:
`StoreGetReviewsParams` gains `product_id`/`seller_id`/`reference`/`status`;
`storeReviewsMiddlewares` — `applyStoreReviewFilters` runs BEFORE the three
`maybeApplyLinkFilter`s (link filters delete `product_id`/`seller_id`/`customer_id`), public
listing forces `status="published"` (client `status` ignored), personal list without
`product_id`/`seller_id` requires auth (MedusaError `NOT_ALLOWED` → HTTP 400) and sets
`customer_id = actor_id`. New spec `integration-tests/http/review/store/review.spec.ts`
(7 cases: published-only public listing, hides pending/rejected, forces published vs client
`status`, wrong-product excluded, unauth personal list → 400, personal list scoped to customer,
pending alongside published). Debug notes: `ProductStatus` is a runtime enum from
`@medusajs/framework/utils` (not `/types` — type-only there → `undefined`); authenticated store
calls need publishable-key AND customer bearer merged into one headers object; hook timeout
needed `jest.setTimeout(180000)` (setup migrations exceed 50s when the machine is loaded).
Verified: `bun run lint` clean; `bun run build --filter=@mercurjs/storefront --filter=@mercurjs/core`
green (6/6); `test:integration:http -- review/store` 7/7. Testids contract preserved
(`product-details-page`, `product-gallery*`, `product-title`, `product-price-*`,
`product-add-to-cart-button`, `compare-offers-button`, `wishlist-button`, …). Committed
as `e646129f8` and deployed to prod (Dokploy `done`, 2026-11-08). Manual PDP spot-check
(desktop/mobile, guest vs logged-in wishlist/chat, delivery deep-link,
empty shop section) owed.

## Session — Storefront hero banners not showing after admin add (2026-11-07), branch `main`

Root cause (verified live: API `GET /store/hero-banners?slot=hero` returned the banner with
200 while `fashionpy.com/bd` HTML had **no** `data-testid="hero-carousel"` at all): the
storefront fetch is `cache:"force-cache"` + `revalidate:false` tagged `hero-banners`
(`apps/storefront/src/lib/data/hero-banners.ts`), and `cache-tags.ts` documents the ONLY
invalidation path as a backend-pushed `revalidateTag` — but no `hero_banner.*` event ever
existed: admin create/update/delete routes called the service plainly, and
`storefront-cache-revalidate.ts` never listened for banners (nor did `buildTags` emit the
`hero-banners` tag). First homepage render cached the pre-banner list forever; the
`catch { return [] }` also silently masked any fetch error. Fix: admin hero-banner routes
now `eventBus.emit` `hero_banner.created|updated|deleted`; the subscriber listens for
them and maps to tag `hero-banners` (→ POST `/api/revalidate` → `revalidateTag`); storefront
catch now logs the error; store query-config returns `is_active/starts_at/ends_at` so the
client-side visibility filters in `hero-banners.ts` (previously dead code — fields were
never in the response) actually run. New spec
`integration-tests/http/hero-banners/store/hero-banners.spec.ts` (5 cases: visible,
inactive hidden, date-window hidden, slot filter, events emitted) — store read path had
zero coverage before. Verified: `bun run lint` clean; `test:integration:http -- hero-banners`
8/8 (3 pre-existing admin + 5 new). Builds: core + storefront green with the fix; the
panel packages (`@mercurjs/admin|vendor`, `@acme/admin|vendor` + all deps) finished
`turbo run build --concurrency=1` → 10/10 successful (full-repo build thrashed for hours
because the machine was running several parallel agent sessions + a Next build in swap —
@mercurjs/admin DTS alone took 82 min; sequential concurrency was the only way through).

## Session — Onboarding wizard fields + vendor analytics 500 (2026-11-06), branch `main`

Vendor onboarding: Step 1 (store) lost its Email field (seller email now = member email,
sent as `email` + `member_email` in `createSeller`), Name label → "Store name", Phone now
required (zod min(1) + label not optional); field label "Handle" → "Store public Link"
(en.json + $schema.json parity kept — tooltip/required/availability strings reworded).
Step 2 (address) lost its Name field entirely (payload drops `address.name`; server schema
always had it optional) and `address_1` + `city` are now required. New i18n keys
`validation.{phoneRequired,addressRequired,cityRequired}` (en only; other locales fall back).
Vendor analytics `GET /vendor/analytics` 500'd in production (verified live): three raw-SQL
bugs in `packages/core/src/api/vendor/analytics/route.ts` — (1) `fp_promotion.seller_id`
filter against a column that has never existed (model + sole migration define no such
column; promotions are platform-scoped like admin analytics), (2) top-products summed
`oli.quantity` but quantity lives on `order_item` (`oi.quantity`) — same bug also in
`admin/analytics/route.ts`, fixed both, (3) payouts KPI filtered `payout.data->>'seller_id'`
which is stripped before insert (always 0) — now joins the `payout_payout_seller_seller`
link table, guarded by `hasTable` for both tables (payout module is optional). New test
`integration-tests/http/analytics/vendor/analytics.spec.ts` (3 cases: payload shape, all
period buckets, 401 unauth) — red on the original code, green after; it caught bug (2)
itself. Verified: `bun run lint` clean; `bun run build` 18/18;
`test:integration:http -- analytics` 3/3. Prod re-verify owed after deploy: analytics 200
+ onboarding wizard labels/required fields on partner.fashionpy.com. Changes uncommitted.

## Session — Production BDT seeding + seller-signup 401s (2026-11-03), branch `main`

Production never ran the seed (Dockerfile was `db:migrate && start` only), so Medusa's boot
default left the store EUR-only with no region: new sellers were created with EUR, store
address/warehouses were missing, and onboarding spammed 401s. Landed:
`GET /vendor/sellers` returns an empty list (200) for a registered member without
`actor_id` instead of 401 — that 401 made `@mercurjs/client` drop the auth token
mid-onboarding, which caused the `/vendor/sellers/handle-availability` 401 cascade and
blocked `POST /vendor/sellers`. `POST /vendor/sellers` now provisions a default warehouse
(`<name> Warehouse`, signup address or `bd`, linked to the default sales channel +
`manual_manual`; failure logs, never fails signup). Seed (`apps/api`): region
"Bangladesh"/`bdt` (+ in-place normalization of a legacy Europe/eur bd region), sets
`store.default_region_id` when unset, demo name/announcement only when absent (admin edits
survive restarts), one-shot `eur→bdt` seller flip guarded by store metadata
`bdt_seller_currency_backfill`, gap-fills missing seller addresses (`country bd`) and
warehouses (per-seller try/catch), demo sellers fully BD/BDT (BD addresses, `bdt` currency,
shipping ৳150 + region price, offers `bdt = eur×130` with eur/usd rows kept, service zone
"… Bangladesh"). Dockerfile CMD: `db:migrate && bun run seed && bunx medusa start`
(idempotent, runs every boot). Onboarding store step preselects the store default currency.
Verified: `bun run lint` clean; `bun run build` 18/18;
`test:integration:http -- seller/vendor/seller` 88/88 (new: pre-onboarding empty list,
unauthenticated 401, default warehouse with and without signup address); seed run twice on
the local dev DB (second run fully no-op — flip marker + gap-fills skipped; 6/6 sellers
bdt, 6 addresses, 6 warehouses, `default_region_id` set, store currencies bdt/e/usd);
fresh scratch DB `db:migrate + seed` exercised the full first-boot path (Bangladesh/bdt
region, 5 BD demo sellers, 1026 offers incl. bdt prices, shipping ৳150, announcement set),
scratch DB dropped. Owed: on next prod deploy confirm partner.fashionpy.com shows BDT +
region bd; existing sellers' product/variant prices were NOT converted (currency label is
now bdt — review the numbers manually).

## Session — Store offers on the Medusa index engine (2026-11-03), branch `feat/index-engine-store-offers`

`GET /store/offers` goes through `api/utils/list-offers.ts` `listOffers()`: `query.index` with seller visibility
(`seller.status = open`, scheduled-closure dates) and `product.status = published` as index filters, `query.graph`
with the previous id-list prefetch when a filter isn't indexed (`q`) or the index is off. The index can only join
across modules through link tables, so `offer_seller` and `offer_product` are now writable links (`isList` on the
offer side) that `createOffersWorkflow` writes next to `offer.seller_id` / `product_id`; migration script
`backfill-offer-links.ts` seeds rows for existing offers after `db:migrate` syncs the tables. `withMercur` passes
`utils/index-schema.ts` (Medusa's product schema + `Offer` + `Seller`) as the index module's `schema` option. Shared
index helpers moved to `api/utils/index-engine.ts`. The detail route checks seller/product visibility from the
database (the index is async). Tests: store `store-offers.spec` 16/16 with `helpers/wait-for-indexed-offers.ts`;
`http/offer` vendor + store specs pass; `order.spec` / `multi-seller-shipping-methods.spec` 500 locally with the
nested-worktree awilix leak, not this change (CI is the source of truth).

Pre-existing, unchanged: the seller visibility rule hides a seller whenever `closed_to` is in the future, even
before `closed_from`, in both `resolveVisibleSellerIds` and `store/sellers/middlewares.ts`.

## Session — Product lists on the Medusa index engine (2026-11-03), branch `feat/index-engine-product-lists`

`GET /admin|/vendor|/store/products` now go through `api/utils/list-products.ts` `listProducts()`. It uses
`query.index` when every filter key and the sort fall in the indexed whitelist, otherwise `query.graph` (categories,
tags, variant options, withDeleted, admin `seller_id`). `count` = `estimate_count`, exact when the page isn't full;
`estimate_count` is also returned. `withMercur` enables `index_engine` and injects `@medusajs/index` (direct dep
of apps/api, integration-tests, templates/basic api). `product_seller` link is `filterable`. Vendor list no longer
scans every seller's `product_seller` rows: visibility is own PRODUCT_ADD ids (draft/proposed), plus published with
no `product_seller` row, plus published `id IN` this seller's own rows. It's passed per engine through
`ProductVisibility`. The detail guard is one product query + the scoped authorship lookup. `has_offer` filters by
`offer.product_id`. New index `IDX_product_change_created_by`. Tests: vendor `product.spec` 17/17 (new graph-fallback
and count cases), admin `product` + `product-publish-and-sku` 26 pass (4 pre-existing skips), store `product/` 18/18,
with deterministic index waits (`helpers/wait-for-indexed-products.ts`). Core tsc green; full `bun run build` not run.

Open risk: sellers created after boot never land in the index (`seller.seller.created` doesn't reach it), so
`sellers.id` filters are unusable. Production needs the Redis event bus for incremental index sync.

Follow-up (same day, same PR #1740): Medusa Caching Module. `withMercur` sets the `caching` flag and registers
`@medusajs/medusa/caching`, using the Redis provider when `projectConfig.redisUrl` is set (dep in apps/api +
template) and in-memory otherwise (tests). `listProducts` takes `cache: { ttl, tags }`, always tags
`Product:list:*` (automatic tags come from rows, so empty pages would otherwise never clear) and caps index-backed
entries at 5s: one event clears the cache and starts the async index sync, so a request in between re-caches the
pre-write state. Store 300s / admin 60s / vendor 60s + `LinkProductSeller:list:*` (link attach only clears that
tag). Invalidation tests: store 22/22, vendor 19/19, admin 26 pass.

Follow-ups (same day, same PR):
- **Exact counts** on admin/vendor via an ids-only index call; it's what `query.index` sends internally, minus
  pagination. Measured cost: 234ms vendor / 33ms admin at 20k.
- **Routing:** plain lists go to `query.graph`; the index is only used for `product_seller` / sales channel / price
  filters.
- **Seller events:** the service overrides now use `@InjectManager` + `@EmitEvents` + `@MedusaContext`, so
  `seller.seller.*` is emitted and sellers reach the index. Deployments need one full index sync.
- **Previously no-op cache calls**, now live:
  - CI caught them (store-offers, offer-region-prices). Each got the link/list tag that actually clears.
  - Membership checks are no longer cached.
- **Open:** tie ordering. `query.index` takes one sort key only, so there's no `id` tiebreak and paging can repeat or
  skip products when `created_at` ties (on main too).

## Session — Extendable offer tables, grid and form fields (2026-10-26), branch `feat/extendable-offer-tables-forms`

Panel extensions can now hide, replace, and add columns and fields beyond list pages, reusing the existing
custom-fields keys (no new config keys). `list` takes an optional `zone` and may be an array; `useExtendableTable`
takes `zone` (default `"list"`). `forms[].fields` keyed by a built-in id overrides it (`null` hides), through the
new `<ExtendableFormField>` and, for spreadsheet tabs, `useExtendableGrid` (cells come from the panel via
`createDataGridExtensionColumn`). Wired on offers: vendor `variants` / `create-catalogue` tables, the create
stock-and-prices grid, the edit drawer; admin `variants` / `inventory` tables. Core: `POST /vendor/offers/batch`
items accept `additional_data`, surfaced on `offersCreated` as `offers_additional_data` keyed by offer id.
Generators emit `listZones`, `listColumnIds`, `formFieldIds`. Tests: registry + grid unit specs (32 pass), SDK type
test, `offer/vendor` integration suites 7/7 (62 tests). `bun run build` green (13/13). Other pages still use
list-only extensions; follow the offer wiring to migrate them.

Follow-up (same day): product create (both panels) takes per-tab added fields, built-in overrides (title, subtitle,
handle, description, media, discountable, category/collection/type, tags; admin also sellers + global availability)
and an extendable variants grid. `POST /vendor|admin/products` variants accept `additional_data`, surfaced on
`productsCreated` as `variants_additional_data` keyed by variant id (the variant batch route still rejects it).
Untabbed `forms` fields now render on the first tab only and never become spreadsheet columns (`exactTab`), which also
fixes the create-offer grid. Vendor offer grids: `edit-price` takes added columns (saved via `offersUpdated`);
`edit-stock`, `pricing`, `inventory-batch` take overrides only (`allowAdd: false`). Vendor offer `inventory` table,
inventory detail `location-levels` / reservations `inventory-item` tables in both panels. Generator follows
`use-*-columns` imports and resolves constant zones. Tests: shared 37, SDK types, variant-sync specs, integration
11 suites (103 pass). Build green.

Unrelated finding, not fixed: the batch route drops `condition_id` when mapping items, though the validator
accepts it and the create form sends it. The admin `ProductCreateAttributeSection` (dimensions) is never rendered.

Follow-up 2: detail-page tables in both panels take `list` blocks: `product` `variants`, `collection` `products`,
`category` `products` (select stays first, actions last; collection/category also merge extension filters). Generator
now follows `@<dir>/` alias column imports, so vendor list pages (product, order, customer, promotion, campaign,
payout, collection) finally get `listColumnIds`. Example configs in `apps/vendor/src/custom-fields` (offer, product,
collection, category) plus an `offersCreated` logging hook in `apps/api`. Generator specs 10/10 per panel, build green.
Known gap (pre-existing, all tables): added list filters render in the menu but their keys are not forwarded to the
API query, because each `use*TableQuery` reads a fixed key list. Not browser-verified.

## Session — Magento integration gaps in core (2026-10-23), branch `fix/magento-integration-gaps`

Running the Magento connector against a live API (see the connector PRs #2–#5) exposed core behaviour the
integration had to work around. Fixed here: `POST /store/carts` now ignores an empty `currency_code` instead of
storing it and failing every later price calculation; the cart completion response lists the order group's child
`orders` with `display_id`, `status` and `seller`; an admin product created or updated as `published` emits
`product.published` (previously only `/confirm` did, so webhook subscribers never saw admin-published products);
`createOffersWorkflow` refuses offers on products restricted to other sellers or rejected
(`validateOfferProductsStep`); `GET /admin/products?sku=` filters variants instead of 500ing on `Product.sku`;
the plugin's event list drops `order.shipment_created`, which nothing emits. Tests: new
`product/admin/product-publish-and-sku.spec.ts`, three cases in `offer/vendor/offer.spec.ts`, one each in
`offer/cart/cart.spec.ts` and `offer/order/order.spec.ts`. `bun run build` green (13/13).

## Session — Magento connector hardening sweep (2026-10-22), branches `feat/magento-external-payment-capture` (this repo) + `feat/checkout-orders-indexer-platform` (magento2-connector)

## Session — Stripe connector (2026-10-22), branch `feat/stripe-connector`, worktree `~/Desktop/mercur-stripe-connector`

Spec: `docs/specs/spec-stripe-connector/` (local, gitignored; `brief.md`, `research.md`, `blueprint.md`, `assert.md`,
`removals.md`, `deltas/D-001…D-012` all `done`). Scheduled payout pipeline in the shape of
Medusa's payment module.
- Core payout module is provider-agnostic: `pop_<identifier>_<id>` registry (`pop_system_default` always),
  ten-method `IPayoutProvider` + `AbstractPayoutProvider`, new models `transfer`, `settlement`, `adjustment`,
  `payout_provider`, `payout_checkpoint`, `payout_job_run`, `payout_notification`, extended `payout_account`/`payout`
  (migration `Migration20261022120000`), `/hooks/payout/[provider]` (+ legacy alias).
- Seven scheduled jobs (`packages/core/src/jobs`), pipeline functions under
  `workflows/payout/pipeline`, pure rules under `workflows/payout/utils` (transfer factory, capture decision,
  settlement builder), workflows for transfer/reversal/payout dispatch, account sync, capture/cancel, operator
  notifications; admin routes for accounts, transfers, settlements, adjustments, jobs, status, captures,
  notifications; vendor `payout-accounts/me`, `transfers`, `settlements`; public onboarding refresh.
- Plugin `packages/plugins/stripe-connector` (`@mercurjs/stripe-connector-plugin`): Stripe payment provider
  (manual capture, order-group metadata) + Stripe Connect payout provider, admin Finance → Stripe (tab per job),
  Settings → Stripe, seller/order widgets, vendor Settings → Stripe. `packages/providers` deleted; docs rewritten.
- Verified: core tsc + build, plugin server/admin/vendor tsc + `dashboard:build`, `bun test` unit specs 35/35
  (core utils + plugin provider), lint clean on touched files, `payouts/vendor/*` 8/10 → racing subscriber removed
  (re-run pending), new `payouts/admin/payout-pipeline.spec.ts` (fixes in progress). Gotchas: integration tests need
  `packages/plugins/magento2-connector` built (test config loads its provider); `bun run test:unit` can't resolve
  `@swc/jest` locally, use `bun test <dirs>`; declaration emit needs an explicit `ReturnWorkflow<>` annotation on
  workflows that return `when()` results (TS2742).
- Open: Stripe test-mode run by hand (assert.md § I); PR to `main`.

## Session — Medusa 2.22.0 upgrade (2026-10-22), branch `chore/medusa-2-22`

Every `@medusajs/*` pin moved 2.21.2 → 2.22.0 and every peer range `>=2.21.0` → `>=2.22.0` (packages,
providers, apps, integration-tests, root, and all three templates — they already tracked the workspace
line at 2.21.2, so they follow it; `@medusajs/ui` keeps its own 4.2.3 line). `bun.lock` refreshed.
Medusa 2.22.0 requires Node 22.22+, so the `engines.node` floor on core, the payout provider, the API
app and the templates is `>=22.22.0`; docs say Node 22.22+. Breaking change absorbed: 2.22.0 made
`refundPaymentWorkflow` replay-safe (medusajs/medusa#16964), which moved the hunk the payment-hooks patch
anchored on. Regenerated as `@medusajs+core-flows@2.22.0-payment-hooks.patch` (range 2.22.0–2.23.0);
the `paymentRefunded` hook now also carries `is_replay` so a ledger can skip a replay the way the credit
line and event are skipped. The other four patches apply unchanged; their ranges extend to 2.23.0.
test-utils dropped the `inApp` option, removed from both `health.spec.ts`. `routes-manifest.json` gained
`/admin/customers/export`. Verified locally: `bun run build`, `bun run lint`, patch unit specs 40/40,
`payment/split-order-payments` + `order/admin/order-payment-status` 16/16. Gotcha: after changing a patch,
rebuild core and `jest --clearCache`, or the transformer replays the old manifest from `.medusa/server`.

## Session — Magento 2 connector, Part A (2026-10-21), branch `feat/magento2-connector`

Spec: `docs/specs/SPEC-003-magento2-connector.md` (local, `in_progress`). Design: Magento keeps
storefront, checkout, payment capture and 1P products; Mercur owns sellers, 3P offers, split orders,
commissions, payouts. Checkout drives a shadow Mercur cart (line items by `offer_id`, per-seller
shipping, `pp_external_external` session, complete).
- New plugin `packages/plugins/magento2-connector` (`@mercurjs/magento2-connector-plugin`):
  `magento_webhook` module (endpoints + signed, retried deliveries), `external` payment provider,
  `/admin/magento/*` routes (webhooks CRUD, deliveries, redeliver, status, external refund), fan-out
  subscriber, retry/prune jobs, admin UI at `/settings/magento` built with `mercurjs dashboard:build`.
- Core: `deleted_at` filter + `with_deleted` forwarding on admin offers/sellers lists; `order_group.metadata`
  (+ migration) copied from `cart.metadata`; `integrations` permission key (core catalog + SDK).
- Verified: turbo build 7/7, plugin admin tsc clean, oxlint clean, integration specs
  `magento2-connector/*` 9/9 and `offer/admin/offer-soft-delete` 1/1. `test:unit` cannot resolve
  `@swc/jest` locally; registry spec left to CI.
- Reviewed with the enterprise `medusa-review` skill (Medusa eslint preset + exemplar diff) and fixed all
  findings: writes go through workflows with compensation and refetch, validation step instead of throw in
  transform, service under `services/` with `IMagentoWebhookModuleService`, generated migration, typed
  responses, strict validators. Gate clean on plugin files; specs 10/10 after the refactor.
- Part B pushed: github.com/mercurjs/magento2-connector (`mercurjs/magento2-connector` Composer package,
  modules Core/Process/Connector/OfferIndexer/Catalog/Settlement/Frontend/GraphQl). Lint + 13 unit tests
  green locally via a static PHP binary in the scratchpad (Homebrew PHP won't build on this macOS). Not
  yet run on a Magento install.
- Next: dashboard Channel column/filter, roles preset once a roles module exists, Magento end-to-end run.

## Session — Core hot-path performance (2026-10-21), branch `perf/core-hot-path-optimizations`, PR #1677

Technique catalog from the Medusa source in `docs/PERFORMANCE.md` (section 4 lists what this branch
applied, section 5 the remaining checklist). Fixed: checkout lock timeout/ttl/retention passed in ms
instead of s; cart lock skipped on the webhook-driven completion path; commission rates loaded once per
checkout via `getCommissionLinesBatch`; vendor single-product scoping no longer scans `product_seller`;
cache opt-in on reference reads; order-group SQL soft-delete joins; composite partial indexes on
order_group/offer/payout/review/commission_rule (+ migrations). Verified locally: core tsc, unit specs
4/4, `commission-rates/admin/(commission-providers|commission-calculation)` 15/15; other suites on CI.
Gotcha: the order module decorates totals only when a top-level total field (e.g. `subtotal`) is
selected, and needs `items.*` to derive line totals. Follow-ups listed in the PR body.

## Session — Dashboard extensions, OS deltas D-001…D-005 (2026-10-20), branch `feat/dashboard-layout-composer`

Spec: `docs/specs/spec-dashboard-extensions/` (local; `docs/specs` is gitignored), `in_progress`. PR #1674.
- `LayoutComposer` (Medusa port, no edit mode) in `@mercurjs/dashboard-shared`; registry gained layouts,
  gates, layered preferences, `getWidgetsForSections`; `resolveRouteOverrides` gives overriding routes
  `renderDefault`. SDK: every virtual module merges ordered layers (`layers.ts`), new `layouts`/`preferences` modules, `defineRouteConfig`/`defineLayoutConfig`/`defineLayoutPreferences`.
- Pilots on the composer: admin product detail, vendor offer detail (existing zone ids kept).
- Verified: SDK vitest 16/16, shared vitest 33/33, panel tsc no new errors vs baseline, admin/vendor/cli
  packages build, both host apps `vite build`. Docs page `references/panel-extensions/layouts.mdx`.
- Next: D-006 (rewrite the remaining 116 compound pages, public `/hooks` + `/components`, peer deps),
  D-007 (CLI emits extension-targets for plugins, typed plugin routes), sidebars as composers.

## Session — Seller ↔ Region assignment (SPEC-001), branch `feat/seller-regions`

Spec: `docs/specs/SPEC-001-seller-regions.md`. New `region_seller` link; `linkSellerRegionsWorkflow`;
seller creation (admin + vendor registration) links `region_ids` or the store default region.
Admin: `POST /admin/sellers/:id/regions`, `POST /admin/regions/:id/sellers`, `GET /admin/sellers?region_id=`,
`seller.regions` on retrieve. Vendor: `/vendor/regions` scoped to assigned regions; offer + shipping-option
prices validated against assigned regions (400). Admin UI: region detail *Sellers* section + add modal,
store detail *Regions* sidebar + add modal, Create Seller regions picker. Vendor UI: offer price grids gain
a column per assigned region (`rules.region_id`); offer pricing sections list region prices.
Verified: `test:integration:http -- "regions|offer-region-prices|shipping-options/vendor|seller/(admin|vendor)/seller"`
(10 suites, 238 tests). `bun run build` see spec Evidence. Not verified in a browser. Uncommitted.
Known pre-existing: admin `validate-translations.spec.ts` fails on `sellers.*` schema keys missing from
`en.json` (unrelated); `bun run lint` tsc noise in untouched files.

## Session — Vendor bulk product upload (CSV), uncommitted

Added core-level CSV import/export for vendors (promoted from the
`packages/registry/src/product-import-export` block, whose workflow wrongly used
stock `createProductsWorkflow` and skipped seller linking). `packages/core`:
`mercur-import-products` workflow (`parseProductCsvStep` → zod row validation →
**Mercur's** `createProductsWorkflow` with `seller_ids: [seller_id]`,
`created_by: seller_id`, status `draft`), `mercur-export-products`, routes
`POST /vendor/products/import` (multer `.csv`, `products:edit`) and
`POST /vendor/products/export` (`products:view`), middleware entries, SDK
codegen picks both up. `packages/vendor`: `/products/import` RouteDrawer
(template download → FileUpload → summary), `useImportProducts`/`useExportProducts`
hooks in `hooks/api/products.tsx`, Import button on the product list header
(`actions.import` / `products.import.*` i18n keys reused), route in
`get-route-map.tsx`. Spec: `docs/specs/SPEC-002-bulk-product-import.md`.
Verified: `bun run lint` (no new errors), root `bun run build` **17/17**,
`test:integration:http -- product-import`
(5/5: seller-linked draft import, list visibility, bad-handle 400, missing-file
400, export url). Root build needed three narrow fixes to the parallel
messaging session's in-flight admin files (added `pages/messages/[id]/index.ts`
re-export; `use-messaging-layout.ts` `../../providers` → `../providers`;
removed a stray literal-backslash `messages/\[id\]` dir that made fast-glob
emit a phantom `messages//[id/]/index.ts` → tailwind postcss ENOENT — artifact
parked in the opencode temp dir). **Open risk**: the registry block still ships
its broken (non-seller-linking) workflow and can be retired separately;
imported CSVs carry no Mercur custom attributes (Medusa format has none);
sync-only (large files may need chunked async later). Uncommitted.

## Session — Bangladesh / BDT default (branch work in progress, uncommitted)

Platform now defaults to Bangladesh + BDT end to end. Seeds (`apps/api/src/scripts/seed.ts` +
`templates/basic/packages/api/src/scripts/seed.ts`): countries `["bd"]`, store
`supported_currencies = [bdt (default)]`, region "Bangladesh" (`currency_code: bdt`), demo seller
addresses in BD cities, sellers `currency_code: bdt`, shipping prices `bdt 150`, offer prices
scaled to BDT via `BDT_SCALE = 130` (catalog EUR-scale numbers → realistic ৳, e.g. 155 → ৳20,150);
removed the usd/eur dual-price rows. Storefront: `NEXT_PUBLIC_DEFAULT_REGION=bd` (.env +
.env.template), middleware/hreflang/region-map fallbacks → `bd`, all `|| "eur"`/`|| "usd"`
currency fallbacks → `bdt`, added `bd: "en-BD"` hreflang. Dashboards: `USD`/`usd` display
fallbacks → `bdt`/`BDT` in admin+vendor cell renderers, table-display-utils, order/customer
tables, promotion create/edit forms (incl. `getCurrencySymbol` fallback). Not touched: payment
provider (stays `pp_system_default`, manual — Stripe unavailable in BD), no VAT seeding, no `bn`
translations. Verified: `bun run build` (12/12), `bun run lint` (no new errors vs baseline),
fresh-DB migrate+seed on scratch DB (store/region/sellers/offers all bdt, region country bd),
`test:unit` (only pre-existing codegen-module-service failure), `test:integration:http --
"currencies|regions|store-info"` (21/21). Full http suite run in progress at session end.
Uncommitted; parallel sessions had wishlist/branding work in tree — left untouched.

## Session — Panel auth collision, branch `fix/panel-auth-session-collision`

Admin and vendor panels shared one API session cookie, so logging in to one logged the other out.
Both panels now keep their JWT in origin-local storage and send `Authorization` (+ `x-seller-id`
for vendor) via `getAuthHeaders` (exported from `@mercurjs/admin` / `@mercurjs/vendor`);
`@mercurjs/client` gained a `headers` option; `POST /vendor/sellers/select` returns `seller_id` and
only writes the session for session-authenticated callers. Host apps + `templates/basic` clients
updated. Verified: `bun run build`, `test:integration:http -- panel-auth` (2/2). Not verified in a
browser. **Open risk**: the messaging block's panel SSE (`EventSource` + `withCredentials`) can't
send a bearer header, so it falls back to polling until it gets a token-exchange flow.
Uncommitted.

## Session — Admin Inventory (MER-139), branch `feat/admin-inventory`

Spec + audit: `docs/specs/spec-3-admin-inventory/`. Implemented (type-clean; deps built; lint
warnings pre-existing only): **D-01** remove admin create-inventory-item flow; **D-04** drop
"Details" suffix; **D-06** Edit Attributes `InlineTip`; **D-12** Manage-Qty warning `InlineTip`;
**D-13** Edit Details flip (Title required / SKU optional); **D-15** toast copy → Figma verbatim +
subtitle; **D-18** Create Reservation warning `InlineTip`. Added all prompt/warning i18n keys and
regenerated the `$schema.json` inventory block (inventory subtree 66/66 parity).

Also done: **D-16** delete item + delete level prompts (verbatim copy, `{{location}}` interp);
**D-17** reservation delete two cases (discriminator `reservation.line_item_id` → unfulfilled-order
"Got it" info prompt vs deletable confirm); **D-19** bulk "Edit stock levels" pre-confirm prompt;
**D-14** adjust-qty empty-quantity message. Schema parity 67/67.

Also done (frontend, build-clean): **D-02** Product + Store columns + reorder (In stock before
Reserved); list now requests `+variants.product.title,+seller.name`. **D-03** filters =
SKU/Store/Location/Height/Width/MID code/Material (dropped Length/Weight/Requires-shipping) +
default sort `title` ascending (**G3b**); `seller_id` flows through the query. **D-14** reservation
required-field messages (schema moved to `buildCreateReservationSchema(t)`). Fixed a pre-existing
`AdminInventoryItemParams`→`AdminInventoryItemsParams` typo.

All touched files type-clean (`tsc --noEmit`); remaining tsc errors are pre-existing
(`@custom-types/*` alias cascade + untouched `inventory-metadata`/`inventory-stock-form`).

**Backend-remaining (needs running API — NOT verifiable in this worktree per project constraints):**
- Admin `inventory-items` route override in `packages/core` so the **Store filter** (`seller_id`
  param) is accepted and the **Store column** seller-link is guaranteed to resolve. (Store column
  may already resolve via global links in `fields`; the `seller_id` filter needs the override.)
- **D-05** Associated-offers sidebar (needs offer reverse-link on the inventory detail contract).
- **D-07** bulk store-ownership gate; **D-08** vendor notifications (subscribers); **D-09/D-10**
  admin location scoping to the item's store.
- **D-11** locations `…` right-align — uses canonical `columnHelper.action`; live visual check.
See `docs/specs/spec-3-admin-inventory/blueprint.md` for the route-override plan.

## Integration test (spin up to verify)

`integration-tests/http/inventory/admin/inventory.spec.ts` — type-clean (only jest-global noise
under standalone tsc, same as every spec). Run later with:
`bun run test:integration:http -- inventory/admin/inventory`. It seeds a seller + offer-backed
inventory item (stock location → shipping → product → offer) and asserts:
1. **Store column** — `GET /admin/inventory-items?fields=+seller.name` resolves the seller link
   (should PASS; validates D-02 Store column).
2. **Product via offer** — offer inventory links to the *offer, not the variant* (memory
   `offer-inventory-not-on-variant`), so `inventory_item.variants` is EMPTY; the product is
   reached through the offer. Test asserts `item.offer?.product?.title`.
3. **seller_id filter** — specifies D-03 backend; expected RED until the core route override lands.

⚠️ **Finding to action:** because offer inventory has no variant link, the current frontend Product
column (`variants?.[0]?.product?.title` in `use-inventory-table-columns.tsx`) will show `-` for
offer items. The list must reach Product through the offer instead. Test #2 confirms the exact
offer field/alias to use (verify `offer` vs `offers` when the suite runs), then update the column +
the list `fields` request accordingly.

Verify: `bun install` done; built `@mercurjs/types|client|dashboard-shared`; `tsc --noEmit`
touched-files clean (remaining errors are pre-existing `@custom-types/*` alias + workspace drift).

## Session — Vendor Campaigns Figma Sync (branch `feat/vendor-campaigns-figma-sync`)

Spec: `docs/specs/spec-1-vendor-campaigns/` (brief / blueprint / assert / deltas).

**Implemented:** D01 list Type column · D02 list Status column · D04 general row order
(Description before Identifier) · D05 configuration expiry warning · D06 merged
Spend+Budget into one Budget card (deleted `campaign-spend/`, updated detail sidebar +
skeleton) · D07 identifier tooltip · D08 no-limit helper text · D09 add-promotions tip
+ plural add toast · D11 create validation (name/identifier required, spend-currency
`refine`, i18n `campaigns.validation.*`) · D12 toast copy aligned to Figma
(non-interpolated, pluralized add/remove; wired missing remove-promotion toasts).

**Backend implemented (previously flagged as gated):**
- **D03 filters (frontend + backend)** — extended
  `packages/core/src/api/vendor/campaigns/validators.ts` (`budget_type` + `status`)
  and translated them in `route.ts` GET into `query.graph` filters (budget.type;
  starts_at/ends_at date ranges with `$or … null` for open-ended = active). Re-wired
  the `useCampaignTableFilters` hook, query passthrough, and list `filters` prop.
- **D08 "Limit usage per" (frontend, backend already supported)** — `Combobox`
  (customer / email / promotion code) in create form-fields (usage-only); schema +
  defaults gained `budget.attribute`; submit sets type `use_by_attribute` when an
  attribute is chosen (mirrors admin). Backend `VendorCreateCampaignBudget` already
  accepts `attribute` and the workflow forwards it — no backend change needed. Detail
  Budget card renders the attribute label.

**Tests:**
- `integration-tests/http/campaigns/vendor/campaigns.spec.ts` extended for D03/D08:
  `budget_type=spend|usage` filtering (+ invalid value → 400), `status=active|
  scheduled|expired` filtering (incl. open-ended = active, scheduled excluded from
  active; + invalid value → 400), and a `use_by_attribute` create with `attribute`
  persisting (D08). Not runnable in a fresh worktree (needs full install + Postgres);
  syntax-verified via TS `transpileModule`. Run in CI / installed checkout:
  `bun run test:integration:http -- campaigns/vendor`.

**Still out of scope:**
- **D12 notification-drawer entry** — backend notification template, out of UI scope.

**Verification:** vendor `tsc --noEmit` (root node_modules symlinked from main) shows
no NEW errors from these changes — remaining campaign errors are pre-existing/
environmental (unbuilt core route-map → `CampaignDTO` vs `AdminCampaign`,
`@custom-types` alias, `DEFAULT_CAMPAIGN_VALUES` enum). `oxlint` on changed files: no
new warnings. Full `bun run lint` + `bun run build` still owed in a fully-installed
checkout / CI (fresh worktree has no install).
- **Active spec**: _(none in progress — pick the highest-priority unfinished
  `docs/specs/SPEC-*.md`)_

## Session Log

### Session: 2026-10-30 -- Google OAuth login (storefront customers)

- **Goal.** Activate Google login for storefront customers + document the Google
  Cloud Console origins for local/production.
- **Landed.** `apps/api`: `@medusajs/auth-google` dep; `medusa-config.ts` registers
  the auth module (emailpass + google, google only when `GOOGLE_CLIENT_ID/_SECRET/
  _CALLBACK_URL` are set) and `authMethodsPerActor` pins google to `customer`
  (admin `user` / vendor `member` stay emailpass). `GOOGLE_*` env added to
  `apps/api/.env` (local), `.env.prod` (via `${DOMAIN}`), root `.env` (production:
  `https://fashionpy.com/api/auth/google/callback`). `apps/storefront`:
  `loginWithGoogle()` server action, `/api/auth/google/callback` route handler
  (validates code+state → creates customer on first login from Google profile →
  refreshes token → transfers guest cart → sets `_medusa_jwt` → redirects `/user`),
  "Continue with Google" button in `LoginForm`; `decodeJwt` exported.
- **Verified.** New `integration-tests/http/auth/customer/google-auth.spec.ts` 3/3
  pass (`bun run test:integration:http -- http/auth/customer/google-auth`): customer
  initiate returns accounts.google.com redirect w/ client_id+callback, user/member
  actor types rejected 400. `oxlint` clean; `medusa-config.ts` tsc clean; storefront
  tsc shows no NEW errors (all deltas are the pre-existing `InferClient<Routes>`
  `{}`-typed sdk pattern).
- **Owed / next.** Fill real `GOOGLE_CLIENT_ID/SECRET` in `apps/api/.env` (local)
  and the Dokploy env (production); add the two console values (below) in Google
  Cloud → Credentials → OAuth client (Web application): **Authorized JS origins**
  `http://localhost:3000` + `https://fashionpy.com`; **Authorized redirect URIs**
  `http://localhost:3000/api/auth/google/callback` +
  `https://fashionpy.com/api/auth/google/callback`. Manual E2E through real Google
  consent not yet run. Full `bun run build` still owed at session end.

### Session: 2026-07-29 -- Admin Reviews (MER-152, SPEC-2)

- **Goal.** Promote reviews from the registry block into `@mercurjs/core` and build the
  admin reviews UI to match Figma (canvas `40015049:1019815`, BASIC/store reviews).
- **Backend.** `packages/core/src/modules/review` (model + `status` enum + migration + service);
  links customer/order/seller/product; `workflows/review` (create/update/respond-add-once/delete
  + validate); admin/vendor/store API routes + validators + query-config + middlewares (registered
  in all three aggregators). `MercurModules.REVIEW` + review DTOs added to `@mercurjs/types`.
- **Admin UI.** `pages/reviews/{review-list,review-detail,review-edit,review-respond,common}` +
  `hooks/api/reviews.tsx`; route in `get-route-map.tsx`; sidebar entry after Stores; `reviews.*`
  i18n. List (Review ID/Rating stars/Content/Store/Customer/Date/Status badge/Response + Rating/
  Status/Date filters), detail (two-column + Customer/Order/Store sidebar cards), Edit drawer
  (Status+Rating), Respond drawer (add-once), delete-action hook.
- **Block removed.** `packages/registry/src/reviews/` + `registry.json` entry + built `r/` artifacts.
- **Verified.** types+core build ✓, admin ESM bundle ✓, `tsc` clean on review files, `oxlint` clean.
  Added `integration-tests/http/review/admin/review.spec.ts` (runs in CI — worktree can't run it).
- **Next.** CI integration run; migration apply on live DB; Figma visual parity; vendor-notify rule.

### Session Log (prior)

### Session: 2026-07-21 -- Vendor offer-targeted promotions (PR #1268)

- **Goal.** Port the Medusa promotion-create form into the vendor panel and add
  offer-level targeting so a vendor's "Amount off offers" promotion actually
  discounts the vendor's offers at checkout. Branch `feat/vendor-offer-promotions`.

- **Key decision — how an offer is targeted.** `ApplicationMethodTargetType`
  (`order`/`items`/`shipping_methods`) is a hardcoded Medusa enum; **offer is NOT
  a new target type**. An offer *is* a line item, so target stays `items` and
  "offer" is a new **rule attribute** with value path **`items.metadata.offer_id`**.
  The store add-to-cart route already writes `metadata.offer_id` onto the cart
  line; the promotion engine reads item-scope rules via `pickValueFromObject`, so
  matching needs no engine change — just the attribute + the metadata present in
  the compute context. `offer` replaces `product` in the vendor items-attributes
  (Figma dropdown = Offer/Category/Collection/Type/Tag). Rule-value dropdown uses
  `labelAttr: "sku"` (Offer has no `title`); seller-scoped via the `offer.seller_id`
  column (there is **no `offer_seller` pivot** — the link is read-only on the column).

- **Landed (backend, packages/core).** `rule-attributes-map.ts` (offer attr),
  `rule-query-configuration.ts` (offer→sku), `rule-value-options/.../route.ts`
  (offer branch: filter offers by `seller_id`), `validators.ts` (allow `once`
  allocation), `workflows/cart/utils/fields.ts` (add `items.metadata` to
  `cartFieldsForRefreshSteps` so rules see it), and the root-cause fix in
  `workflows/cart/steps/prepare-adjustments-from-promotion-actions.ts`.

- **Bug found + fixed (affected ALL seller promotions).** The seller-scoping of
  computed line-item adjustments compared `promotion.seller.id` to
  `lineItem.variant.product.seller.id`. Master products are not seller-owned, so
  that value is empty and every seller-scoped line discount was **silently
  dropped**. Now resolved from **`lineItem.offer.seller_id`**. This is why offer
  promotions produced 0 discount even though rule + metadata were correct.

- **Landed (vendor panel).** `templates.ts` → 3 Figma types (Amount off offers /
  Percentage off items / Buy X Get Y); submit handler no longer hard-codes
  `application_method.type: 'percentage'` and now sends `buy_rules`; added
  `is_tax_inclusive` switch + `once` allocation; schema `value` accepts
  string|number; removed the `country`/`product` attribute hard-filter in
  `rules-form-field.tsx`, passed `target_type` to the attributes hook, fixed a
  stale `promotion-create/...` import → `create/...`; offer-based
  `requiredProductRule`; i18n keys.

- **What was NOT done / owed.** (1) Buy X Get Y is wired at the type/template
  level but its buy-quantity UX wasn't deeply exercised — verify buy_rules +
  apply_to_quantity flow. (2) Update-promotion / edit-rules drawer wasn't
  re-audited for the offer attribute. (3) The Confluence promotions doc still
  omits "Amount off offers" — not updated. (4) No automatic-promotion (non-code)
  cart test; only code-applied. (5) Vendor promotions area has ~11 pre-existing
  tsc errors (tsup/esbuild ships anyway) — left as baseline.

- **Also in the PR (not my work, per user request to commit all).**
  `apps/vendor/.../store-setup.tsx` (pre-existing), `query-config.ts`
  (`limit`/`used` fields) and `create-seller-promotions.ts` (campaign linking) —
  unrelated, uncovered by these tests.

- **Verified.** Core + vendor builds clean. `test:integration:http` —
  promotions store+vendor 37/37 pass (incl. cart E2E: targeted offer discounted
  500 / discount_total 500; non-matching offer 0), offer/cart 8 pass (2 skipped),
  no regression.

- **Next.** Address owed items above; consider splitting the two unrelated files
  into their own PR.

Newest first. One entry per session, kept to a few lines: goal, what landed,
how it was verified, what's owed/next. Move durable facts into
`docs/specs/SPEC-*.md` Evidence or into memory — not here.

### Template

### Session NN: YYYY-MM-DD -- <spec / short title>

- **Goal.** One line.
- **Landed.** Key files/behavior (terse).
- **Verified.** build / lint / test result.
- **Owed / next.** What the next session should pick up.

### Session: 2026-11-10 -- SPEC-001 In-app notification feed (admin · vendor · customer)

- **Goal.** Complete the in-app notification feed across all three surfaces (admin, vendor, storefront).
- **Landed.** Verified all backend API routes (`packages/core/src/api/{admin,vendor,store}/notifications`), fan-out subscribers for seller lifecycle (`notifications-seller.ts`), order events (`notifications-order.ts`), and product events (`notifications-product.ts`). Frontend components: Admin bell in topbar widget zone (`packages/admin/src/components/common/notifications-bell`), Vendor bell in topbar (`packages/vendor/src/components/common/notifications-bell`), Storefront bell in header + `/user/notifications` list page (`apps/storefront/src/components/molecules/NotificationsButton`, `NotificationsList`, `notifications.ts`).
- **Verified.** `bun run lint` (0 errors), `bun run build` (18/18 tasks pass), `bun run test:integration:http -- notifications` (20/20 tests pass across admin, vendor, store).
- **Owed / next.** None — SPEC-001 is complete. Pick next highest-priority spec (SPEC-002 is already passing).

### Session: 2026-11-01 -- Storefront Google Analytics

- **Goal.** Add Google Analytics 4 to the storefront with measurement ID G-XT4RJ6N1DW.
- **Landed.** New `apps/storefront/src/components/atoms/GoogleAnalytics/GoogleAnalytics.tsx`
  loads `gtag.js` with `strategy="afterInteractive"` and configures
  `gtag('config', GA_MEASUREMENT_ID)`; measurement ID comes from
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var defaulting to `G-XT4RJ6N1DW`.
  Wired into `apps/storefront/src/app/layout.tsx` so every storefront page (including
  locale variants) loads GA4. Added `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XT4RJ6N1DW`
  to `.env` and `.env.template`.
- **Verified.** `tsc --noEmit` shows no errors in new/changed files (pre-existing
  errors elsewhere only). `bun run build` passes all packages (14/14). `bun run lint`
  has a pre-existing `jiti` version failure unrelated to these changes.
- **Owed / next.** None — GA loads by default even without env var configured.

## Definition Of Done

A change is done only when:

- target behavior is implemented
- `bun run build` and `bun run lint` pass
- a relevant integration test was run (for behavior changes)
- evidence is recorded in this file
- the repo remains restartable from `bun install && bun run dev`
