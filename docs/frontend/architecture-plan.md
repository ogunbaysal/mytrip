# Frontend Architecture Plan - MyTrip Web Application

## Overview

This document outlines the technical architecture for the MyTrip web application (@apps/web), a traveler-focused platform with AirBNB-inspired design and bilingual support (Turkish/English).

## Tech Stack

### Core Framework
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **next-intl** for internationalization

### State Management
- **React Query/TanStack Query** for server state
- **Zustand** for client-side state
- **React Hook Form** for form state

### UI & Design
- **Radix UI** for accessible components
- **Lucide React** for icons
- **Framer Motion** for animations
- **shadcn/ui** components

### Development Tools
- **ESLint** with custom rules
- **Prettier** for code formatting
- **TypeScript** strict mode
- **Turbo** for monorepo builds

## Directory Structure

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── (marketing)/   # Marketing pages group
│   │   ├── places/        # Place listing pages
│   │   ├── blog/          # Blog pages
│   │   └── collections/   # Collection pages
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── layout/           # Layout components
│   ├── marketing/        # Marketing-specific components
│   ├── places/           # Place-related components
│   ├── blog/             # Blog components
│   └── shared/           # Shared components
├── lib/                  # Utility functions
│   ├── api.ts           # API client
│   ├── utils.ts         # General utilities
│   ├── validations.ts   # Zod schemas
│   └── constants.ts     # App constants
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── types/               # TypeScript type definitions
├── styles/              # Additional styles
└── middleware.ts        # Next.js middleware for i18n
```

## Routing Strategy

### URL Structure (i18n)
```
/                         # Turkish homepage
/en                       # English homepage
/isletmeler               # Turkish places listing
/placees               # English places listing
/isletme/[slug]        # Turkish place detail
/place/[slug]        # English place detail (slug_en)
/yazilar                 # Turkish blog
/blog                 # English blog
/yazi/[slug]          # Turkish blog post
/blog/[slug]          # English blog post
/collections          # Turkish collections
/collections          # English collections
/koleksiyon/[slug]   # Turkish collection detail
/collection/[slug]   # English collection detail
```

### Route Groups
- `(marketing)` - Homepage, about, contact pages
- `places` - Place listings and details
- `blog` - Blog listings and posts
- `collections` - Curated collections

## Component Architecture

### Design System Hierarchy

```
1. Primitives (Radix UI)
   ↓
2. Base Components (shadcn/ui)
   ↓
3. Composite Components (Business Logic)
   ↓
4. Page Components (Full Features)
```

### Component Categories

#### Base Components (`components/ui/`)
- Button, Input, Card, Modal, etc.
- Direct shadcn/ui components with AirBNB styling
- No business logic, pure UI

#### Layout Components (`components/layout/`)
- Header, Footer, Navigation, Sidebar
- Page layout structures
- Responsive breakpoints

#### Feature Components
- **Places** (`components/places/`)
  - PlaceCard, PlaceGrid, PlaceDetail, PlaceSearch, PlaceFilters
- **Blog** (`components/blog/`)
  - BlogCard, BlogGrid, BlogPost, BlogCategories
- **Collections** (`components/collections/`)
  - CollectionCard, CollectionGrid, CollectionDetail

#### Shared Components (`components/shared/`)
- LanguageSwitcher, SearchBar, Pagination, LoadingStates
- SEOHead, ImageOptimized, MapComponent

## State Management Strategy

### Server State (React Query)
```typescript
// API queries and mutations
const places = useQuery({
  queryKey: ['places', filters],
  queryFn: () => api.places.getAll(filters)
});

