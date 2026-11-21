# BB-Trading — Build Phases Tracker

**Project:** BB-Trading (Aviator Bot Desktop App)
**Started:** 2026-04-18
**Status:** In Progress

## Goal
Convert the Node.js Aviator bot into a professional desktop app (Electron + TypeScript) with:
- Embedded Chrome view (no external browser window)
- Neon Postgres + Prisma (round history, sessions, settings)
- TanStack Query for data fetching
- Dashboard UI from `dashboard design.html` (Tailwind + Inter/Space Grotesk/JetBrains Mono)
- All config in `.env`

## Phases

- [x] Phase 1 — Project scaffolding & tooling
- [x] Phase 2 — Database schema & Prisma setup (Neon)
- [x] Phase 3 — Core domain types & models
- [x] Phase 4 — Electron main process & window management
- [x] Phase 5 — Embedded browser view (webview) for game
- [x] Phase 6 — Port bot logic to TypeScript services
- [x] Phase 7 — IPC bridge (main ↔ renderer)
- [x] Phase 8 — Dashboard UI (React + TanStack Query)
- [x] Phase 9 — Settings panel + dashboard wiring
- [x] Phase 10 — Integration, packaging & polish

## Notes
- All secrets/config go in `.env` (see `.env.example`).
- Phase status updated here after each phase completes.
- Any AI continuing should read this file first, then resume from the first unchecked phase.
