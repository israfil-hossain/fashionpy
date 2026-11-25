# Claude Progress -- Mercur.js

This is the session log and current-state tracker. Keep it short: prune old
session detail aggressively. The per-spec source of truth lives in
`docs/specs/SPEC-*.md` (status + Evidence) — this file is just the running log.

## Session — Seller storefront design (2026-11-25), `main`

SPEC-023 (`docs/specs/SPEC-023-seller-storefront-design.md`, `in_progress`) —
sellers can now arrange their own customer storefront from the vendor panel and
preview it live:

- Shared contract `packages/types/src/seller-storefront.ts` stores the layout in
  `seller.metadata.storefront_layout` (the single global Medusa store belongs to
  the admin homepage editor). Five seller blocks: featured products, new
  arrivals, all products, reviews, contact.
- Storefront `/{locale}/sellers/{handle}` now renders `SellerSections` in the
  saved order; a URL-encoded `?layout=` draft override makes the vendor iframe
  preview use the exact same renderer as the customer page.
- Vendor panel gained Settings → Storefront design (plus a Store header action):
  drag-to-reorder + enable switches, Save via `useUpdateSeller`, and a live
  iframe. Storefront URL/locale are Vite defines with localhost/bd defaults.
- Evidence: lint 0; new unit spec 5/5; storefront + vendor builds pass; tsc has
  no new errors in touched files; translation schema check only the two known
  pre-existing missing keys. New integration spec added but not run locally
  (no test DB); browser smoke pending. SPEC stays `in_progress` until then.

## Session — Offer availability with multi-channel key (2026-11-25), `main`

SPEC-022 (`docs/specs/SPEC-022-multi-channel-offer-availability.md`,
`passing`) — user asked why a product with valid offers still shows NOT
AVAILABLE. Data check on the affected DB showed 4 live BDT-750 offers, 200
units stocked, seller/region links intact; the publishable key, however, is
attached to two sales channels. `wrapOffersWithInventoryQuantityForSalesChannel`
threw on that ambiguity, the storefront swallowed the 500 as `offers: []`, and
the buy box had no winner. Fixed by resolving all key channels and unioning
their stock locations (keeping the single-channel paths unchanged), and by
logging storefront offer-fetch failures.

- Deliberately did NOT remove the extra sales channel from the key: it holds
  vendor stock locations, so removing it would hide those products.
- Evidence: new resolver unit spec 4/4; lint clean; core tsc clean; core and
  storefront builds pass. Live API re-test needs a restart of the running
  `medusa develop` process, so it was left for deploy.

## Session — Hero search removed (2026-11-25), `main`

Removed the `SearchBar` overlay from `HeroCarousel.tsx` (import, bottom
overlay and the mobile pagination offset that made room for it). No other
hero/section uses it. Lint, storefront tsc (touched file) and storefront build
pass.

## Session — Studio Rail controls (2026-11-25), `main`

SPEC-021 (`docs/specs/SPEC-021-studio-rail-controls.md`, `passing`) — three
user-reported Studio Rail issues:

- Removed the drawn SVG hanger everywhere (component, render, CSS, rail bar,
  hanger hover/reduced-motion rules and mobile sizing). Uploaded product
  photos keep their own hanger.
- The shared admin/vendor Studio Rail section now offers a thumbnail picker
  backed by the product's own media (gallery + thumbnail) for the resting,
  front and back images, with a "None" fallback. Legacy external URLs stay
  selectable as "Current image".
- Categories are configurable: an admin "Show in Studio Rail" switch writes
  `metadata.show_in_studio_rail`, and flagged active categories become their
  own storefront tabs (`category:<id>`). Legacy Men/Women/Baby matching still
  works, flagged legacy categories aren't duplicated, and category-page
  gating still walks ancestors.

- Evidence: lint clean; new vitest suites 8/8; tsc clean in touched files;
  dashboard-shared/admin/vendor/storefront builds all pass. Local browser
  check unavailable (the seeded studio-rail product has no local sales
  channel/price so the store endpoint returns no products).

## Session — Dashboard console errors (2026-11-25), `main`

SPEC-020 (`docs/specs/SPEC-020-dashboard-console-errors.md`, `passing`) — user
reported console errors from the admin panel. Two real app bugs were behind
them:

- **Region seller removal 400 / uncaught promise**: the region detail page let
  an admin unassign a store from its only region; the backend correctly refused
  with 400 and `mutateAsync` rejected unhandled. The row action is now disabled
  with a tooltip when the seller has one region, bulk removal skips those
  sellers with a warning, and both region/store detail pages catch mutation
  failures and toast a translated message instead of leaking a rejection.
  Sellers are now fetched with `regions.id` so the guard has data.
- **Stock location 404s**: the marketplace store row still references a
  soft-deleted `sloc_…`; `GET /admin/stock-locations/:id` 404s for it (verified
  live). `MarketplaceGeneralSection` now resolves the default location through
  the list endpoint (`?id=…`), which returns 200 with an empty list. A
  subscriber on `stock_location.stock-location.deleted` clears
  `store.default_location_id` for future deletions; both query clients no
  longer retry 404s.
- Also silenced the JSON drawer `DialogContent` accessibility warning (admin +
  vendor) and the React Router `HydrateFallback` warning via root-route
  fallbacks.

- Evidence: `bun run lint` clean; subscriber unit 3/3; removal-helper vitest
  4/4; core tsc clean, admin/vendor tsc clean in touched files; core/admin/
  vendor builds pass individually (repo-wide build timed out under heavy host
  load); live API probe confirmed detail 404 vs list 200 for the deleted
  location. Existing stale production row still needs clearing in store
  settings.

## Session — Per-task AI models (2026-11-24), `main`

SPEC-017 (`docs/specs/SPEC-017-per-task-ai-models.md`, `in_progress`).
Split the single shared AI model into three admin-configurable slots:
`admin_text`, `vendor_text` and `vision`, each with its own provider, base URL,
encrypted key, temperature and max tokens. Unset slots fall back field-by-field
to global → panel slot; storefront chat/STT stay on the global model.

- Storage: `chatbot_settings.task_models` jsonb + migration
  `Migration20261124000000`; resolution helpers in
  `modules/chatbot/task-models.ts`; keys encrypted, DTO exposes `api_key_set`.
- Routing: `loadAiRuntime(container, task, fallbackTask)` and
  `completeJson({ task, fallback_task })`; generators select `vision` when
  images are present, with the panel task as fallback. Admin/vendor/blog/
  follow-up routes pass their task explicitly.
- Admin Settings → AI Chatbot now renders one editable/testable card per slot;
  the old "same model powers everything" note was replaced.
- Evidence: 8 task-model unit tests pass; lint clean; types/core/admin builds
  clean. Integration spec extended with wire-model assertions but could not run
  locally (no test DB). SPEC stays `in_progress` pending CI.

## Session — Bangladesh delivery charges (2026-11-24), `main`

SPEC-016 (`docs/specs/SPEC-016-bangladesh-delivery-charges.md`, `in_progress`).
Implementing the Bangladesh delivery-charge rules: 60 BDT inside Dhaka / 120
outside, weight increments on top in both zones, seller + offer base overrides,
one charge per platform-warehouse shipment vs per seller store, a separate
platform order for the warehouse charge, and an admin-configurable 12 BDT
warehouse fee recorded as a seller commission line. Config lives in store
metadata under `delivery_pricing` with typed defaults in `packages/types`.

- Pure resolver + grouping unit tests are in place: 32 cases passing
  (`bun run test:unit -- --testPathPatterns=delivery`).
- Cart quote grouping, shipping-method application (with re-apply after Medusa
  refresh), checkout platform order for the warehouse charge, admin-controlled
  12 BDT warehouse-fee commission line and admin/vendor config forms are wired.
- Evidence: `bun run lint` clean; types/core builds clean; admin/vendor tsup
  builds clean with 8 GB heap. Full turbo build hit a parallel-worker heap limit
  in this environment. Integration spec added but could not run locally (no
  test DB connection); left for CI. SPEC-016 stays `in_progress` until the
  integration verification runs.

## Session — Inventory title + delete diagnosis (2026-11-24), `main`

SPEC-019 (`docs/specs/SPEC-019-inventory-title-and-delete.md`, `passing`) —
user reported blank/product-name-less Title and an unusable Delete in inventory.

