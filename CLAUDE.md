# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Storefront for **Awora** — "Objects for happy spaces": 3D-printed switch/socket covers and small home objects (trays, frames, mirrors) that customers customize (shape, sections, pattern, colors). Functionality is modelled on printesso.ru; the motion language (hero orbit, pinned horizontal "Room I" walk, scroll-driven floaters and motes) was carried over from the previous Eleene site and restyled. Scope: catalog, configurator, localStorage cart, checkout that saves orders to Supabase and emails the shop, email + password accounts (customers see their orders), and an admin panel at `/:lang/admin`. **No online payment**: the shop confirms and arranges payment after the order email.

Bilingual: Armenian (default, `/hy/...`) and English (`/en/...`). UI copy lives in `src/locales/en.js` and `src/locales/hy.js` (one key per line; `npm run i18n:check` lists keys missing from either), loaded by `src/i18n.jsx`; catalog copy is `{ en, hy }` objects in the data. Armenian copy still needs a native proofread.

## Brand rules (from the Awora brand book)

- Palette: Mulberry `#641C35` (signature ink), Persimmon `#EF704F`, Petal `#F3BDD0`, Periwinkle `#B9C8EE`, Ivory `#FFF9EF`. Layout ≈ 65% ivory, 20% one supporting color, 15% mulberry. Mulberry text on ivory/petal/periwinkle; ivory text on mulberry; persimmon only for large graphics/accents.
- **Site override (owner's call):** text and controls (buttons, tabs, chips, pickers, focus borders) use navy `--navy #2D3A6A` via `--ink`; mulberry stays for the logo and decorative brand shapes.
- Type: Noto Sans (Bold headlines, Regular body) and Noto Sans Armenian. The logo is artwork (`public/brand/wordmark.png`, `aw.png`, used as CSS masks so they take `currentColor`) — never typeset "AWORA" as a logo; write "Awora" in sentences.
- Graphics: flat solid fills, no drop shadows, bevels, sparkles, stars, confetti or generic flowers. Brand shapes: `public/brand/shape-coral.png`, `shape-petal.png`.
- Voice: warm, specific, a little playful, short sentences. No "premium quality"/"perfect for everything"; no claims about brain chemistry; only state verified materials, dimensions and timings.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run seed:sql   # regenerate supabase/seed.sql from src/data/seed.js
npm run shapes     # regenerate design/shapes/*.svg + playground.html
npm run i18n:check # keys missing from en.js or hy.js
```

No tests or linter.

## Architecture

Vite + React 18 + react-router 6, plain JSX, one global stylesheet `src/styles.css` (tokens on `:root`).

- `src/App.jsx` — routes `/:lang`, `/:lang/catalog`, `/:lang/product/:slug`, `/:lang/guide`; unknown lang redirects to the saved/default language.
- `src/data/seed.js` — the catalog: `COLORS`, `COMBOS` (base/pattern/accent color pairs), `COLLECTIONS`, `PRODUCTS` (each with `defaults` = starting configuration), plus option lists and placeholder AMD prices (`COVER_SHAPES`, `SECTION_TYPES`, `PATTERNS`, `DECOR_SHAPES`, `DECOR_SIZES`, `COVER_PRICING`).
- `src/lib/catalog.jsx` — `CatalogProvider` reads colors/combos/collections/products from Supabase when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set, otherwise (or on error) uses the seed. Option lists and pricing always come from `seed.js`.
- `src/lib/config.js` — `initialConfig(product, combos, comboId)`, `priceOf`, `configCode`, `fieldFor` (background never equals the product's base color).
- `src/lib/shapes.js` — switch-cover outlines (square, circle, clover, cloud, wavy, flower) as pure path math, shared by the preview and `npm run shapes`, which writes `design/shapes/*.svg` (1–4 sections, solid and frame) and `design/shapes/playground.html` (try shapes in the filament colors). Re-run it after changing shapes or colors.
- `src/components/ProductPreview.jsx` — flat SVG renderer for every product; it is both the catalog image and the live configurator preview. Covers are drawn in a horizontal frame and rotated for vertical; inserts (socket / 1–3 keys / blank) stay upright.
- `src/pages/Home.jsx` — hero (six product tiles + AW seal orbit the headline; each tile cycles three color pairs and links to its product), collection marquee, routes, Room I walk (`#walk`, one cover in every combo, links with `?combo=`), featured grid, palette (`#colors`), how it works, FAQ (`#faq`), contact.
- **Visual language (v2):** periwinkle page frame (`.frame`, desktop), petal announcement bar in the nav, crossing tilted bands under the hero, bento routes with a live "Try it here" mini studio (links to `/product/:slug?combo=&shape=`), framed product cards with peeking shapes, a split manifesto with a ribbon poster, a butter stats band (count-up), a petal contact card and a butter footer with the descriptor on a ribbon. `src/components/Decor.jsx` holds the kit: `Ribbons` (named sets that draw in via `stroke-dashoffset` once `.in`), `Sticker` (draggable pills), `ArcBadge`, `HalfMoons`, `Squiggle`, `Underline`, `Count`, `ArrowDot`. Shapes are ribbons, half-moons, pills, rings and blobs only — no stars/asterisks/confetti (brand book). `[data-par]` elements get scroll parallax from `Living`; `.magnet` buttons lean toward the pointer (`useMagnet`).
- `src/components/Living.jsx` — floaters (`HOME_FLIGHTS`: brand shapes on scroll paths per anchor section, `mpts` for mobile) and scroll-spawned motes (max 10 desktop / 6 mobile, mostly in margins, skipped over `quiet` selectors). Disabled under `prefers-reduced-motion`.
- `src/cart.jsx` — localStorage cart (`awora.cart.v1`); the drawer's checkout button goes to `/:lang/checkout`. Displayed prices are recomputed from live pricing, not the stored `price`.
- `src/lib/auth.jsx` — `AuthProvider`/`useAuth`: Supabase Auth email + password (sign up with confirmation email, sign in, reset via `/:lang/account/reset`), `profile` (table `profiles`), `isAdmin` (rpc `is_admin()` → table `admins`). `available: false` when Supabase env is unset.
- Pages: `Account.jsx` (sign in / up / forgot; when signed in: my orders + delivery details), `ResetPassword.jsx`, `Checkout.jsx` (POSTs `/api/order` with the session token if any; guests allowed).
- `src/pages/admin/*` — admin panel (English only, `lang="en"`): Orders + OrderDetail (status, internal note, delete), Products + ProductEdit (all fields incl. starting configuration with live preview), Collections, Palette (colors + combos, via the generic `RowsEditor`), Prices (`settings.pricing`). Writes go straight to Supabase from the browser; RLS allows them only for admins. Saves call `useCatalog().reload()`.
- `api/order.js` — Vercel function (also served by a dev middleware in `vite.config.js`, so `npm run dev` works). Validates input, rebuilds every item's config from allowed option ids, **recomputes prices server-side** with `priceOf` + `settings.pricing`, inserts with the service role (there is no insert policy on `orders`), upserts the customer's profile, then emails `ORDER_NOTIFY_EMAIL` (default eleenehovak@gmail.com) through Resend. Email failure doesn't fail the order. Honeypot field `website` + 5 orders / 10 min per IP. Shared helpers in `api/_lib.js`.
- **Hosting: Cloudflare Workers** (Git-connected; build `npm run build`, deploy `npx wrangler deploy`, config `wrangler.jsonc`). Static `dist/` is served by the assets binding with SPA fallback; only `/api/*` runs `worker/index.js`, which calls `api/_cf.js` → `api/order.js` through a Node-style req/res shim (keep that handler to `req.method/headers/body` and `res.status/json/setHeader/end`). `functions/api/order.js` does the same if deployed as a Pages project; `vercel.json` keeps Vercel working. Runtime variables: Worker → Settings → Variables and Secrets; `VITE_*` must also be build variables (Settings → Build).
- Pricing: `pricingFromSeed()` / `mergePricing()` / `priceOf(cfg, pricing)` in `src/lib/config.js`. Seed prices are the defaults; `settings.pricing` (editable in admin) overrides them. `useCatalog().pricing` is the live table.
- `src/site.js` — Instagram/Telegram/email (empty = hidden). Fill these in.
- `supabase/schema.sql` — catalog tables (public read, admin write), `admins`, `is_admin()`, `profiles`, `settings`, `orders` with RLS; `supabase/seed.sql` is generated (pricing row is insert-only so admin edits survive re-seeding; catalog rows are upserted and **will overwrite admin edits**).
- Env: `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (browser); server-only `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `ORDER_NOTIFY_EMAIL`, `SITE_URL` (see `.env.example`). Promote an admin with SQL: `insert into public.admins (user_id) select id from auth.users where email = '…';`

To add a product: add it to `PRODUCTS` in `src/data/seed.js` (and run `npm run seed:sql` if Supabase is used). New product kinds need a renderer branch in `ProductPreview.jsx`, shapes/sizes in `seed.js`, and an accent label `p.accent.<kind>` in both `src/locales/*.js`.
