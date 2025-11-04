# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyTrip is a web-first travel discovery platform for Türkiye's Muğla region. It's built as a monorepo using Turborepo with multiple applications: a traveler-facing web app, API backend, and planned dashboard and admin panels.

## Commands

### Development
- `bun install` - Install all dependencies across the monorepo
- `bun dev` - Start development servers for all apps using Turborepo
- `bun run dev` - Start development servers for all apps using Turborepo
- `turbo dev` - Alternative command to start development servers

### Building
- `bun build` - Build all applications using Turborepo
- `turbo build` - Build all applications

### Code Quality
- `bun lint` - Run ESLint across all packages
- `turbo lint` - Alternative command to run linting
- `bun type-check` - Run TypeScript type checking across all packages
- `turbo type-check` - Alternative command to run type checking

### Individual App Commands
For the web application (`apps/web`):
- `cd apps/web && bun dev` - Start Next.js development server with Turbopack
- `cd apps/web && bun build` - Build Next.js application with Turbopack
- `cd apps/web && bun lint` - Run ESLint for the web app

For the API (`apps/api`):
- `cd apps/api && bun run dev` - Start Hono development server with hot reload

### Package Management
- Use the scripts in the root package.json:
  - `bun run add:web [package]` - Add dependency to web app
  - `bun run add:api [package]` - Add dependency to API
  - `bun run add:dashboard [package]` - Add dependency to dashboard
  - `bun run add:admin [package]` - Add dependency to admin
  - `bun run add:db [package]` - Add dependency to database package

### Cleanup
- `bun clean` - Clean build artifacts across all packages
- `turbo clean` - Alternative command to clean artifacts

## Architecture

### Monorepo Structure
This is a Turborepo monorepo with the following structure:
```
mytrip/
├── apps/
│   ├── web/          # NextJS 15 - Traveler frontend (main app)
│   ├── api/          # HonoJS - Backend API server
│   ├── dashboard/    # Planned - Place owner dashboard
│   └── admin/        # Planned - Admin panel
├── packages/         # Shared packages (currently empty)
├── docs/            # Documentation and admin auth setup
├── PRD.md           # Product Requirements Document
├── turbo.json       # Turborepo configuration
└── package.json     # Root package configuration
```

### Current Implementation Status

**Web App (`apps/web`)**:
- Next.js 15 with React 19 and TypeScript
- Turbopack for development and building
- Tailwind CSS v4 for styling
- Modern React patterns with hooks and server components
- Turkish as primary language with English support planned
- Pages: Home, Places, Blog, About, Contact, Privacy, Terms
- Component structure with shared shell and providers

**API (`apps/api`)**:
- Hono.js framework for fast, edge-compatible API
- Bun runtime with TypeScript support
- Drizzle ORM with PostgreSQL driver
- Better Auth for authentication
- Basic Hono app setup with "Hello Hono!" route
- Database schemas prepared but currently empty
- Hot reload development server

**Database**:
- PostgreSQL with Drizzle ORM
- Migration system via Drizzle Kit
- Schema structure in `apps/api/src/db/schemas/`
- Requires `MIGRATIONS_DB_URL` environment variable

### Technology Stack

**Frontend**:
- Next.js 15 (App Router) with React 19
- TypeScript 5.x
- Tailwind CSS v4
- Framer Motion for animations
- React Hook Form with Zod validation
- TanStack Query for data fetching
- Zustand for state management
- Radix UI components
- Lucide React icons
- Leaflet maps with React Leaflet
- Date-fns for date handling

**Backend**:
- Hono.js web framework
- Bun runtime
- TypeScript
- Drizzle ORM
- PostgreSQL
- Better Auth
- dotenv for environment configuration

**Development Tools**:
- Turborepo for monorepo management
- ESLint with Next.js config
- TypeScript compiler
- Bun as package manager

### Key Features in Scope

Based on the PRD, the platform aims to provide:
- **Travelers**: Discovery platform for accommodations, restaurants, activities, and curated content
- **Place Owners**: Subscription-based listing management with blog content capabilities
- **Admin Team**: Platform management, analytics, and oversight tools

The project follows an Airbnb-style interface approach and focuses on the Muğla region of Türkiye as the initial launch market.

## Development Notes

### Environment Setup
- Uses Bun as the package manager (bun@1.2.18)
- Requires Node.js >= 18
- Environment variables should be configured via `.env` files
- API requires database connection for migration operations

### Database Development
- Schema definitions go in `apps/api/src/db/schemas/index.ts`
- Use Drizzle migrations for database changes
- The database setup is prepared but schemas need to be implemented

### Internationalization
- Primary language: Turkish
- Secondary language: English (for international travelers)
- Current implementation uses Turkish content in metadata

### Performance Considerations
- Next.js with Turbopack for fast builds and development
- Hono.js for high-performance API
- Bun runtime for optimal JavaScript execution
- Tailwind CSS v4 for modern, performant styling