- Root cause of Title: `createOffersWorkflow` stores the **variant** title
  (`EU 40`) as `inventory_item.title`; the product name only exists at
  `offers[0].product_variant.product.title`. The admin/vendor Title cells now
  resolve that relation (with `variants.product.title` fallback) and show the
  product name plus the variant as a secondary label; Product cells use the
  same resolver. Added `+variants.product.title` to both list queries.
- Delete: API probes showed DELETE works (200) for clean, offer-linked and
  seller-linked items. A greyed-out Delete is the RBAC right
  `inventory_items:manage` missing; genuine API failures are reservations
  (`reserved_quantity > 0`) or a missing seller link on vendor routes. Custom
  disabled tooltips are now preserved so the menu says which right is needed.

- Evidence: lint 0; admin/vendor builds clean; API field probes 200; all probe
  data cleaned up / real item restored.

## Session — PDP share popover + jump links (2026-11-23), `main`

SPEC-018 (`docs/specs/SPEC-018-pdp-share-and-jumps.md`, `passing`) — three
user-reported PDP issues:

- `ProductShare` now renders only a Share toggle; copy/WhatsApp/Messenger live
  in a popover that closes on outside click or Escape. Copy keeps a "Copied!"
  confirmation.
- Added client `ProductJumpLink` (re-dispatches `hashchange` so repeat clicks
  work) and used it for the description **View more** and delivery teaser
  **View details** links. Gave the full description section a real `id`
  (it previously only had a `data-testid`, so the anchor went nowhere) and
  scroll margins for the sticky header.
- `ProductTabs` now tracks a scroll signal so a jump to the already-active
  About tab still scrolls; delivery jumps select the Delivery tab and scroll
  the tabs container.

- Evidence: lint 0; storefront tsc only the 112 known pre-existing errors;
  storefront build 3/3; Playwright at 1440px and 375px confirmed hidden-by-default
  share actions, clipboard copy, popover close, both jumps landing ~68px below
  the compact header, and Delivery tab selection.

## Session — Compact header on downward scroll (2026-11-23), `main`

SPEC-017 (`docs/specs/SPEC-017-compact-header.md`, `passing`) — user asked that
scrolling down hide the announcement, utility and navigation rows, leaving only
the logo header. Added client `HeaderShell` around the sticky `<header>` with a
direction-aware `data-compact` flag (threshold 80px, restores on upward scroll);
added `header-announcement`/`header-utility`/`header-nav` classes and CSS that
collapses those rows to height 0 with an opacity transition. A 450ms settle lock
avoids scroll-anchoring feedback from flipping the state.

- Evidence: lint 0; storefront tsc only the 112 known pre-existing errors;
  storefront build 3/3; Playwright at 1440px and 375px confirmed compact state,
  all three bars at height/opacity 0, logo row at `top: 0`, and full restore on
  scroll up.

## Session — Announcement bar to top of header (2026-11-23), `main`

Swapped the order in `Header.tsx`: `AnnouncementBar` now renders before
`UtilityBar`, so it is the first (topmost) bar in the sticky header on both
desktop and mobile. Verified in the browser on `:3000`: header children tops
`announcement 0, utility 28, header-top 68, navbar 132` at 1440px, and the
announcement is the only visible bar at 375px. `bun run lint` 0; storefront
tsc only the 112 known pre-existing errors; storefront build 3/3.

## Session — Product card hover image + full-product fit (2026-11-23), `main`

SPEC-016 (`docs/specs/SPEC-016-product-card-hover-and-fit.md`, `passing`) —
user-reported product card issues fixed:

- `ProductCard.tsx` used a single thumbnail with `object-cover`,
  `hover:scale-110` and fixed 4:3/3:4 boxes — it cropped products and had no
  second-image hover. Replaced with an `aspect-square` media box,
  `object-contain`, no zoom, and a stacked second `<Image>` that crossfades in
  on hover/focus (first gallery URL differing from the thumbnail). Cards with
  one image never fade out; the hover layer is decorative.
- Removed the now-unused `imageAspect` prop from the two call sites in
  `BestDealsSection` and `TabbedProductGridClient`.
- Evidence: `bun run lint` 0; storefront tsc only the 112 known pre-existing
  errors; storefront build 3/3; Playwright on `:3002`: 250×250 media box,
  `object-fit: contain`, no transform, `-1.png → -2.png` hover swap with
  opacity `1/0 → 0/1`, single-image cards unchanged.

## Session — Studio rail opt-in, dedicated imagery, 3D hanger turn (2026-11-23), `main`

SPEC-015 (`docs/specs/SPEC-015-studio-rail-opt-in.md`, `passing`) — four
user-reported items:

- Whole storefront background is white below `md`: home page main is now
  `bg-white md:bg-[#FFF5F8]`, plus a mobile rule in `globals.css` forcing
  `body`/`main[class]` white.
- Admin + vendor product detail pages render a shared `StudioRailSection`
  (`packages/dashboard-shared`) with a yes/no Switch and three image URL
  fields. Save writes `show_in_studio_rail`, `studio_rail_thumbnail`,
  `studio_rail_front_image`, `studio_rail_back_image` to `product.metadata`.
- `StudioRail.tsx` now fetches `metadata`, includes only products explicitly
  switched on, and prefers the dedicated thumbnail/front/back images with
  gallery fallbacks — fixes the "no front/back image" report for products that
  have no gallery images.
- Garment now turns 180° on its hanger on hover (`rotateY` + backface culling,
  springy settle, hanger counter-swing, shadow reaction); reduced motion keeps
  a crossfade. Removing `isolation: isolate` from the 3D garment was required
  or the front face vanished at full rotation. SPEC-008 hover text updated.

- Evidence: `bun run lint` 0; storefront tsc only the 112 known pre-existing
  errors (none touched); build log clean for all packages that finished;
  Playwright on `:3002` with temporary seeded metadata (reverted after):
  opt-in filtering (3 slides), dedicated thumbnail/front sources, hover
  back `1→0` / front `0→1` / garment 180° matrix, quick view Front|Back with
  dedicated front, mobile home body+main `rgb(255,255,255)`.

## Session — Product SKU generation + publish/review clarity (2026-11-23), `main`

- AI product drafts now apply the per-variant SKUs the model returned; the
  form used to ignore `draft.variants[].sku` whenever option axes existed, so
  AI-created multi-variant products had blank SKUs. The draft-level SKU still
  seeds the single-variant case.
- `createProductsWorkflow` now generates a deterministic SKU from the product
  handle + option values when a variant is created without one (explicit SKUs
  are reserved first, collisions get a numeric suffix). This also fills the SKU
  that the offer create form prefills from the master variant.
- Vendor product create now labels the submit button "Submit for review" when
  the product-request flag is on, matching the `proposed` status the POST sets.
- Availability/delivery note: a vendor product becomes buyable only after an
  offer (price + stock) exists, and delivery needs a seller service zone with a
  shipping option priced in the storefront region currency (BDT). The local
  `FashionPy` seller warehouse has no fulfilment set/service zone yet.
- Evidence: `bun run lint` exit 0; core build clean; new SKU integration case
  `product/admin/product-publish-and-sku.spec.ts` 4/4; admin/vendor
  `variant-sync.spec.ts` 7/7 each (vitest).

## Session — Inventory stock crash + AI image upload limit (2026-11-23), `main`

Two user-reported issues on the dashboards:
1. **Inventory stock / deletion crash** — deleting an offer left its
   `offer ↔ inventory_item` link rows behind (`deleteOffersWorkflow` only
   dismissed seller/product links). Querying those items with
   `fields=…,offers.seller_id` then returned `offers: [null]`, and the admin
   stock modal read `offer.seller_id` unguarded. Fixed the root cause by
   dismissing inventory links in `deleteOffersWorkflow`, and made the stock
   modal + offer/inventory list views skip null relation entries so already
   orphaned rows don't crash the UI.
2. **AI product create “request entity too large”** — the draft POST sent
   base64 image data through the default ~100 KB express JSON limit. The
   admin/vendor `/products/ai/draft` routes now opt into a 32 MB body parser.

- Evidence: new integration case in
  `integration-tests/http/offer/admin/offer-soft-delete.spec.ts` (deleted
  offer → linked inventory item comes back with `offers: []`) passes
  (`2/2`); `bun run lint` exit 0; `packages/core` build clean; admin/vendor
  `tsc --noEmit` shows only the pre-existing errors and none in the touched
  files.

## Session — Chatbot repeated product list + question quality (2026-11-22), `main`

SPEC-013 (`docs/specs/SPEC-013-chatbot-repeat-context.md`, `passing`) — two
user-reported issues fixed: the product list re-appeared on every question,
and AI questions re-asked known info / went out of context / stacked multiple
questions / mixed Bangla+English.

