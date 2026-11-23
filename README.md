# Awora

Small details. Happy spaces. Storefront MVP for customizable, 3D-printed switch covers and home objects.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 (redirects to `/hy`). Without Supabase keys the site runs on the bundled catalog in `src/data/seed.js`.

## Connect Supabase

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Settings → API).
4. Restart `npm run dev`. Products, colors, color pairs and collections now come from the database; edit them in the Table editor.

After changing `src/data/seed.js`, run `npm run seed:sql` to regenerate `supabase/seed.sql`. Careful: re-running `seed.sql` overwrites catalog edits made in the admin panel (prices are kept).

## Accounts, admin and orders

1. **Auth:** Supabase → Authentication → Providers → Email: enabled, "Confirm email" on. Under URL Configuration set the Site URL to your domain and add `http://localhost:5173/**` and `https://your-domain/**` to Redirect URLs (needed for the confirmation and password-reset links).
2. **Become admin:** sign up on the site (`/en/account`), confirm the email, then run in the SQL editor:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
   ```
   Reload: the account icon now opens `/en/admin` (orders, products, collections, colors & combos, prices).
3. **Order emails (Resend):** create an API key at resend.com. Until you verify a sending domain, Resend only delivers to the email address of your own Resend account. Either sign up to Resend with eleenehovak@gmail.com, or verify your domain and set `RESEND_FROM` to an address on it.
4. **Server env vars** (Vercel → Settings → Environment Variables, and `.env.local` for `npm run dev`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Settings → API, keep secret), `RESEND_API_KEY`, `RESEND_FROM`, `ORDER_NOTIFY_EMAIL` (defaults to eleenehovak@gmail.com), `SITE_URL`.

Checkout posts to `/api/order` (a Vercel function; `npm run dev` serves it too). The server recomputes all prices, saves the order and emails the shop. There is no online payment: customers are told you'll contact them to confirm measurements, delivery and payment.

## Deploy

`npm run build` outputs `dist/`. SPA rewrites are included for Netlify (`public/_redirects`) and Vercel (`vercel.json`). Set the two `VITE_SUPABASE_*` variables and the server variables above in the host's environment settings. The order API is a Vercel function, so ordering works on Vercel only (Netlify would need the function ported).

## Before launch

- Fill in Instagram / Telegram / email in `src/site.js`.
- Set real AMD prices in Admin → Prices (defaults are placeholders from `src/data/seed.js`).
- Confirm material, care, installation and production-time copy in `src/i18n.jsx` (`p.materialText`, `p.installText`, `guide.*`).
- Have a native speaker proofread the Armenian copy.
- Replace the brand-book logo crops in `public/brand/` with the final vector masters.
- Online payment is not built: orders are confirmed and paid offline.
- Update the delivery copy (`guide.del.d`), which still says options will be listed when ordering opens.
