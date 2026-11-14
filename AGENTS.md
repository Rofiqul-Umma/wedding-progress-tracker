# AGENTS.md

A dedicated guide for AI coding agents working on **Evermore — Wedding Progress Tracker**.

## Dev environment tips
- Start the development server with `npm run dev` (serves on `http://localhost:4173`). No `.env.local` is required to run or develop offline-first features.
- Use path aliases (`@domain/*`, `@application/*`, `@infrastructure/*`, `@presentation/*`) defined in `tsconfig.app.json` and `vite.config.ts` instead of deep relative imports (`../../..`).
- Respect the Clean Architecture dependency flow (dependencies point inward):
  - `@domain` (`src/domain/`) — Pure entities, value objects, repository port interfaces, and pure domain services (`budget`, `progress`, `schedule`). No React, no browser I/O, no Firebase.
  - `@application` (`src/application/`) — Use cases and DTO validation operating over `@domain` types.
  - `@infrastructure` (`src/infrastructure/`) — Concrete adapters: `localStorage` persistence, `migrate()`, safety backups, Firebase (`FirestoreRoomRepository`, `FirestoreAccountRepository`, FCM push), `i18next` (`en`/`id`), theme storage, and formatters.
  - `@presentation` (`src/presentation/`) — React 18 UI, contexts (`Theme`, `Plan`, `Nav`, `Ui`, `Room`, `Account`), pages, and components. Keep framework-free helpers in `src/presentation/lib/` and React hooks in `src/presentation/hooks/`.
  - `api/` — Vercel Serverless / Edge handlers (`api/cron-notifications.ts`, `api/room-notify.ts`) and shared utilities in `api/_lib/` for Web Push (FCM) notifications.
- Styling uses **Tailwind CSS v4** configured via `@theme` in `src/index.css` (there is no `tailwind.config.js`). Tokens read only from JS (like `--color-cat-1..8`) must remain in a plain `:root` block so they are not tree-shaken.
- Any user-facing strings must be added to both English (`src/infrastructure/i18n/resources/en.ts`) and Indonesian (`src/infrastructure/i18n/resources/id.ts`) locale files.
- Schema changes to `PlanState` must remain backwards-compatible in `src/infrastructure/persistence/migrate.ts` (supply safe defaults and never throw on legacy `evermore.v2` data).
- Do not modify `legacy/` — it is kept strictly as a historical reference and is excluded from the build and linter.

## Testing instructions
- Run the full test suite with `npm test` (runs `vitest run` in a `jsdom` environment).
- To focus on a specific test file or test name during development:
  - By file: `npx vitest run src/domain/services/budget.test.ts`
  - By test name pattern: `npx vitest run -t "<test name>"`
- Run `npm run typecheck` (`tsc -b --noEmit`) and `npm run lint` (`eslint .`) after moving files, changing imports, or modifying types.
- Domain services and application use cases should be unit-tested directly as pure functions.
- Presentation tests should render through `src/test/renderWithProviders.tsx` so all required contexts (`Theme`, `Plan`, `Nav`, `Ui`, `Room`, `Account`) and i18n are wired up.
- Add or update tests for the code you change, even if nobody asked, and fix any test, lint, or type errors until the suite is green.

## PR & commit instructions
- Follow Conventional Commits for commit messages and PR titles: `<type>: <description>` (e.g., `feat: ...`, `fix: ...`, `refactor: ...`, `chore: ...`).
- Always run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` before committing or opening a pull request.
- Never commit `.env.local`, Firebase service account keys, or real credentials.