Three compounding root causes, all fixed:
1. **No card memory** — history replay dropped cards and the old default
   prompt told the model to search whenever products came up, so every turn
   re-ran `search_products` and persisted a fresh full card set per assistant
   message. New `packages/core/src/chatbot/prompts.ts`: `replayHistory`
   annotates assistant messages `[Shown cards: …]`, `buildSystemMessage`
   adds "Products already shown earlier: …" + always-appended
   `BEHAVIOR_RULES` (one question per reply, never re-ask known info, never
   re-run a visible search, single-language replies, phase-aware asks) —
   appended even over an admin system-prompt override. `search_products`
   tool description tightened to "only NEW query".
2. **History window bug** — `listMessages` did `ORDER BY created_at ASC
   LIMIT n` → the **oldest** n rows, so past 24 messages the model was blind
   to its own recent replies (the main driver of out-of-context/repeated
   questions). Now `desc + limit` then reverse (latest-N, chronological);
   also fixes the store history GET, admin transcript, and admin follow-up
   draft.
3. **Refetch after every send** — the widget history effect listed `busy` in
   its deps, so each send replaced the whole transcript and re-rendered every
   past card list. Now fetches on panel open + tab focus only.

- Evidence: unit `bun run test:unit chatbot` **8 suites / 54/54** (new
  `prompts.unit.spec.ts` 7 cases); integration `bun run test:integration:http
  -- chatbot` **5 suites / 30/30** (first run failed 3 suites against stale
  `.medusa` build output — rebuilt `packages/core`, then green; new cases:
  latest-N `listMessages` ordering, turn-2 system message contains rules +
  `[Shown cards: …]` + shown-product titles); `bun run lint` exit 0;
  `bun run build` **19/19**.

## Session — Studio rail hover crossfade + hanger refresh (2026-11-22), `main`

SPEC-008 (`docs/specs/SPEC-008-studio-rail-quick-view.md`, still `passing`,
`last_updated` bumped) — user-reported hover image overlap fixed.

- **Root cause**: only `.studio-rail__image--front` animated; the original
  photo stayed at opacity 1 and both layers used `mix-blend-mode: multiply`,
  so hovering composited the two photos into a ghosted double-exposure.
- **Fix**: `StudioRailClient.tsx` marks the base image `--back` and the slide
  `data-has-front`; `globals.css` fades `--back` out on hover/focus for slides
  that have a front layer, isolates the garment, and makes the front layer
  opaque + above the base. Single-image garments keep their photo on hover.
  `HangerFrame.tsx` now renders a slim matte-metal hanger, preserving the
  `(105, 11)` hook-centre math used by the rail CSS.
- **Verified**: `bun run lint` 0; storefront `tsc --noEmit` only the 112
  pre-existing errors (none in StudioRail); storefront build 3/3. Playwright
  on the category rail (`localhost:3001/bd/categories/men`, API on :9000):
  back/front opacity `1/0 → 0/1 → 1/0`, single-image back stays `1`; clean
  before/hover screenshots and new hanger legible at desktop + 375px.
- **Env note**: port 3000 is a different project's server; this storefront was
  started on port 3001 and the Medusa API on 9000 for the check.

## Session — Re-infected remote cleaned + forced push (2026-11-22), `main` `203b1b72b`

Dokploy deploy failed with `child.stdin.unref is not a function` from `packages/types/init` — the 2026-11-09 host malware had re-injected the remote repo (all 4 remote branches): 26 `init` files, `node init &&` in every package.json `build`/`dev`, CRLF churn, and the XOR/obfuscated payload appended to `apps/storefront/postcss.config.mjs` (marker `var bx = '-7406'`, C2 `95.135.181.84`). Local repo and all local branches were clean; remote `main` `1636d651c` was a contaminated rewrite of local `d8dcaae59` with identical parents.

- **Host containment**: active C2 process (`~/.node_modules/.npm-ws-runner.js`, PID killed) and its `.npm-ws.json` quarantined to `~/Malware-Quarantine-2026-11-22/` (mode 700); no respawn after 75 s. The two `gvfs-network` crontab entries remain — `crontab` is EPERM under this tool's sandbox and the referenced `cron-watch.sh` is absent, so they are currently no-ops, but **the user must purge them from their own Terminal**: `crontab -l | grep -v gvfs-network | crontab -`. Rotate the high-value secrets again (C2 had a fresh window).
- **Fix**: committed the chatbot fixes (`203b1b72b`) on clean `main`, then `git push --force-with-lease` for `main` + the 3 feature branches. Verified all 4 remote branches: 0 `init` files, 0 `node init` scripts, clean `postcss.config.mjs`; `fashionpy/main == HEAD == 203b1b72b`. Working tree clean. User should re-trigger the Dokploy deploy.

## Session — Chatbot cards JSONB fix + product search relevance (2026-11-22), `main`

SPEC-012 (`docs/specs/SPEC-012-chatbot-cards-search-relevance.md`, `passing`).
Two user-reported issues fixed:
1. **JSON error after product cards**: `appendMessage` bound the cards **array**
   straight into the `jsonb` column. `pg` serializes arrays as PostgreSQL array
   literals (`{"..."}`), not JSON — every successful product search 400'd in
   the route's catch block. Now `JSON.stringify` before insert.
2. **"shoes showed all products"**: `search_products` did a literal `$ilike` on
   the raw user phrase over title/description. New
   `chatbot/tools/search-relevance.ts` normalizes text (EN+BN stopwords),
   expands synonyms (shoes → sneaker/sandal/boot/runner/…), queries matching
   categories, and scores candidates by title/category/type/tag matches —
   description-only hits are dropped when strong matches exist.

- Evidence: unit `search-relevance` 10/10, unit `chatbot` 47/47, integration
  `-- chatbot` 5 suites / 28 passed (2 new cases), lint 0, build 19/19
  (`--concurrency=1`; default concurrency timed out under unrelated host load).

## Current Verified State

- **Repository root**: `/Users/israfil/Proejcts/fashionpy/mercur`
- **Current branch**: `main` (SPEC-011 merged `a679b84ba`, provider fix
  merged `b8fe49533`; user-panel work below on `fix/storefront-user-panel`;
  last push `b8fe49533`)
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
- **Storefront (sibling repo `../fashionpy`)**: Studio Rail section shipped for
  clothing categories only (Men/Women/Baby gate). Supporting fix in this repo:
  `packages/core/src/api/store/products/validators.ts` accepts `country_code`
  again (it was dropped vs vanilla Medusa 2.22, breaking every storefront
  product fetch). Package rebuilt with `bun run build` in `packages/core`.
  (Committed and pushed to `main` on 2026-11-15. The legacy root-src
  `fashionpy` checkout has a disjoint history and cannot push to this remote —
  its identical Studio Rail copy stays committed locally only.)

## Session — Storefront user panel: messages, reviews, header icons (2026-11-20), branch `fix/storefront-user-panel`

Fixed the account panel end-to-end: **messages page** crashed (it passed no
props to `UserMessagesSection`), **conversation creation 500'd** (two
graph-build-time bugs in `createConversationWorkflow`: `buildThreadKey`
baked `undefined` into `thread_key`, and `if (input.seller_id)` evaluated a
workflow proxy — always truthy — pushing a `seller_id: null` link that blew
up `LinkService.create` with `column "true" does not exist`; both now use
caller-computed values / runtime `transform`), **reviews route was a 404**
(new `/user/reviews` page backed by the personal `GET /store/reviews`
list), and the **navbar message + notification icons moved into the panel**
as a bell beside each page title (`UserPanelBell`, per the reference
design), with mobile overflow checks at 375px.

- Verification: root lint 0; root build **19/19**; storefront tsc **138**
  lines (baseline was 140 — messages TS2739 gone, no new errors);
  integration `-- messaging` **5/5** (new `http/messaging/store.spec.ts`
  covering thread-key persistence, list/thread, validation, ownership);
  browser smoke **17/17** (navbar icons gone, bell on every panel page,
  seeded conversation renders + reply round-trip, reviews empty state,
  zero horizontal overflow on messages/reviews/overview at 375px).
- Note: storefront's own `eslint .` is broken environmentally (jiti
  version conflict at config load — pre-existing); the repo gate is root
  oxlint, which is green.

## Session — Chatbot provider 429/HTML error handling (2026-11-20), branch `fix/chatbot-provider-429-retries`