const place = useMutation({
  mutationFn: api.places.create,
  onSuccess: () => queryClient.invalidateQueries(['places'])
});
```

### Client State (Zustand)
```typescript
// Global app state
interface AppStore {
  theme: 'light' | 'dark';
  searchFilters: PlaceFilters;
  favoriteIds: string[];
  setTheme: (theme: 'light' | 'dark') => void;
  setSearchFilters: (filters: PlaceFilters) => void;
  toggleFavorite: (id: string) => void;
}
```

### Form State (React Hook Form)
```typescript
// Form handling with validation
const form = useForm<PlaceSearchForm>({
  resolver: zodResolver(placeSearchSchema),
  defaultValues: {
    location: '',
    checkIn: null,
    checkOut: null,
    guests: 1,
    type: 'all'
  }
});
```

## Performance Optimization

### Image Optimization
- Next.js Image component with optimization
- WebP format with fallbacks
- Responsive images with srcSet
- Lazy loading for below-fold images

### Code Splitting
- Route-based code splitting (automatic with App Router)
- Component-level dynamic imports for heavy components
- Lazy loading for non-critical features

### Caching Strategy
- Static Generation (SSG) for marketing pages
- Incremental Static Regeneration (ISR) for places/blogs
- Client-side caching with React Query
- CDN caching for static assets

### Bundle Optimization
- Tree shaking for unused code
- Bundle analysis with @next/bundle-analyzer
- Dynamic imports for large dependencies
- Font optimization with Next.js fonts

## SEO & Meta Tags

### Dynamic Meta Tags
```typescript
// Generate metadata for each page
export async function generateMetadata({
  params: { locale, slug }
}: {
  params: { locale: string; slug: string }
}): Promise<Metadata> {
  const place = await api.places.getBySlug(slug, locale);

  return {
    title: place.metaTitle || place.name,
    description: place.metaDescription || place.shortDescription,
    openGraph: {
      title: place.name,
      description: place.shortDescription,
      images: [place.featuredImage],
      locale: locale,
      alternateLocale: locale === 'tr' ? 'en' : 'tr'
    },
    alternates: {
      languages: {
        tr: `/tr/places/${place.slug}`,
        en: `/en/places/${place.slugEn}`
      }
    }
  };
}
```

### Structured Data
- JSON-LD schema for places (LocalBusiness, Restaurant, etc.)
- Article schema for blog posts
- BreadcrumbList for navigation
- Organization schema for site identity

## Accessibility (WCAG 2.1 AA)

### Implementation Requirements
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management
- Color contrast compliance (4.5:1 minimum)
- Screen reader compatibility
- Responsive text sizing

### Testing Strategy
- Automated testing with @axe-core/react
- Manual testing with screen readers
- Keyboard-only navigation testing
- Color blindness testing
- Mobile accessibility testing

## Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Additional Metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 500KB initial, < 2MB total
- **Lighthouse Score**: > 90 (Performance, Accessibility, Best Practices, SEO)

## Security Considerations

### Content Security Policy
```javascript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
    `
  }
];
```

### Data Protection
- Input sanitization for user-generated content
- XSS protection with proper escaping
- CSRF protection for forms
- Secure cookie handling
- Environment variable protection

## Development Workflow

### Code Quality
- Pre-commit hooks with Husky
- ESLint with custom rules for accessibility
- Prettier for consistent formatting
- TypeScript strict mode
- Unit testing with Jest/Testing Library

### Build Process
- Development: Hot reloading with Next.js dev server
- Staging: Preview deployments with branch previews
- Production: Optimized builds with caching

### Monitoring & Analytics
- Error tracking with Sentry
- Performance monitoring with Web Vitals
- User analytics with privacy-compliant solution
- Real user monitoring (RUM)

## Integration Points

### API Integration
- RESTful API with @apps/api
- Type-safe API client with TypeScript
- Error handling and retry logic
- Loading states and optimistic updates

### Database Integration
- Shared types with @mytrip/database
- Consistent data models
- Error boundary implementation

### Shared Packages
- `@mytrip/types` for shared TypeScript types
- `@mytrip/config` for shared configurations
- `@mytrip/eslint-config` for linting rules

## Deployment Strategy

### Environment Configuration
- Development: Local development with hot reload
- Staging: Vercel preview deployments
- Production: Vercel production with CDN

### Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.mytrip.com
NEXT_PUBLIC_SITE_URL=https://mytrip.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_MAPS=true

# External Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
NEXT_PUBLIC_SENTRY_DSN=xxx
```

This architecture provides a scalable, maintainable, and performant foundation for the MyTrip web application with modern development practices and user experience focus.