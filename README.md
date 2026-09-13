# tp-crm-tests

Automated end-to-end and regression tests for the **tp-crm** application — a
React/Vite operations CRM with Supabase Auth, multi-client presets, a driver
workflow, documents/PDFs, Xero and OpenRouteService road routing.

This repository contains **tests only**. Application code lives in the separate
`tp-crm` / `tp-operations-platform` repository.

Built with [Playwright](https://playwright.dev) + TypeScript, using the
page-object model and accessible (role/text-based) locators.

## Prerequisites

- Node.js 20+ (developed against Node 24)
- npm
- A running instance of the application under test (local dev or staging)

## Installation

```bash
npm ci
npx playwright install chromium
```

## Test modes: mock vs supabase

The application can run in two data modes, and the suite mirrors them via
`DATA_MODE`:

| `DATA_MODE` | App setting | What the suite covers |
| ----------- | ----------- | --------------------- |
| `mock` (default) | `VITE_DATA_MODE=mock` | UI smoke, lists/details, presets, notifications, communications render, driver workflow (in-memory demo data). Auth is bypassed by the app. Write-path tests self-skip. |
| `supabase` | `VITE_DATA_MODE=supabase` | Real login/logout/session/role tests, write-path coverage (customers, bookings, routes, documents), admin/role matrix. Requires `E2E_*` credentials and seeded test data — tests skip cleanly without them. |

Set `DATA_MODE` to match the app. If the app runs supabase mode but the
variables/credentials are missing, affected tests are **skipped** — never
reported as passed.

## Environment variables

| Variable              | Default                 | Purpose |
| --------------------- | ----------------------- | ------- |
| `BASE_URL`            | `http://localhost:5175` | URL of the application under test (local or staging — never hardcode production) |
| `CLIENT_PRESET`       | `demo`                  | Expected preset: `demo`, `logisticsDemo`, `fieldServiceDemo`, `wasteDemo` |
| `DATA_MODE`           | `mock`                  | `mock` or `supabase` — must match the app's `VITE_DATA_MODE` |
| `PROD_BUILD`          | unset                   | `1`/`true` when `BASE_URL` serves a production build — enables the developer-text regression (dev-only UI is hidden in prod) |
| `E2E_OWNER_EMAIL` / `E2E_OWNER_PASSWORD`       | unset | Owner account (supabase mode) — unlocks authenticated read + write coverage |
| `E2E_ADMIN_*`, `E2E_MANAGER_*`, `E2E_OFFICE_*` | unset | Role-specific accounts for the permission matrix |
| `E2E_FIELD_*`         | unset                   | Field-user account for driver-workflow coverage |
| `E2E_VIEWER_*`        | unset                   | Read-only account |
| `CI`                  | unset                   | 2 retries, 2 workers, `.only` forbidden |

Copy `.env.example` and fill in values — `.env` is gitignored and credentials
are never committed. Variables are read from the process environment; export
them in your shell or CI.

## Running the app under test

From the application repository:

```cmd
:: cmd.exe — mock mode, demo preset (default target for this suite)
set "VITE_CLIENT_PRESET=demo"
set "VITE_DATA_MODE=mock"
npm run dev
```

```powershell
# PowerShell — supabase mode against local Supabase
$env:VITE_CLIENT_PRESET = "demo"
$env:VITE_DATA_MODE = "supabase"
$env:VITE_SUPABASE_URL = "http://localhost:54321"
$env:VITE_SUPABASE_PUBLISHABLE_KEY = "<local anon key>"
npm run dev
```

For local Supabase, seed the dev environment first (see the app repo's
`dev-*.sql` scripts in `scripts/`): users with the six roles, an organisation,
customers/sites, bookings/jobs, routes, notifications and a failed
communication. Without seeds, role/write tests skip or report "not seeded".

## Running the tests

```bash
npm test               # full default suite (excludes @live), chromium + mobile
npm run test:smoke     # @smoke-tagged core checks only
npm run test:presets   # preset branding/nav/terminology/settings/waste
npm run test:regression# everything except @live tags
npm run test:live      # ONLY @live tests (routing-live, xero-live) — opt-in
npm run test:headed    # visible browser
npm run test:ui        # Playwright UI mode
npm run report         # open last HTML report
npm run typecheck      # tsc --noEmit
```

Examples:

```cmd
:: local mock run
set "CLIENT_PRESET=demo" & set "DATA_MODE=mock" & npm run test:regression

:: staging (supabase) run
set "BASE_URL=https://staging.example.com" & set "DATA_MODE=supabase" & set "CLIENT_PRESET=demo" & set "E2E_OWNER_EMAIL=..." & set "E2E_OWNER_PASSWORD=..." & npm run test:regression
```

## Browser projects

| project          | viewport/device    | contents |
| ---------------- | ------------------ | -------- |
| `chromium`       | desktop Chromium   | everything except `tests/driver/**` |
| `mobile-chrome`  | Pixel 7 emulation  | `tests/driver/**` only |

## Live external integrations (`@live`)

Two tagged tests talk to real services and are **excluded** from the default
run:

- `@routing-live` — recalculates a route via the `route-directions` edge
  function → OpenRouteService. Uses real API quota; run rarely.
- `@xero-live` — verifies the Xero integration surface renders (connection
  state, authorised controls). Never initiates OAuth or creates invoices.

Both self-skip unless `DATA_MODE=supabase` with owner credentials.

## Coverage map

```
tests/
  smoke/          app shell + branding load          (@smoke)
  auth/           login, invalid login, redirects, session persistence,
                  role landing, forgot/reset rendering (supabase)
  navigation/     every enabled module loads          (@smoke)
  dashboard/      KPIs, sections, map, attention area
  customers/      list + detail tabs; manage/ writes (supabase)
  bookings/       list + detail; create/convert/cancel (supabase)
  jobs/           list + detail
  routes/         list KPIs + detail map; create/stop management (supabase)
  dispatch/       route planner panels + map
  documents/      list + detail; WTN (wasteDemo); lifecycle (supabase)
  reports/        period/report tabs, charts — mock vs live implementations
  settings/       all configuration sections (incl. About)
  branding/       co-branding: Powered-by credit, org identity, branding
                  settings UI, role access, persistence + reset (supabase)
  notifications/  bell, dropdown, filters, item actions
  responsive/     page-level horizontal overflow at 1440/1024/390px,
                 mobile list cards, internal table scroll, modal fit
  communications/ customer comms tab + failed/retry flow (supabase)
  fleet/          vehicles + field users lists
  driver/         mobile-only driver workflow (mobile-chrome project)
  admin/          org/users/pricing + role matrix (supabase)
  regression/     raw-enum leak checks
  accessibility/  accessible names, form labels, dialog semantics
  live/           @routing-live, @xero-live (opt-in)
  presets/        per-preset branding/nav/terminology/settings/waste
```

## Test data & cleanup

- Unique fictional references via `utils/testData.ts` (`E2E-XXX-<ts>-<rand>`).
- Write-path tests create their own records and clean up where the UI allows
  (archive customer/site, cancel booking, remove stop). Leftovers are
  `E2E-*`-prefixed and can be purged in the database with
  `WHERE reference LIKE 'E2E-%'`-style queries if needed.
- Tests never touch real customer/user records by name or id.
- No test sends real customer emails, invitations or resets — the invitation
  modal is opened and cancelled only; password reset is asserted to the
  acknowledgement screen only.

## Diagnostics & artifacts

- `playwright-report/` — HTML report (`npm run report`)
- `test-results/` — traces, screenshots, videos; retained on failure only
- Open a trace: `npx playwright show-trace test-results/<dir>/trace.zip`
- All artifacts, `.env` files and `playwright/.auth/` are gitignored.

## Known product gaps captured by this suite

These tests use `test.fail()` so they document real defects without breaking
CI — remove `test.fail()` once the app is fixed:

- `responsive/responsive` — the routes table (~1288px) still overflows the
  ~1112px content area at 1440px, so `.table-scroll` scrolls internally and
  the Actions column is pushed off-screen.

Fixed since the last audit (markers removed): `serviceLocation` raw key in
New Booking, modal `role="dialog"` semantics, branding `htmlFor` labels,
bookings internal table scroll at 1440px, driver stop-row nested
interactives (now a real button + sibling link).

## CI readiness

The suite is CI-ready (retries/workers/`forbidOnly` under `CI=true`). A
pipeline should:

1. `npm ci && npx playwright install --with-deps chromium`
2. Run the app under test (or point `BASE_URL` at staging)
3. `npm run test:regression` with `CLIENT_PRESET`/`DATA_MODE`/`E2E_*` secrets
4. Publish `playwright-report/` as a build artifact
5. Keep `npm run test:live` on a separate, manually-triggered job

## Troubleshooting

- **Everything redirects to /login** — the app is in supabase mode; set
  `DATA_MODE=supabase` and provide `E2E_OWNER_*` credentials, or run the app
  in mock mode.
- **Auth/write tests all skipped** — expected when `E2E_*` credentials are
  unset; they are not a failure.
- **"couldn't be located on this site"** — postcode lookup needs network
  access to postcodes.io.
- **Preset assertions failing** — `CLIENT_PRESET` must equal the app's
  `VITE_CLIENT_PRESET`; check the Settings "Active Preset" badge.
- **Live tests time out** — they call real services; confirm
  `VITE_ORS_API_KEY`/Xero edge functions are deployed in the target env.