Diagnosed and fixed two user-reported failures: (1) the storefront chat and
the admin "Test" button surfaced OpenRouter free-pool rate limits as a raw
JSON blob (`Chat provider429: {"error":…}`), and (2) the Test button could
render a raw `<!DOCTYPE html>` gateway page in the toast.

- Root causes: free-tier upstream throttling (`:free` models on shared
  Google AI Studio/Ant pools) with **no retry** and unbounded error bodies;
  gateway HTML error pages were embedded verbatim by both the provider
  adapter (`text.slice(0,400)`) and the admin `fetchQuery`
  (`text.slice(0,300)`); the test route's 502 body had `error` but no
  `message`, so `fetchQuery` showed a generic status line instead of the
  real reason.
- Fix: new `providers/http.ts` — `ProviderHttpError`, HTML detection,
  concise 429 formatting (surfaces `error.metadata.raw`), and
  `withTransientRetries` (2 retries, 1.5s/3s backoff, honours `Retry-After`
  capped at 5s, retries 429/502/503/504). Both adapters route through it,
  never embed HTML, and connection tests use a 15s timeout (fails before
  gateway 504 HTML pages). Test route mirrors `error` into `message`;
  admin `buildHttpErrorMessage` replaces HTML bodies with a status line.
- Verified: new unit suites **6 chatbot suites / 37 tests** + admin
  vitest 2/2; integration `-- chatbot` **5 suites / 26 passed**; live
  `POST /admin/chatbot/test` now returns a one-line actionable message
  with `message` present (retries visible as ~6s latency); lint 0; root
  build **19/19**.

## Session — SPEC-011 chatbot login gate + admin inbox (2026-11-20), branch `feat/chatbot-login-gate-admin-inbox`

Shipped the full SPEC-011: strict customer-auth gate on the storefront
chatbot (widget gate + login return `?chat=1` + WhatsApp deep link sharing
`SUPPORT_WHATSAPP` with the footer; backend 401s on guest conversation
create/messages/voice with ownership-checked history), admin **Chat Inbox**
(`/chatbot` list + transcript detail; admin follow-up send persists
`sender:"admin"` and fans out a `chatbot.followup` customer notification
linked to `/?chat=1`; AI-draft button fills the composer from the
transcript), and widget history-on-open so follow-ups are visible when the
customer returns.

- Verification: `bun run lint` 0; `bun run build` **19/19**; integration
  `-- chatbot` **5 suites / 26** (new `admin/conversations.spec.ts`, guest
  401 expectations updated, agent/checkout-tools unchanged); `--
  notifications` **20/20**; storefront tsc 140 baseline / **0** in changed
  files; admin tsc **0** in spec files; `route-parity` passes with
  `/chatbot`; browser smoke **13/13** (gate → login return → conversation →
  admin inbox → follow-up → customer notification → widget history).
- Fixes surfaced by the smoke: `SingleColumnPage` now forwards unknown
  props (8 pages declared `data-testid`; it was silently dropped);
  `LoginForm` does a full navigation after login (the client-router layout
  cache kept serving the logged-out prop); the widget re-checks the session
  via `retrieveCustomer()` on open so a stale layout can't wedge the gate.
- Known baseline: i18n parity still fails only on pre-existing `sellers.*`
  keys (unrelated); temp smoke scripts + temp DB users removed after the
  run.

## Session — Real bilingual policy content + production-ready seed (2026-11-19)

Replaced the9 placeholder policy pages with real **English + বাংলা** content
grounded in the platform's actual rules (mined from the repo: 30-day
return/exchange/claim window in `RETURN_POLICY_DAYS`, COD + Stripe card
payments, Pathao/Steadfast couriers, the seeded ৳6,500 free-delivery offer,
10% default commission, bank/bKash/Nagad seller payouts, buyer return/cancel
flows, Consumer Rights Protection Act 2009 reference):

- `apps/api/src/scripts/lib/policy-content.ts` (new) — the9 canonical slugs
  (return-refund, exchange, shipping, cancellation, privacy, terms,
  seller-policy, product-policy, pickup-delivery) with bilingual HTML limited
  to the storefront sanitizer's allowlist.
