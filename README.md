# Evermore — Wedding Progress Tracker

A wedding planner that runs entirely in the browser. Track the timeline, vendors, budget,
tasks, shopping, seserahan (gift trays) and contacts — offline-first, installable as a PWA,
in English or Indonesian.

Everything is stored on the device by default. Cloud sync and realtime collaboration are
optional and only appear once Firebase is configured.

---

## Features

| Area | What it does |
|---|---|
| **Dashboard** | Countdown to the date, progress across every section, upcoming tasks, task detail panel |
| **Vendors** | Status (shortlist → deposit → booked), per-vendor quote line items with qty × price, deposits, linked contacts |
| **Budget** | Estimated vs actual per line, plus paid-off totals rolled up from vendors and purchased shopping items |
| **Tasks** | Due dates, categories, per-item icons, reference links, inline file/image attachments |
| **Shopping** | Store, unit price, qty, status, product link, reference photo |
| **Seserahan** | Single trays or bundles — a bundle's status is derived from its contents |
| **Contacts** | Role, phone, social profile URL, notes |
| **Reports** | Filterable table view, horizontal scroll on mobile, CSV export and print-to-PDF |
| **Notifications** | Derived alerts (overdue tasks, unpaid vendors, budget pressure) with jump-to-page |
| **Settings** | Currency, language, appearance, wedding details, cartoon avatars, backup export/import, sample plan, clear data |

**Cross-cutting**

- **Offline-first PWA** — service worker precaches the app shell, fonts and avatar art;
  installable to a phone home screen (`display: standalone`).
- **Theme** — light / dark / follow-system, applied before first paint so there is no flash.
  Device-local, deliberately outside the synced plan.
- **i18n** — English and Indonesian, including category and status labels.
- **Back-button dismissal** — while any overlay is open (modal, image viewer, mobile drawer,
  notifications), the system Back button closes it instead of leaving the app.
- **Safe curved-edge layout** — safe-area insets are respected throughout.

---

## Getting started

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:4173>. No configuration is needed — the app runs fully offline
against `localStorage`.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on port 4173 |
| `npm run build` | Type-check (`tsc -b`) then build to `dist/` |
| `npm run preview` | Serve the production build on port 4173 |
| `npm run typecheck` | Types only, no emit |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint over the repo |

---

## Optional: cloud sync & collaboration

Both features are gated on Firebase being configured. Without it, the app runs offline and
the related UI stays hidden.

1. Copy the template and fill in your Firebase web config
   (Firebase console → Project settings → General → Your apps → SDK setup → Config):

   ```bash
   cp .env.example .env.local
   ```

2. In the Firebase console, enable the sign-in methods you want under
   **Authentication → Sign-in method**:
   - **Anonymous** — required for shared rooms.
   - **Google** — required for private per-account sync.

3. Publish the rules in [`firestore.rules`](firestore.rules).

`.env.local` is gitignored. Never commit real credentials.

### What each mode does

**Private cloud sync (Google sign-in).** Your plan is mirrored to `users/{uid}` in
Firestore and kept in step across your devices. Before any existing cloud plan is adopted,
a *verified* local snapshot is written to `localStorage` as a safety backup — if that
backup cannot be created and read back, the cloud data is not loaded at all and the local
plan is left untouched. Backups are listed in Settings, and can be restored or downloaded.

**Shared rooms (anonymous auth).** Create a room and share the link; anyone who opens it
edits the same plan in realtime, with live presence. The unguessable room id is the only
access gate — this matches the "open link, anyone edits" model and is documented in
`firestore.rules`. While a room is open, private cloud sync pauses and resumes on leave.
Attachments too large to sync stay on the local device and raise a notice.

---

## Architecture

Clean Architecture with dependencies pointing inward. Path aliases (`vite.config.ts`,
`tsconfig`) enforce the boundary at import time.

