# tp-crm-tests

Automated end-to-end and regression tests for the **tp-crm** application — a
React/Vite operations CRM with multiple client presets.

This repository contains **tests only**. Application code lives in the separate
`tp-crm` repository.

Built with [Playwright](https://playwright.dev) + TypeScript, using the
page-object model and accessible (role/text-based) locators.

## Prerequisites

- Node.js 20+ (developed against Node 24)
- npm
- A running instance of the `tp-crm` application (see below)

## Installation

```bash
npm install
npx playwright install chromium
```

`npx playwright install` (without a browser name) also works once more browser
projects are enabled.

## Running tp-crm locally

From the `tp-crm` application repository:

```bash
npm install
```

Command Prompt (`cmd.exe`):

```cmd
set "VITE_CLIENT_PRESET=demo"
npm run dev
```

PowerShell:

```powershell
$env:VITE_CLIENT_PRESET = "demo"
npm run dev
```

The app is expected at `http://localhost:5175` by default (Vite `--port 5175`
if it differs).

## Running the tests

```bash
npm test              # run all tests (headless)
npm run test:smoke    # run only tests/smoke
npm run test:presets  # run only tests/presets (branding, nav, terminology, settings, waste)
npm run test:regression  # full read-only regression pack (all tests)
npm run test:headed   # run with a visible browser
npm run test:ui       # Playwright UI mode
npm run test:debug    # Playwright Inspector / step-through debugging
npm run report        # open the last HTML report
npm run typecheck     # TypeScript checks only
```

Useful extras:

```bash
npx playwright test --list          # list discovered tests without running
npx playwright test -g "loads"      # filter by title
npx playwright codegen localhost:5175  # record interactions
```

## Environment variables

| Variable        | Default                  | Purpose                                                        |
| --------------- | ------------------------ | -------------------------------------------------------------- |
| `BASE_URL`      | `http://localhost:5175`  | URL of the application under test                              |
| `CLIENT_PRESET` | `demo`                   | Client preset the tests should expect (see below)              |
| `CI`            | unset                    | When set: 2 retries, 2 workers, `.only` forbidden              |

`CLIENT_PRESET` tells the test framework which preset's branding, navigation
and data to expect. It does **not** change the application — the app must be
launched with its own `VITE_CLIENT_PRESET` (see above). If the two don't match,
preset-specific assertions will fail. Supported values: `demo`,
`logisticsDemo`, `fieldServiceDemo`, `wasteDemo`. An unsupported value fails
immediately with a clear error. Expected values per preset are defined in
`config/presets.ts`.

### Running each preset

Each preset needs its own running app instance. Command Prompt examples — in
the **tp-crm** repo:

```cmd
set "VITE_CLIENT_PRESET=demo"
npm run dev
```

then in **tp-crm-tests**:

```cmd
set "CLIENT_PRESET=demo"
npm run test:regression
```

PowerShell equivalents:

```powershell
# tp-crm
$env:VITE_CLIENT_PRESET = "logisticsDemo"; npm run dev

# tp-crm-tests
$env:CLIENT_PRESET = "logisticsDemo"; npm run test:regression
```

And the same pattern for the remaining presets:

| `VITE_CLIENT_PRESET` / `CLIENT_PRESET` | Organisation | Notes |
| -------------------------------------- | --------------------------- | ------------------------------------ |
| `demo` | Northstar Operations Ltd | Generic baseline; all core modules |
| `logisticsDemo` | Celtic Logistics Ltd | Consignments, Deliveries, Drivers, Delivery Notes |
| `fieldServiceDemo` | Summit Field Services Ltd | Service Requests, Engineers, Job Sheets; Vehicles hidden from nav |
| `wasteDemo` | Greenway Environmental Ltd | Collections, Rounds, Waste Transfer Notes module enabled |

The Settings screen shows an **Active Preset** badge — the settings spec
asserts it matches `CLIENT_PRESET`.

### Setting variables

Command Prompt:

```cmd
set BASE_URL=http://localhost:5175
set CLIENT_PRESET=demo
npm test
```

PowerShell:

```powershell
$env:BASE_URL = "http://localhost:5175"
$env:CLIENT_PRESET = "demo"
npm test
```

A `.env.example` is included for reference; variables are read from the process
environment (no dotenv loader is wired up — export/set them in your shell or CI).

## Reports

Every run produces:

- `list` output in the terminal
- an HTML report in `playwright-report/` — open with `npm run report`
- traces, screenshots and videos in `test-results/`, retained **only on failure**

Open a failure trace with `npx playwright show-trace test-results/<folder>/trace.zip`.

## Project structure

```
config/
  env.ts         environment variable handling (BASE_URL, CLIENT_PRESET)
  presets.ts     expected branding/navigation/terminology per client preset
pages/
  BasePage.ts        shared helpers: goto, waitForReady, landmarks, headings,
                     card/section lookups, visibility
  ListPage.ts        shared base for module list pages (table + rows)
  AppShellPage.ts    sidebar, branding, nav items, user section, page heading
  DashboardPage.ts   KPI cards, dashboard sections
  CustomersPage.ts   list + customer detail (tabs, cards)
  BookingsPage.ts    list + booking detail
  JobsPage.ts        list + job detail
  DispatchPage.ts    route planner panels + map
  RoutesPage.ts      list + route detail (stops, map)
  DocumentsPage.ts   list + document detail + Waste Transfer Notes list
  ReportsPage.ts     period tabs, report tabs, chart cards
  SettingsPage.ts    section chips, info rows, preset badge
fixtures/
  base.ts        extended Playwright `test` providing appShell, settings, preset
test-data/       static test data
utils/
  errors.ts      expectNoAppError — Vite overlay / crash-screen check
  locators.ts    exactText regex helper
tests/
  smoke/         app-loads.spec.ts — shell, branding and error-free load
  navigation/    sidebar-navigation.spec.ts — every enabled module loads
  presets/       preset-branding, preset-navigation, preset-terminology,
                 preset-settings, waste-module — all driven by preset config
  dashboard/     KPI cards, sections, map, attention area
  customers/     list + detail tabs and cards
  bookings/      list + summary cards + detail
  jobs/          list + detail (terminology-aware)
  dispatch/      route planner panels and map
  routes/        list KPIs + route detail (stops, map)
  documents/     list + detail; wasteDemo-only WTN checks
  reports/       KPIs, chart cards, tab/period switching
  settings/      all configuration sections render
playwright.config.ts
```

## Writing tests

- Use the extended `test`/`expect` from `fixtures/base.ts` — it supplies the
  `appShell`, `settings` and `preset` fixtures, no per-test setup needed.
- Instantiate module page objects directly: `const jobs = new JobsPage(page)`.
- Prefer accessible locators: `getByRole`, `getByText`, `getByLabel`.
  Never use CSS-module class names or `nth-child`. Where a label also appears
  in table cells, scope to `div` + anchored text (`utils/locators.ts`).
- Tests are read-only — no creating/editing/deleting application data.
- Never use `waitForTimeout`; rely on `expect` auto-waiting assertions.
- Keep page objects small and focused — one file per feature area.

## CI

Set `CI=true` (automatic in GitHub Actions, Azure Pipelines, etc.) to get
retries, conservative parallelism and `test.only` protection. Provide
`BASE_URL` (and `CLIENT_PRESET`) for the deployed environment.
