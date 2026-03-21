# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Daylist** — offline-first personal task manager, notes, and finance tracker. Works without auth in offline mode (data in IndexedDB), syncs to server when user has an account and internet connection.

## Commands

### Root (all apps via Turborepo)
```bash
pnpm dev       # Start all apps in dev mode (with TUI)
pnpm build     # Build all apps
pnpm lint      # Lint all apps
pnpm format    # Format all files with Prettier
```

### Web app (`apps/web`)
```bash
pnpm dev       # Next.js dev server on port 3000
pnpm build     # Production build
pnpm lint      # ESLint
```

### API app (`apps/api`)
```bash
pnpm dev           # NestJS watch mode on port 3001
pnpm build         # Compile TypeScript
pnpm test          # Jest unit tests
pnpm test:watch    # Jest in watch mode
pnpm test:cov      # Jest with coverage
pnpm test:e2e      # E2E tests (jest-e2e.json config)
pnpm lint          # ESLint with auto-fix
```

## Architecture

### Monorepo structure
- `apps/web` — Next.js 15 frontend (App Router, `src/app/`)
- `apps/api` — NestJS 10 backend
- `packages/` — shared libraries (empty, ready for reuse)
- `specs/` — project specifications

### Frontend (`apps/web`)
- Next.js 15 with App Router (`src/app/`)
- Path alias: `@/*` → `./src/*`
- Planned: Tailwind CSS, shadcn/ui, Radix UI, Storybook, IndexedDB for offline storage

### Backend (`apps/api`)
- NestJS with Express, all routes prefixed `/api`, CORS enabled
- Port: `PORT` env var or 3001
- Planned: PostgreSQL + TypeORM

### UI requirements
- Responsive breakpoints: 320px, 768px, 1024px, 1600px
- Max content width: 1600px (centered with side margins above that)
- Single color scheme: neutral mid-tone palette, easy on the eyes (neither fully light nor dark)
- Todo list: drag-and-drop, nested subtasks via drag

### Code style
- Prettier: single quotes, semicolons, 2-space indent, trailing commas, 80-char width
- TypeScript strict mode in both apps
