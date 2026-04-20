
 # Velune Storefront

This project is a React + TypeScript + Vite storefront for Velune. The original visual starting point came from a Figma-exported fragrance storefront, and the current codebase is being extended into a real order-processing site without replacing the existing theme.

## Running the app

Run `npm i` to install dependencies.

Run `npm run dev` to start the development server.

## Supabase setup

Paste your Supabase project URL into:

`VITE_SUPABASE_URL` in `.env.local`

Paste your Supabase browser-safe key into:

`VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`

Notes:

- Browser/frontend code in this Vite app uses the Supabase JS client and reads env values from `import.meta.env`.
- The shared browser client lives in `src/utils/supabase.ts`.
- The browser client uses `VITE_SUPABASE_PUBLISHABLE_KEY` together with `VITE_SUPABASE_URL`.
- Do not place a raw `postgresql://` or `postgres://` connection string anywhere in browser/frontend code.
- Do not place a service role key in frontend code.
- Database migrations are applied separately through the Supabase CLI, not through the browser client.

## Admin auth setup

Velune admin now uses real Supabase Auth in the browser. No frontend allowlist env var is used anymore.

Manual setup still required in Supabase:

1. Enable the Email provider in Supabase Auth.
2. Create the admin auth user accounts that should be able to sign in.
3. Add the same email addresses to `public.admin_users`.
4. Keep `is_active = true` for approved admin rows.

Admin access only opens when both of these are true:

- the user successfully signs in through Supabase Auth
- the signed-in email exists in `public.admin_users`

## Supabase CLI workflow

Use the Supabase CLI separately from the browser app when you need to link this repo to a hosted Supabase project and push migrations.

1. Log in to the Supabase CLI:

`npx supabase login`

2. List the projects available to your account and copy the correct project ref:

`npx supabase projects list`

3. Link this repo to your hosted project. This step requires your real project ref and database password:

`npx supabase link --project-ref <PROJECT_REF> -p <DB_PASSWORD>`

4. Push the repo migrations to the linked project:

`npx supabase db push`

Important:

- `db push` requires the project to be linked first.
- Your database password is for CLI/database operations only. Do not place it in browser code.
- The frontend React/Vite app connects with the Supabase JS client and the browser-safe env vars only.
- Local Supabase link metadata is stored under `supabase/.temp` and should not be committed.
- There is no `supabase/config.toml` in the repo yet. That does not block the hosted `link` and `db push` workflow above, but it should be added later if you want fuller local Supabase workflows such as `npx supabase start`.

## Finalized order cleanup

Velune now includes Supabase-side cleanup support for orders that have stayed `Delivered` or `Cancelled` for 30 days.

What was added:

- `supabase/functions/cleanup-finalized-orders/index.ts`
- `supabase/migrations/20260420_000004_order_finalization_support.sql`
- `supabase/sql/schedule_cleanup_finalized_orders.sql`

How it works:

1. `finalized_at` is maintained on `public.orders` when an order becomes `Delivered` or `Cancelled`.
2. A scheduled cron job calls the Edge Function once daily.
3. The Edge Function deletes any private payment proof from the `payment-proofs` bucket through the Storage API.
4. Only after file cleanup succeeds does it delete the matching `public.orders` row. `order_items` are removed through the existing cascade.

Manual setup still required in Supabase:

1. Push the new migrations:

`npx supabase db push`

2. Deploy the Edge Function:

`npx supabase functions deploy cleanup-finalized-orders`

3. Make sure `pg_cron` and `pg_net` are enabled in the project database if they are not already.

4. Store the service role key safely in Supabase Vault under this name:

`velune_cleanup_service_role_key`

5. Open [supabase/sql/schedule_cleanup_finalized_orders.sql](</d:/Velune/storefront_frontend/supabase/sql/schedule_cleanup_finalized_orders.sql:1>) and replace:

- `YOUR_PROJECT_REF` with your real Supabase project ref

6. Run that SQL snippet in Supabase SQL Editor to create the daily job.

Notes:

- The schedule is set to run daily at `03:17` server time.
- The Edge Function uses the built-in `SUPABASE_SERVICE_ROLE_KEY` inside the function runtime for database and Storage cleanup.
- The cron job should call the function with a service-role bearer token from Vault, not a hardcoded secret in source control.

## Current status

The storefront UI still uses the existing theme and structure. Product rendering is still hardcoded for now, and the next step is replacing those mock product entries with live Supabase reads.
  
