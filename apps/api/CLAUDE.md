# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hono-based API backend using Bun as the runtime. It includes PostgreSQL database integration via Drizzle ORM and Better Auth for authentication.

## Commands

### Development
- `bun install` - Install dependencies
- `bun run dev` - Start development server with hot reload at http://localhost:3000

### Database Operations
- Database migrations are handled through Drizzle Kit
- Migration files are generated in `./src/db/migrations`
- Requires `MIGRATIONS_DB_URL` environment variable for database operations

## Architecture

### Core Structure
- **Entry Point**: `src/index.ts` - Hono application setup with basic routing
- **Database**:
  - Schema definitions in `src/db/schemas/index.ts`
  - Drizzle ORM configuration in `drizzle.config.ts`
  - PostgreSQL as the primary database
- **Authentication**: Better Auth integration for user management

### Key Dependencies
- **Hono**: Fast web framework for edge runtime compatibility
- **Drizzle ORM**: Type-safe SQL database toolkit
- **Better Auth**: Authentication solution
- **PostgreSQL**: Primary database via `pg` driver
- **Bun**: JavaScript runtime and package manager

### Environment Configuration
- Uses `.env` file for environment variables
- `MIGRATIONS_DB_URL` is required for database migration operations
- dotenv configuration is loaded automatically

## Development Notes

### Database Schema
- Schema files are currently minimal (empty index.ts in schemas directory)
- When adding tables, define them in `src/db/schemas/index.ts`
- Use Drizzle migrations to manage database changes

### Project Structure
- Monorepo setup with this API as one app
- Database integration is prepared but schema needs to be implemented
- Authentication is configured via Better Auth but routes need to be added