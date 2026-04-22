# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server with Turbopack (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm run start      # Start production server
```

No tests are currently configured (`npm test` exits with 0 but does nothing).

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:
- `MONGODB_URI` — MongoDB connection string (local or Atlas)
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET` — Auth config
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth (optional)

## Architecture

This is a **Next.js 15 App Router** application for planning factories in the game Satisfactory. Users create factories, add production lines, and the app tracks resource dependencies between factories.

### Data Layer

MongoDB via Mongoose. Five collections:
- **Factory** — top-level user-owned factory, has `userId`, `locationId`, `order`, `tasks[]`, `notes[]`
- **ProductionLine** — belongs to a Factory; references Item + Recipe by `className`; stores calculated metrics (buildings, power, efficiency)
- **Item** / **Recipe** — game data imported via `POST /api/admin/import-data`; not user-created
- **Location** — user-defined groupings for factories with color/icon

All factory API routes require an authenticated NextAuth session. Session is JWT-based.

### API Routes (`src/app/api/`)

Pattern: `/api/factories/[id]/...` for factory-scoped operations.

Key route groups:
- `/api/factories` — CRUD + reorder
- `/api/factories/[id]/production-lines/[lineId]` — production line CRUD
- `/api/factories/[id]/imports` / `exports` — dependency declarations
- `/api/factories/[id]/tasks` / `notes` — factory annotations
- `/api/items` / `/api/recipes` — game data reads
- `/api/locations` — CRUD + reorder
- `/api/admin/*` — data import and migration utilities

### Component Structure

```
RootLayout (layout.tsx)
├── TopNav                     — auth, navigation
├── Sidebar                    — factory list, dnd-kit drag reorder
└── page.tsx (home)
    └── FactorySection         — main factory detail view
        ├── ProductionLineCard[]
        ├── DependencyTracker  — analyzes cross-factory dependencies
        ├── ImportsList / ExportsList
        ├── EnhancedItemRecipeSelector
        └── FactoryDependencyGraph  — D3.js visualization
```

Interactive components use `"use client"`. Server Components are the default.

### Key Libraries

- **shadcn/ui + Radix UI** — base UI components in `src/components/ui/`
- **@dnd-kit** — drag-and-drop reordering in Sidebar and lists
- **D3.js** — dependency graph visualization in `FactoryDependencyGraph.tsx`
- **Framer Motion** — animations
- **NextAuth.js v4** — authentication with Google/GitHub OAuth

### Path Alias

`@/*` maps to `src/*` — use this for all internal imports.