- `seed.ts` — `seedPolicyPages` is now an **upsert**: inserts missing slugs,
  refreshes rows still holding the old "coming soon" placeholder, and never
  touches admin-edited content. Idempotent (2nd run logs "already up to
  date").
- Verified locally: seed run → "9 placeholder(s) refreshed" → store API
  returns full bilingual content for all9 (2.0–4.8k chars each) → storefront
  `/bd/policies/*` renders with h2/li intact and no placeholder text →
  re-seed no-op → `oxlint` 0, `apps/api tsc --noEmit` 0.
- **Production**: the Dockerfile CMD (`db:migrate && bun run seed && start`)
  runs the seed on every boot, so the next Dokploy deploy/restart writes this
  content into production (placeholder rows refreshed; admin edits kept).
- **Follow-up — storefront copy aligned with the policies** (same day): the
  live product Delivery tab claimed **"14 days"** + "contact the seller"
  (real rule: 30 days, platform-arranged pickup) and branded "Mercur";
  `OrderReturn` had a `[14]` placeholder + dead `/returns` link; the exported
  `ProductDetailsShipping` cell still had US-template copy ("continental
  U.S.", "return the chair"); `MeetYourSeller` said "On Mercur since".
  Fixed all four → 30-day copy, Your-Orders return flow, FashionPy brand,
  links to `/policies/*` (delivery panel now links Return/Shipping policies
  + "View all store policies"). Verified live: product page HTML serves the
  new copy (turbopack's watcher had gone stale on a 10:16 `next dev` —
  recovered via Next's own config-restart trigger, `next.config.ts` probe
  reverted). `oxlint` 0, storefront `tsc` 140 baseline (0 in changed files).

## Session — Chatbot "function.arguments must be valid JSON" 400 fix (2026-11-19)

**Symptom**: `Chat provider 400: Upstream error from Ant Digital: Assistant
tool call function.arguments must be valid JSON` (model
`inclusionai/ling-3.2-flash:free` via OpenRouter) — every tool-using reply in
that conversation 400'd.

**Root cause**: the OpenAI-compatible adapter passed `tool_calls` through
**verbatim** on both receive and send. Non-standard OpenAI-compatible
upstreams return `function.arguments` as a parsed **object**; the agent loop
replays the previous completion's assistant `tool_calls` in the next request,
so the object went back on the wire and the upstream's
`JSON.parse(arguments)` failed → 400.

**Fix** (`packages/core/src/chatbot/providers/`):
- `normalize.ts` (new) — `normalizeToolCalls` / `normalizeOutgoingMessages`:
  coerce `function.arguments` to a JSON string (object → stringify,
  unparseable string → `"{}"`, null → `"{}"`), synthesize missing `id`.
- `openai-compatible.ts` — normalize on **receive** (so `dispatchTool` and
  the replay loop only ever see clean calls) and on **send** (covers every
  outgoing assistant message, including future history replay).
- `gemini.ts` — `safeJson` now accepts non-string input (an object argument
  used to be silently dropped to `{}`).
- `dispatchTool` already tolerated bad args (JSON.parse → `{}`); only the
  wire format was fatal.

**Tests**: new `packages/core/src/chatbot/__tests__/tool-call-normalize.unit.spec.ts`
(7 cases: object/string/garbage/null args, outgoing-only scope, mocked-fetch
send + receive wire assertions) — **7/7**; new integration case in
`integration-tests/http/chatbot/store/agent.spec.ts` ("replays tool_calls
with JSON-string arguments even when the model returned objects" — captures
the 2nd request body, asserts stringified args) — suite **3/3**.
`bun run lint` 0. `packages/core` rebuilt (`tsc` exit 0, `normalize.js`
emitted) and the running `medusa develop` reloaded via an `apps/api` file
touch (its watcher ignores `node_modules`/`.medusa`, so a rebuild alone
doesn't hot-reload).

## Session — Free Google voice-to-text for the chatbot mic (2026-11-19)

The widget's mic previously recorded audio and needed a paid/keyed backend STT
(OpenAI Whisper or Gemini; default `none` → dead). Now uses the **browser Web
Speech API** as the primary path — Google's own engine in Chrome/Edge, free,
no API key, no quota, no server round-trip:

- `apps/storefront/src/lib/speech.ts` — minimal SpeechRecognition types +
  `getSpeechRecognitionCtor()` + `speechLangFor("bn"|"en")` → `bn-BD`/`en-US`.
- `ChatbotWidget.tsx` — hold the mic → live transcript streams into the input
  (base text + final + interim); release → auto-sends via the existing
  `sendMessage` SSE flow (language auto-switch via `detectLocale` still
  applies). Mic-permission denial surfaces a bilingual error. Browsers
  without SpeechRecognition (e.g. Firefox) keep the old MediaRecorder →
  backend-STT fallback unchanged.
- Verified: root `oxlint` 0; `apps/api tsc --noEmit` 0 errors; storefront
  `tsc` has no errors in the new/changed files (baseline 140 elsewhere);
  Playwright smoke on `localhost:3000/bd`: `webkitSpeechRecognition`
  available, widget opens, mic hold/release runs with no error bubble and no
  new console errors (the page's 500s are pre-existing missing
  `/images/categories/*.png` assets). No storefront unit-test runner exists
  (SPEC-009's widget shipped the same way).
- **Follow-up fix (same day, "voice not working" report)** — three defects
  found via instrumented Playwright runs (wrapper logging via
  `addEventListener`, not property shadowing — shadowing
  `onresult/onend` own-props **breaks** Chrome's Web Speech event delivery):
  1. **All STT errors except permission were swallowed** (`network`,
     `language-not-supported`, `audio-capture`, …) → silent nothing.
     Now every error surfaces a bilingual message; empty transcripts show a
     "hold the mic and speak" hint; a **4 s stop-watchdog** force-finishes if
     Chrome never fires `end`, so the mic can't get stuck (stuck `recording`
     made every later press a no-op — the likely "dead mic" symptom).
  2. **Chat replies were broken for typed AND voice messages**: both Next
     proxies injected `stream: true` into the request **body**, but the
     backend reads the flag from the **query** and the strict zod validator
     rejected the body → `400 Unrecognized fields: 'stream'`. Removed from
     `apps/storefront/src/app/api/chatbot/conversations/[id]/{messages,voice}/route.ts`
     (backend streams by default). Verified: typed message → real product
     cards streamed; mocked-speech hold → interim text in input → auto-send
     → user bubble → SSE reply; empty run → Bangla hint; `oxlint` 0.
  3. Transient during testing: OpenRouter free tier returned `429
     (inclusionai/ling-3.2-flash:rate-limited)` — surfaced as a visible
     error bubble; add a personal OpenRouter key in Settings → AI Chatbot if
     it persists.

## Session — SPEC-010 admin policy pages + Google redirect_uri fix (2026-11-19)

**Google login `redirect_uri_mismatch` (Part B).** Root cause: the app sends
`redirect_uri=https://fashionpy.com/api/auth/google/callback` (from
`GOOGLE_CALLBACK_URL` in the root `.env`) but the Google Cloud Console had the
stale Medusa-native path `/auth/customer/google/callback` registered (copied
from `apps/storefront/.env:14`). Fix: console entries corrected (redirect URIs
`https://fashionpy.com/api/auth/google/callback` + `http://localhost:3000/api/
auth/google/callback`; JS origins apex/www/localhost:3000; stale entries
removed) and the unused `GOOGLE_*` trio deleted from `apps/storefront/.env` +
`.env.template`. `google-auth` integration spec still 3/3.

**SPEC-010 policy pages (`docs/specs/SPEC-010-admin-policies-pages.md`,
status `in_progress` — automated gates green, browser E2E pending).** The
storefront footer linked 10 `/policies/*` URLs that never had a route (root
not-found 404). Shipped:

- **Module** `packages/core/src/modules/policy-page` — `policy_page` table
  (slug unique, status/publish window, country_codes), migration
  `Migration20261119000000`, auto-registered like every other core plugin
  module; `MercurModules.POLICY_PAGE` + DTO/HTTP types in `@mercurjs/types`.
- **Permissions** — `policy` key (view/edit/manage, admin surface) in
  `permissions/definitions/policies.ts` + `PermissionKeys` in dashboard-sdk.
- **APIs** — admin CRUD `/admin/policies[/:id]` (`requirePermission` +
  `core-route-permissions` pattern, blog validators/query-config shape); store
  `GET /store/policies[/:slug]` with blog's published/window/country
  visibility middleware.
- **Admin UI** — sidebar **Policies** (`ShieldCheck`), route
  `/policies` (+create/+edit) gated `policy:view|edit`, `pages/policies/*`
  (list/create/edit + `policy-form` with Tiptap `RichTextEditor`),
  `hooks/api/policies.tsx`, `marketplace.policies.*` i18n (en + $schema,
  parity test).
- **Storefront** — `[locale]/(main)/policies/[slug]` (metadata/hreflang,
  sanitized rich text, `notFound()`), `/policies` index,
  `lib/data/policies.ts` (`no-store`), footer copyright link converged on
  `/policies/privacy`.
- **Seed** — 9 canonical footer slugs inserted as published placeholders,
  slug-missing-only guard, runs before the demo-sellers early return.
- **Tests** — `integration-tests/http/policies/{admin,store}` — **5/5 + 3/3**.
- **Verification**: `bun run lint` 0; `bun run build` 19/19 (route codegen +
  routes-manifest include the 4 new routes; `generate:targets` picked up the
  nav item); admin vitest route-parity passes; storefront `tsc` shows only
  baseline errors (the translation-schema `sellers.*` failure reproduces on a
  clean checkout — pre-existing).

## Session — SPEC-009 agentic ecommerce chatbot (2026-11-18), branch `main`

SPEC-009 (`docs/specs/SPEC-009-ecommerce-chatbot.md`, status `passing`) ships
the full chatbot vertical:

- **Module** `packages/core/src/modules/chatbot` — conversations, messages,
  settings (AES-encrypted provider/STT secrets), checkout state JSON,
  migration `Migration20261118000000`.
- **Agent runtime** `packages/core/src/chatbot` — OpenRouter / Gemini /
  OpenAI-compatible providers (raw HTTPS, no SDK), 14-tool allowlist
  (search → cart → address → shipping → COD/payment → review → place_order →
  order/delivery status), checkout state machine with confirmation gate on
  `place_order`, STT (Whisper/Gemini), Resend order-confirmation email
  (`order_group.created` subscriber; falls back to local notification when
  `RESEND_API_KEY` unset).
- **APIs** — admin `GET/PUT /admin/chatbot/settings`, `POST
  /admin/chatbot/test` (`chatbot:view|edit`); store
  `/store/chatbot/config`, conversations, SSE message stream, voice.
- **Admin UI** — Settings → AI Chatbot (`/settings/chatbot`), provider/model/
  key/STT/prompt form + Test connection.
- **Storefront** — floating `ChatbotWidget` on `(main)` layout (bn/en),
  product + order cards, mic voice, Next.js API proxies under `/api/chatbot/*`.
- **Verification**: `bun run lint` 0; package builds green; unit `chatbot`
  16/16; integration `-- chatbot` **4 suites / 18/18** (settings secrets,
  conversations/shipments ownership, **full tool checkout path without LLM**,
  **mocked-LLM agent message flow**). Shipping-options record flatten + cart
  `sales_channel_id` fixed during that pass. Rate-limit + shipments endpoint
  also landed.
- **Open**: live key E2E (real OpenRouter/Gemini + Resend) — operator env.

## Session — Studio rail hover reveal + product quick view (2026-11-18), branch `main`

SPEC-008 (`docs/specs/SPEC-008-studio-rail-quick-view.md`, status `passing`):
the storefront Studio Rail now crossfades to the product's front photo on
hover and opens a design-matching quick view on click.

- **Hover**: `StudioRail.tsx` computes `frontImage`/`backImage` per item
  (first image ≠ thumbnail, then next distinct; single-image → no second
  layer) from new `*images` + `variants.options.*` fields; `RailItem` stacks
  a second `next/image` layer that CSS crossfades on `:hover`/`:focus-within`
  (`globals.css`, reduced-motion aware).
- **Click → quick view** (`organisms/StudioRail/StudioRailQuickView.tsx`):
  left-click on the slide is intercepted (modified clicks keep the native
  link); dialog shows `NN / TT` counter, title, buybox-winner price, Front /
  Back tabs, option pills from variant options, offer-scoped Add to cart
  (`listOffers` server action + `getVariantOffers`/`getBuyboxWinner`, exact
  ProductBuyBox parity: loading → NOT AVAILABLE → OUT OF STOCK → enabled),
  footer title + View product page; closes on Escape/Close/backdrop and
  opens the cart drawer on success. Auto-falls back to the best offered
  variant when the default variant has no offer.
- **Verified**: `bun run lint` 0; storefront `tsc --noEmit` 0 errors in all
  StudioRail files (112 pre-existing elsewhere; `ignoreBuildErrors` is on);
  `turbo build --filter=@mercurjs/storefront` 3/3; Playwright on
  localhost:3000: hover opacity `0→1→0` with visibly different garment
  crops, quick view opens (`05 / 12`, `BDT 2,000.00`), pills toggle, Back
  tab present/absent as appropriate, offers settle `loaded-6` →
  `OUT OF STOCK`, Escape/Close/product-link all work.
- **Local caveats** (data/env, not code): only 2/51 products have offers and
  their `inventory_quantity` is 0, so the enabled-add path can't be clicked
  locally (shared helpers with the PDP cover it); jsDelivr-backed image
  optimizer is slow/timing out on this box (first QV image decode ~27s);
  seed titles are footwear while photos are the new hoodie shots; the dev
  storefront (`localhost:3000`) was started for testing and left running.

## Session — Live home-layout root cause + cache-bust hardening (2026-11-17), branch `main`

User reported three live symptoms: home-layout editor invisible in admin, no
Store Design options in the seller panel, and rearranged components not
updating the storefront. SPEC-007 Notes updated with the corrected diagnosis.

- **Symptom 1 (admin)**: false alarm — live probes proved the editor IS
  deployed (admin bundle greps: `marketplace-home-layout-*` testids,
  `storefront.revalidate`, `rankTooltip`). It lives at **Settings →
  Marketplace → Homepage layout** (below Announcement). Was checked during
  Monday's deploy outage or a stale `index.html` (served without
  Cache-Control → hard refresh).
- **Symptom 2 (seller panel)**: not a bug — "Store Design" never existed for
  sellers (zero hits in repo + git history; vendor stores API is GET-only;
  `store.metadata` writable only via admin `POST /admin/stores/:id`).
  **Decision: admin-only stays** (user-confirmed).
- **Symptom 3 root cause (code)**: both storefront readers in
  `apps/storefront/src/lib/data/store-settings.ts` destructured a `{ data }`
  wrapper that `GET /store/store-settings` never returns — the SDK resolves
  the raw `{ announcement, home_layout }` body
  (`packages/client/src/index.ts:168`). `retrieveStoreSettings` → always
  `undefined` (announcement bar never rendered); `retrieveHomeLayout` → always
  `null` (default section order forever). The `[store-settings] no
  home_layout` warn masked it as an env/row-mismatch problem (previous
  session's misdiagnosis). **Proof**: live curl with the publishable key
  returned the custom layout (`studio_rail` 2nd) while `fashionpy.com/bd`
  rendered default order + no announcement bar.
- **Hardening (approved)**: admin `useUpdateStore` now toasts
  `store.cacheRefreshFailed` when the revalidate call fails (was
  `.catch(() => {})`); the `storefront-cache-revalidate` subscriber warns once
  when `STOREFRONT_REVALIDATE_URL/_SECRET` are missing and logs non-2xx with
  status + tags (never checked `response.ok` before); the store-settings
  route warns with the store id when `metadata.home_layout` is absent.
- **Tests**: new `apps/api/.../storefront-cache-revalidate.unit.spec.ts`
  (4 cases; required a `jest.mock("@mercurjs/core/workflows")` to avoid the
  heavy import chain + a `testMatch` entry for `apps/api` in
  `integration-tests/jest.config.js`); new
  `integration-tests/http/store-settings/admin/storefront-revalidate.spec.ts`
  (401 unauth / 200 + `revalidated:true`).
- **Verified**: `bun run lint` exit 0; `bun run test:unit
  storefront-cache-revalidate` 4/4; `bun run test:integration:http --
  store-settings` → 2 suites / **5/5 passed** (355 s; one earlier combined
  attempt died to a DB-connection race with a concurrently killed run —
  environmental, not code); full `bun run build` after the change.
- **Still open**: post-deploy live re-check (announcement bar visible,
  `studio_rail` 2nd, no failure toast); Dokploy `.env` still carries
  `STOREFRONT_REVALIDATE_*` (they exist only in `.env`, not compose
  `environment:`); `api.fashionpy.com` 404s on every path — compose comments
  say the `api.` host is intentionally unrouted, confirm and retire.

## Session — P0: collection UI + rearrange reliability (2026-11-16), branch `main`

SPEC-007 (`docs/specs/SPEC-007-home-collection-ui.md`, status `passing`): the
home collection sections are compact/rounded/animated, and the homepage-layout
"rearrange not showing" report is root-caused with the propagation gap fixed.

- **Rearrange root cause (environment)**: the deployed admin writes the
  production store row (`store_01M6EJ6…`, `home_layout` saved 2026-11-16 05:52
  UTC with `studio_rail` moved to index 1) while a localhost storefront on the
  local API reads a *different* store row with no `home_layout` → default order.
  Live `fashionpy.com` still renders default order because
  **`api.fashionpy.com` is gateway-404 on every path** (deploy window after
  today's pushes — check Dokploy); the saved layout itself is intact and the
  default-order symptom should clear once the API is back (tag TTL 300s).
- **Propagation fix**: new `POST /admin/storefront/revalidate` (route +
  `store:edit` middleware + permission map) emits `store.updated` → existing
  `storefront-cache-revalidate` subscriber → storefront `POST /api/revalidate`
  (tag `store`); called from `useUpdateStore.onSuccess`. E2E verified:
  unauth 401 → admin JWT 200 `{"revalidated":true}` → api log
  `Processing store.updated … 1 subscribers` → storefront `POST /api/revalidate 200` ×2.
- **Visible fallback**: `retrieveHomeLayout` now `console.warn`s when
  `store-settings` returns no `home_layout` instead of failing silently.
- **Collection UI**: slider capped per breakpoint (desktop 248px vs ~443px
  before), banner row `16/8 → 21/9` (188px vs ~236px), both `rounded-2xl`,
  shared `ScrollReveal` IntersectionObserver reveal (SSR stays visible,
  reduced-motion safe). Playwright-measured desktop + mobile (card 279×209,
  `border-radius: 16px`). Dev DB: 3 collection images flagged `is_banner=true`
  (Boho Vibes, Sneaker Station, Boots Edit) so the banner row renders locally.
- **Build trap fixed**: `packages/core` build runs `copy:patches` before `tsc`
  — a type failure elsewhere previously left `.medusa` without runtime patches
  and the API refused to boot (hit live during this session, triggered by the
  in-flight collections TS errors).
- Gates: oxlint 0, `turbo build --filter=@mercurjs/storefront` 3/3, tsc 0
  errors in touched files.
- Open: prod API outage (Dokploy); SPEC-005 live click-through pending once
  `api.fashionpy.com` recovers.

## Session — Rank-ordered collections, admin + storefront (2026-11-16), branch `main`

SPEC-006 (`docs/specs/SPEC-006-collection-rank.md`, status `passing`): collections now
sort by a numeric rank — `0` first, `1` second — in the admin list and on the
storefront.

- **Storage**: `metadata.rank`. `product_collection` has no rank column and Medusa v2
  won't take one, so `POST /admin/collections[/:id]` accept a top-level `rank`
  (integer ≥ 0, `null` clears) that the routes fold into `metadata` (Medusa's
  `mergeMetadata` keeps the rest of the keys). Reads go through
  `getCollectionRank` (coerces numeric strings written via the metadata JSON editor).
- **Ordering**: `listCollectionsByRank` (`packages/core/src/api/utils/collection-rank.ts`)
  fetches every matching id + metadata, sorts in memory (ranked first ascending,
  unranked last, stable), then loads full rows for the page so count/offset/limit stay
  correct — `query.graph` can only `order` by root-entity columns. Store passes
  `-created_at` as `baseOrder`, so collections without a rank keep Medusa's historical
  store order; admin's default `order` became `rank` (`AdminCollectionsParams`).
- **Admin UI**: Rank column, `rank` entry in the list sort dropdown, optional Rank
  number field on the create/edit drawers (`fields.rank` + `collections.rankTooltip`
  in `en.json`). Store `query-config` lists `rank` as allowed **only** so
  `?order=rank` clears order validation; the route strips it from `fields` (not
  selectable).
- **Storefront**: `lib/data/collections.ts` `listCollections` defaults
  `order=rank` (slider + Shop by Collection banners pick it up).
- **Scope note**: the vendor collections list was left untouched — wiring it later is
  a copy of the admin route's branch.
- **Verification**: `bun run lint` exit 0; `bun run build` **19/19** (needed
  `--concurrency=1` — the running storefront dev server held load avg > 40 and a
  default-concurrency run stalled >15 min); `bun run test:unit collection-rank`
  **9/9**; `bun run test:integration:http -- collections` **5 suites / 25 tests pass**
  (317 s, new rank specs + pre-existing media/vendor suites).

## Session — Home-page promo code cards (2026-11-15), branch `feat/storefront-home-promo-cards`

SPEC-004 (`docs/specs/SPEC-004-home-promo-cards.md`, status `passing`): the
storefront home page now renders a **Current Offers** section of copyable
promo-code cards for platform-wide active promotions.

- **New public endpoint** `GET /store/promotions`
  (`packages/core/src/api/store/promotions/` — route, middleware, query-config,
  validators; registered in `api/store/middlewares.ts`). Visibility: `status =
  active`, `is_automatic = false`, non-empty `code`, campaign window valid
  (post-filter in route — `query.graph` returns `Date` objects, not strings),
  seller-linked promotions excluded via `$nin` over `promotion_seller` in the
  middleware (mirrors admin `applyPromotionSellerFilter`). Response is an
  allowlist — no budget/rules/seller/usage.
- **Type** `StoreHomePromotion` / `StoreHomePromotionListResponse` in
  `packages/types/src/http/promotion.ts` (named to avoid the Medusa
  `StorePromotion` export collision).
- **Storefront**: `lib/data/promotions.ts` (`listHomePromotions`, catalog
  cache tag `promotions` added to `cache-tags.ts`), section
  `components/sections/PromoCodeSection/` + client card
  `components/organisms/PromoCodeCard/` (click-to-copy + toast, discount label
  from `application_method` — note Medusa's fixed type is `"fixed"`, not
  `"fixed_amount"`), wired into the home page between the company banners and
  the product card block.
- **Verification**: `bun run lint` exit 0; `bun run build` 19/19 EXIT 0 (had
  to run at `--concurrency=1` — the box's other work pushed swap to ~17 GB and
  the default concurrency-21 run stalled in admin tsup DTS for >1 h);
  `bun run test:integration:http -- promotions/store/active-promotions` 10/10
  (spec evidence recorded in SPEC-004). Two test-driven fixes along the way:
  Medusa `PromotionStatus` is `draft|active|inactive` (no `disabled`), and the
  campaign date comparison needed `Date`-instance support.
- **Status**: shipped — committed on `main` as `b7cdc6b91` (api) +
  `0ed698aaf` (storefront).

## Session — Admin-driven homepage layout + collection banner dedupe (2026-11-15), branch `feat/home-layout-editor`

SPEC-005 (`docs/specs/SPEC-005-home-layout-editor.md`): the storefront home
sections can be reordered/hidden from Admin → Settings → Marketplace →
**Homepage layout**, and the "Shop by Collection" duplication is fixed.

- **Contract** in `packages/types/src/home-layout.ts`: `HOME_SECTION_IDS`,
  `DEFAULT_HOME_LAYOUT` (the original hard-coded order), and
  `normalizeHomeLayout` (shared by admin editor + storefront; drops unknown
  ids, first-wins de-dupe, appends newly shipped sections with defaults).
  Unit-tested by `packages/core/src/api/store/store-settings/__tests__/home-layout.unit.spec.ts`
  (7 cases, run via `TEST_TYPE=unit jest --rootDir .. home-layout`).
- **Storage**: `store.metadata.home_layout` (`{ sections: [{id,enabled}] }`)
  saved through the existing `POST /admin/stores/:id` — no new admin
  endpoint. `GET /store/store-settings` now returns `home_layout`.
- **Bug fixed en route**: that route read `query.graph(...).data.metadata`
  directly, but `data` is always an **array** — every setting (announcement
  included) had been silently null. Now `data[0].metadata` (also repairs the
  admin-configured announcement bar).
- **Admin UI**: `marketplace-home-layout-section` on the marketplace settings
  page — `SortableList` drag rows + per-section `Switch` + dirty-tracked Save
  (`store:edit` gated), i18n under `marketplace.homeLayout.*` (en.json;
  `fallbackLng: "en"` covers other locales).
- **Storefront**: `HomeSections` (`components/sections/HomeSections/`) reads
  the layout (`retrieveHomeLayout`, `store` cache tag), renders sections in
  saved order, skips disabled/empty ones without leaving blank padding
  (renderers invoked directly; `HeroCarousel` — client — returned via JSX),
  and groups consecutive product-card sections into one shared white card so
  the default layout looks unchanged. `page.tsx` reduced to
  `<HomeSections locale={locale} />`.
- **Duplicate fix**: `ShopCollectionBanners` now only renders collections
  with `is_banner`-flagged artwork — the wide banner row no longer repeats
  the same collections as the "Shop by Collection" slider (which keeps
  showing all).
- **Verification**: `bun run lint` exit 0; admin `tsc --noEmit` has 854
  pre-existing errors, **0** in the new/edited files; storefront raw-tsc
  errors in touched files are the pre-existing SDK-proxy class (next.config
  `ignoreBuildErrors: true`); unit 7/7; integration
  `store-settings/store/home-layout` 3/3; `bun run build` 19/19 EXIT 0
  (4 h 45 m full non-cached rebuild under load 10–30); storefront smoke
  (`curl localhost:3000/bd`) renders `home-sections` in default order with
  the dedupe filter live. Full evidence in SPEC-005. Gotcha for next time:
  **never run `bun run build` concurrently with integration tests** — the
  core task's `rm -rf .medusa` deletes migration files mid-boot.

## Session — Studio Rail clothing showcase in the fashionpy storefront (2026-11-14), branch `main`

Delivered a hanger-rail showcase ("Studio Rail") in `../fashionpy` (Next.js
storefront): server section `src/components/sections/StudioRail` preloads 12
products for each of Men/Women/Baby (config allowlist + ancestor walk in
`src/const/studio-rail.ts`), client rail `src/components/organisms/StudioRail`
(embla drag + tabs + velocity tilt + sway keyframes, SVG `HangerFrame`, white-bg
product photos cut out via `mix-blend-mode: multiply` over a flat studio
backdrop). Rendered on the homepage and, gated, on category pages — shoes /
skincare / accessories pages render nothing (verified: rail on `/bd`,
`/bd/categories/men`; absent on `/bd/categories/sneakers`; 0 console errors).

- **Backend fix (this repo)**: restored `country_code` to
  `StoreGetProductsParamsFields` — the custom store products route already
  destructures it, vanilla Medusa 2.22 declares it; only mercur's validator
  dropped it. Rebuilt `@mercurjs/core`.
- **Storefront baseline repairs** (pre-existing breakage, needed to verify):
  added missing `@medusajs/types@2.21.2` dep (166 → 39 tsc errors); seller
  filter in `src/lib/data/products.ts` no longer drops every product lacking a
  seller; `cdn.jsdelivr.net` allowed in `next.config.ts` image hosts; Tailwind
  restored to the working v3 wiring (`tailwindcss@3.4` + `tailwindcss: {}` in
  `postcss.config.mjs`) — the working tree's `postcss.config.mjs` had been left
  with `plugins: []` during the Next16/TW4 upgrade WIP, unstyled the whole site.
- **Security**: `git show HEAD:postcss.config.mjs` (fashionpy repo) still
  contains an appended obfuscated payload after the legit config — same family
  as the 2026-11-09 host malware. The working tree copy is clean; needs a
  commit to get it out of history going forward.
- **Dev data**: seeded `Men`/`Women`/`Baby` root categories + product links in
  the local `fashionpy_db` (and the remote dev copy) so the rail has stock;
  `.env` now carries the publishable key + `NEXT_PUBLIC_DEFAULT_REGION=bd`.
- **Open**: 39 tsc errors from the half-finished Next16/js-sdk upgrade
  (`cart.ts`/`customer.ts` `revalidateTag` arity, zod v4 `z.record`, null
  handling) — pre-existing, untouched; eslint 10 needs a flat config
  (`yarn lint` = `next lint` is also dead in Next 16); base prices never compute
  for variants without an offer (`wrapProductVariantsWithOfferPrice` early
  return), so captions show no price locally.

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
  `http://localhost:3000`, so production URLs come from that env var.
  Committed to main later, once requested.

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
  is uploaded. Committed to main later, once requested.

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
- **Active spec**: `SPEC-011-chatbot-login-gate-admin-inbox` (in_progress,
  2026-11-19) — chatbot login gate + WhatsApp option + admin Chat Inbox +
  AI-draft follow-ups with customer notifications. SPEC-010 closed `passing`
  the same day (policies pages: module, admin/store APIs, admin page,
  storefront routes, bilingual seed, tests, browser E2E).

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
- **2026-11-19 `redirect_uri_mismatch` root cause + fix.** Live probes showed the
  app sends `redirect_uri=https://fashionpy.com/api/auth/google/callback`
  (from `GOOGLE_CALLBACK_URL`) while the console had the stale Medusa-native path
  `/auth/customer/google/callback` registered (copied from the then-current
  `apps/storefront/.env:14`). The real callback is the Next.js route
  `apps/storefront/src/app/api/auth/google/callback/route.ts`. Fix:
  (1) **Google Cloud Console** → OAuth client → **Authorized redirect URIs**: add
  `https://fashionpy.com/api/auth/google/callback` +
  `http://localhost:3000/api/auth/google/callback` (optionally
  `https://www.fashionpy.com/...`; www 307s to apex anyway) and remove the two
  stale `/auth/customer/google/callback` entries; **Authorized JS origins**: add
  `https://fashionpy.com`, `https://www.fashionpy.com`, `http://localhost:3000`.
  (2) **Repo:** deleted the unused `GOOGLE_*` trio from `apps/storefront/.env`
  and `.env.template` (no storefront code reads them; the stale URL is what
  misdirected the console setup). Root `.env` / `apps/api/.env.prod` already
  interpolate to the correct `/api/auth/google/callback` — unchanged.

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

### Session: 2026-11-13 -- Production deploy green (build TS18046 + boot `{} is not iterable`)

Deployment target: Dokploy compose `fashionpy` on `5.189.148.53` / `vmi3604607`
(autoDeploy on push to `main`, serialized `build api && build storefront && up`).
Four deploys on Nov 12 died at the image build; the build fix then exposed a
second, runtime failure. Both are landed and prod is verified healthy.

**1. Build — `bunx medusa build` → `TS18046: 'connector' is of type 'unknown'`**
- **Cause.** `apps/api/src/scripts/{check-stripe-webhooks,simulate-stripe-payouts}.ts`
  resolved the connector with `container.resolve(STRIPE_CONNECTOR_MODULE)` — a plain
  string key, so `resolve` returns `unknown`.
- **Landed** (`fe5f37a89`). Both scripts now use `resolveConnector(container)` from
  `@mercurjs/stripe-connector-plugin/utils/payout-module` (the helper
  `stripe-scenarios.ts` already used), typed as `StripeConnectorModuleService`.
  Dropped the now-unused `STRIPE_CONNECTOR_MODULE` imports.

**2. Boot — `TypeError: {} is not iterable` in `@medusajs/modules-sdk` `load-internal.js:231`**
- **Cause.** `medusa-config.ts` resolves `@mercurjs/payout-local/providers/local`, and
  the package exports map `./providers/* → .medusa/server/src/providers/*.js` points
  that specifier at `providers/local.js` — which only exported the class. The
  `ModuleProvider(...)` definition (the `{ module, services, loaders }` object Medusa
  iterates) lived solely in `providers/index.ts`, so the loader fell through to
  `loadedProvider_.services ?? loadedProvider_`, got the bare namespace object and
  threw while iterating. The API crash-looped right after `Running migrations...`.
- **Landed** (`3f1d54fba`). `providers/local.ts` now default-exports
  `ModuleProvider(MercurModules.PAYOUT, { services: [LocalPayoutProvider] })`;
  `providers/index.ts` re-exports it. New unit test in
  `local-provider.unit.spec.ts` pins the export shape (`module`, `services`).

**Verified**
- Local: `packages/plugins/payout-local` jest 11/11 (new case included);
  `bun run lint` → exit 0; `bun run build` → 19/19.
  A resolve probe of every configured provider now yields `{module, services,
  loaders}` with `services: 1` — before the fix `providers/local` yielded the bare
  namespace (`isIterable: false`), which is the exact crash.
- Deploy `8MMGk3UgzGBOfN_DcijXE` → `done`, `Docker Compose Deployed: ✅`.
  `fashionpy-…-api-1` and `…-storefront-1` **Up … (healthy)** (they were
  crash-looping before); `/health` → `OK` on `:9001`; **0** `level=error` log lines
  in the first 15 min of boot (previously one `{} is not iterable` every ~20s).
- Public: `https://fashionpy.com` → 200, `https://admin.fashionpy.com` → 200,
  `https://partner.fashionpy.com` → 200, `/dashboard/` → 200, `/seller/` → 200.
  `GET /store/products?limit=2` with the publishable key returns real product rows.
  (Without the key it 400s with the expected `Publishable API key required` guard.)

- **Owed / next.** `claude-progress.md` is committed but **not pushed** — a push
  triggers another full Dokploy rebuild for a docs-only change. Push it whenever a
  real code change next goes out. `scripts/deploy.sh` targets a different host
  (`root@167.233.17.178`, instances new.mercur.dev / platform.mercurjs.com); the
  available keys (`carezii_deploy`) only authenticate the Dokploy host, so that
  path was not exercised today.


## 2026-11-22 — AI product drafts, catalog enrichment, blog generation (SPEC-014)

- **Landed.** Shared `packages/core/src/ai/` runtime on top of the existing
  chatbot provider layer: JSON completion with zod validation, SSRF-safe image
  normalization (http + base64), vision support in the OpenAI-compatible and
  Gemini adapters, product-draft / insights / blog generators, metadata+tag+SKU
  sanitizers, per-actor AI rate limit.
- **Endpoints.** `POST /admin/products/ai/draft`,
  `POST /vendor/products/ai/draft` (quota), `POST /admin/products/ai/insights`,
  `POST /admin/products/:id/ai/enrich`, `POST /admin/blog-posts/ai/generate`.
- **Seller quota.** `seller.metadata.ai_product_quota` (default 20) and
  `ai_product_generations`; atomic conditional `UPDATE ... RETURNING` in
  `SellerModuleService.consumeAiProductCredit`, with refund on generation
  failure. Admin routes bypass the quota by construction.
- **UI.** Vendor product create has an "Generate with AI" section (photo is
  downscaled in-browser and sent as a data URL, then uploaded for media). Admin
  product organization has "Enrich with AI"; admin blog form has an "AI draft"
  panel that fills title/slug/excerpt/content/tags/metadata.
- **Follow-up.** Added the same AI panel to the admin product create details
  tab. Vendor and admin drafts now preselect a matching category and matching
  catalog tag IDs (fetch is best-effort; failures never block the draft).
- **Follow-up 2.** `GET /vendor/ai/quota` powers an "X of Y AI drafts left"
  readout in the vendor panel. AI rate limiting now shares the Redis window via
  `messaging-redis` when available and falls back to the in-process window.
- **Follow-up 3.** Admin store detail sidebar has an "AI product drafts"
  section to raise/lower a seller's limit and reset the used count (writes
  `seller.metadata.ai_product_quota` / `ai_product_generations`).
- **Follow-up 4.** Providers surface token usage (OpenAI `usage`, Gemini
  `usageMetadata`); `completeJson` logs `[ai] surface=… model=… *_tokens=…`.
  Admin drafts create missing product tags; vendor drafts warn about suggested
  tags that are not in the catalog. AI settings page documents that the same
  provider powers product tools and recommends a vision-capable model.
- **Follow-up 5.** `apps/api/src/scripts/ai-smoke.ts` +
  `bun --cwd apps/api run ai:smoke` runs a live draft/insights/blog check
  against the configured provider (no DB writes; optional
  `AI_SMOKE_IMAGE_URL` / `AI_SMOKE_SOURCE_URL`).
- **Verified.** Core `tsc` exit 0; `bun run lint` exit 0; AI unit tests 24/24;
  `seller/modules/ai-quota` integration 2/2; `http/ai/admin/ai-routes` 5/5 with
  the provider mocked via `global.fetch` (admin draft, vendor draft + quota,
  insights, enrich with tag creation + metadata merge, blog draft); core, vendor
  and admin builds exit 0 (vendor/admin declaration builds included).
  Live-provider smoke test left to the operator environment.
- **Not run.** Root `bun run build` (turbo across all apps); the three changed
  packages were built individually.

## Definition Of Done

A change is done only when:

- target behavior is implemented
- `bun run build` and `bun run lint` pass
- a relevant integration test was run (for behavior changes)
- evidence is recorded in this file
- the repo remains restartable from `bun install && bun run dev`
