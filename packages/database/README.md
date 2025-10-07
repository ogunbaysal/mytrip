# @mytrip/database

Database package for the MyTrip application using Drizzle ORM with PostgreSQL.

## Features

- **Bilingual Support**: Turkish (primary) and English content fields
- **User Management**: Travelers, place owners, and admin users
- **Place Listings**: Hotels, restaurants, villas, flats, and activities
- **Content Management**: Blogs and curated collections
- **Subscription System**: Flexible subscription plans and payment tracking
- **SEO Optimized**: URL-friendly slugs and meta tags

## Schema Overview

### Core Tables

- `users` - User accounts with role-based access
- `places` - Business listings with type-specific data
- `blogs` - Editorial and owner-generated content
- `collections` - Curated lists of places and content
- `subscription_plans` - Available subscription tiers
- `subscriptions` - User subscription records
- `payments` - Payment transaction history

### Key Features

- **Internationalization**: Separate fields for Turkish and English content
- **Flexible Data**: JSONB fields for type-specific and dynamic data
- **SEO Ready**: Slug generation and meta tag support
- **Audit Trail**: Created/updated timestamps on all tables
- **Performance**: Strategic indexes for common query patterns

## Setup

1. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/mytrip"
```

2. Install dependencies:
```bash
bun install
```

3. Generate and run migrations:
```bash
bun run db:generate
bun run db:migrate
```

4. Seed initial data:
```bash
bun run db:seed
```

## Available Scripts

- `db:generate` - Generate migration files from schema
- `db:migrate` - Apply pending migrations
- `db:push` - Push schema directly to database (dev only)
- `db:studio` - Launch Drizzle Studio GUI
- `db:drop` - Drop database tables
- `db:seed` - Seed database with initial data

## Usage

```typescript
import { db, users, places } from '@mytrip/database';

// Query users
const allUsers = await db.select().from(users);

// Create a new place
await db.insert(places).values({
  name: 'Hotel Example',
  nameEn: 'Hotel Example',
  description: 'A beautiful hotel...',
  // ... other fields
});
```