```
src/
  domain/          @domain          entities, value objects, pure services
    entities/        PlanState and every record type
    value-objects/   status, categories, icons, avatars, theme
    services/        budget, progress, schedule — pure, no React, no I/O
    repositories/    port interfaces (RoomRepository, AccountRepository)

  application/     @application     use cases over the domain
    use-cases/       CRUD, budget, report, data import/export, sync diffing,
                     account migration decisions

  infrastructure/  @infrastructure  adapters to the outside world
    persistence/     localStorage plan repo, safety backups, migrate, seed
    firebase/        Firestore room + account repositories, config, env gate
    i18n/            i18next config and en/id resources
    theme/           storage + DOM application
    format/          currency and date formatting

  presentation/    @presentation    React
    app/             App and the provider composition root
    state/           Plan, Theme, Nav, Ui, Room, Account contexts
    pages/           one component per nav destination
    components/      layout, ui primitives, forms, dashboard
    hooks/           React-facing helpers (useBackDismiss, useForms, useToast…)
    lib/             pure helpers (cn, backDismiss, attachments, lineItems…)
```

Two conventions worth knowing before adding code:

- **`lib/` vs `hooks/`.** Pure, framework-free helpers live in `presentation/lib/`; anything
  that touches React lives in `presentation/hooks/`. Several features are a pure module in
  `lib/` plus a thin hook wrapper — `backDismiss.ts` / `useBackDismiss.ts` is the model.
- **Domain services are pure.** Anything computed from plan state (totals, progress
  percentages, notifications) belongs in `domain/services/` and is unit-tested directly
  rather than through the UI.

### State

Provider order is deliberate (`presentation/app/providers.tsx`): `Theme` is outermost
because it depends on nothing and is device-local, so it stays outside sync. `Plan` holds
the single source of truth and persists on every change; `Room` and `Account` sit around it
and relay snapshots through `SyncCoordinator` rather than reaching into plan state.

### Persistence and migration

The plan lives under the `evermore.v2` localStorage key — the same key the legacy app used,
so upgrading never orphans existing data. Every read goes through `migrate()`, which coerces
arbitrary parsed input into a well-formed `PlanState`, fills defaults for anything missing,
and never throws. New fields are therefore additive and backwards-compatible: an old blob
loads cleanly, and a plan written by a newer build still opens in an older one minus the
new fields.

Backups (`evermore.v2.backup.*`) and the theme (`evermore.theme`) are stored separately, so
the theme never round-trips through sync.

---

## Styling

Tailwind v4, configured in CSS via `@theme` in `src/index.css` — there is no
`tailwind.config.js`. Two build behaviours matter when editing tokens:

- Colour utilities compile to `var(--color-*)`, so a theme can override them at runtime.
  **Shadows do not** — `--shadow-*` values are inlined at build time.
- `@theme` variables that nothing references are tree-shaken. Tokens read only from JS
  (the category colours `--color-cat-1..8`) live in a plain `:root` block for that reason.

---

## Testing

Vitest + Testing Library in jsdom. Current suite: **212 tests across 28 files**.

```bash
npm test
```

Domain and application logic is tested directly as pure functions; presentation tests render
through `src/test/renderWithProviders.tsx` so every context is in place. `vitest.setup.ts`
installs a `localStorage` stand-in and a `matchMedia` stub (jsdom has neither, and
`ThemeProvider` needs the latter).

---

## Deployment

Configured for Vercel via [`vercel.json`](vercel.json) — `npm run build`, output `dist/`,
with an SPA rewrite so deep links resolve to `index.html`. Any static host works with the
same two settings.

If you use Firebase, add your production domain to
**Authentication → Settings → Authorized domains**, or Google sign-in will fail there while
working locally.

---

## Notes

- `legacy/` holds the original single-file app this project replaced. It is kept for
  reference only and is not part of the build.
- Attachments and reference photos are stored inline as `data:` URLs inside the plan, which
  keeps the app dependency-free but does count against localStorage and sync payload limits.
