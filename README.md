# MyTrip

A modern travel booking application built as a monorepo with Next.js, Hono, and PostgreSQL.

## 🏗️ Architecture

This is a Turborepo monorepo with three main applications:

- **`apps/web`** - Customer-facing booking app (Next.js 15, React 19)
- **`apps/admin`** - Admin dashboard (Next.js 15, React 19)
- **`apps/api`** - Backend API server (Hono + Bun)

### Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI Components**: shadcn/ui (Radix primitives + Tailwind v4)
- **Backend**: Hono framework on Bun runtime
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with Drizzle adapter
- **State Management**: TanStack Query for client data fetching
- **Package Manager**: Bun
- **Monorepo**: Turborepo

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Bun 1.2.18+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables for each app:

   **API (`apps/api/.env`)**:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/mytrip
   DATABASE_SSL=true
   PORT=3002
   BETTER_AUTH_SECRET=your-secret-key
   BETTER_AUTH_URL=http://localhost:3002
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

   **Web (`apps/web/.env.local`)**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
   ```

   **Admin (`apps/admin/.env`)**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
   ```

### Development

Start all applications:
```bash
bun run dev
```

Start individual applications:
```bash
bun run dev --filter=web    # http://localhost:3000
bun run dev --filter=admin  # http://localhost:3001
bun run dev --filter=api    # http://localhost:3002
```

## 📦 Available Scripts

### Root Commands
- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all applications for production
- `bun run lint` - Lint all packages
- `bun run type-check` - Type check all packages
- `bun run clean` - Clean all caches and build outputs

### Package-specific Commands
- `bun run add:web <package>` - Add dependency to web app
- `bun run add:admin <package>` - Add dependency to admin app
- `bun run add:api <package>` - Add dependency to API server

### API Commands
Navigate to `apps/api` directory:
- `bun test` - Run API tests
- `bun run dev` - Start API server with hot reload

## 🗄️ Database

The application uses PostgreSQL with Drizzle ORM for type-safe database operations.

### Database Schema
- Schema definitions: `apps/api/src/db/schemas/`
- Migration files: `apps/api/src/db/migrations/`

### Migrations
Generate and run migrations using Drizzle Kit (configured in `apps/api`).

## 🧪 Testing

Run tests for the API server:
```bash
cd apps/api && bun test
```

Tests use the `bun:test` framework with `describe`/`test`/`expect` syntax.

## 🎨 UI Components

Both frontend applications use:
- **shadcn/ui**: High-quality component library built on Radix primitives
- **Tailwind CSS v4**: For styling and responsive design
- **Lucide React**: Icon library

Components follow the shadcn/ui patterns and can be customized as needed.

## 🔐 Authentication

Authentication is handled by Better Auth with:
- Drizzle adapter for database integration
- Session-based authentication
- Anonymous auth support
- API endpoints mounted at `/api/auth/*`

## 📁 Project Structure

```
mytrip/
├── apps/
│   ├── web/          # Customer booking app
│   ├── admin/        # Admin dashboard
│   └── api/          # Backend API server
├── docs/             # Documentation and reference materials
├── package.json      # Root package.json with Turborepo scripts
└── turbo.json        # Turborepo configuration
```

## 🌐 Development Workflow

1. All development happens within the `apps/` directories
2. Shared UI patterns are documented in `docs/`
3. Use the `@/*` path alias for internal imports
4. TanStack Query is used for all client data fetching
5. Follow the existing code style (TypeScript-first, Prettier formatting)

## 📝 Environment Notes

- Web app runs on port 3000
- Admin app runs on port 3001
- API server runs on port 3002
- Ensure CORS is properly configured in the API for development origins

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests: `bun run lint && bun run type-check && cd apps/api && bun test`
5. Submit a pull request

## 📄 License

Add your license information here.