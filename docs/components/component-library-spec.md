# Component Library Specification - MyTrip Web Application

## Overview

This document defines the component library for the MyTrip web application, following AirBNB's design principles with bilingual support and accessibility compliance.

## Design System Foundation

### Design Tokens

#### Color Palette
```css
:root {
  /* Primary Colors (AirBNB-inspired) */
  --color-primary-50: #fff5f5;
  --color-primary-100: #ffe3e3;
  --color-primary-200: #ffc9c9;
  --color-primary-500: #ff5a5f; /* AirBNB red */
  --color-primary-600: #e04147;
  --color-primary-700: #c73539;

  /* Neutral Colors */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f4f4f5;
  --color-gray-200: #e5e5e5;
  --color-gray-300: #d4d4d8;
  --color-gray-400: #a1a1aa;
  --color-gray-500: #71717a;
  --color-gray-600: #52525b;
  --color-gray-700: #3f3f46;
  --color-gray-800: #27272a;
  --color-gray-900: #18181b;

  /* Success, Warning, Error */
  --color-success-500: #10b981;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
}
```

#### Typography
```css
:root {
  /* Font Families */
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --font-family-display: 'Cal Sans', 'Inter', system-ui, sans-serif;

  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

#### Spacing Scale
```css
:root {
  /* Spacing (8px base unit) */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
}
```

## Base Components (shadcn/ui Extended)

### Button Component
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// Usage
<Button variant="primary" size="lg" loading={isSubmitting}>
  {t('search.button')}
</Button>
```

### Input Component
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant: 'default' | 'filled' | 'flushed';
}

// Usage
<Input
  label={t('form.email')}
  type="email"
  error={errors.email?.message}
  leftIcon={<Mail size={20} />}
/>
```

### Card Component
```typescript
interface CardProps {
  children: React.ReactNode;
  variant: 'default' | 'elevated' | 'outlined';
  padding: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
}
```

## Layout Components

### Header Component
```typescript
interface HeaderProps {
  variant: 'default' | 'transparent' | 'sticky';
  showSearchBar?: boolean;
  showLanguageSwitch?: boolean;
  showUserMenu?: boolean;
}

// Features:
// - Sticky behavior with background blur
// - Search bar that transforms on scroll
// - Language switcher with smooth transition
// - User menu with authentication state
// - Mobile-responsive hamburger menu
```

### SearchBar Component
```typescript
interface SearchBarProps {
  variant: 'homepage' | 'sticky' | 'modal';
  defaultValues?: {
    location?: string;
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
    type?: PlaceType;
  };
  onSearch: (values: SearchValues) => void;
}

// Features:
// - Location autocomplete with coordinates
// - Date picker with availability
// - Guest counter with room selection
// - Category filter pills
// - Recent searches
// - Responsive design (modal on mobile)
```

### Footer Component
```typescript
interface FooterProps {
  variant: 'default' | 'minimal';
  showNewsletter?: boolean;
  showSocialLinks?: boolean;
}

// Features:
// - Site map with organized links
// - Newsletter signup
// - Social media links
// - Language selector
// - Legal links (Privacy, Terms)
// - Copyright with current year
```

## Feature-Specific Components

### Place Components

#### PlaceCard
```typescript
interface PlaceCardProps {
  place: Place;
  variant: 'grid' | 'list' | 'featured';
  showFavorite?: boolean;
  showQuickView?: boolean;
  locale: 'tr' | 'en';
}

// Features:
// - Image carousel with dots indicator
// - Heart icon for favorites (top-right)
// - Title, location, price/info
// - Rating and review count
// - Hover effects and animations
// - Quick view modal trigger
// - Responsive image loading
```

#### PlaceGrid
```typescript
interface PlaceGridProps {
  places: Place[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  itemsPerPage?: number;
  locale: 'tr' | 'en';
}

// Features:
// - Responsive grid (1-4 columns)
// - Skeleton loading states
// - Infinite scroll or pagination
// - Empty state with illustration
// - Error boundary with retry
// - Intersection observer for analytics
```

#### PlaceDetail
```typescript
interface PlaceDetailProps {
  place: Place;
  locale: 'tr' | 'en';
}

// Features:
// - Hero image gallery with modal
// - Breadcrumb navigation
// - Share and favorite buttons
// - Owner/host information
// - Amenities grid with icons
// - Location map integration
// - Similar places carousel
// - SEO meta tags
```

#### PlaceFilters
```typescript
interface PlaceFiltersProps {
  filters: PlaceFilters;
  onFiltersChange: (filters: PlaceFilters) => void;
  availableFilters: FilterOptions;
  variant: 'modal' | 'sidebar' | 'horizontal';
}

// Features:
// - Price range slider
// - Category selection (hotels, restaurants, etc.)
// - Amenities checklist
// - Rating filter
// - Distance from location
// - "Show X places" sticky button
// - Reset filters option
```

### Blog Components

#### BlogCard
```typescript
interface BlogCardProps {
  blog: Blog;
  variant: 'featured' | 'standard' | 'minimal';
  showAuthor?: boolean;
  showDate?: boolean;
  showExcerpt?: boolean;
  locale: 'tr' | 'en';
}

// Features:
// - Featured image with overlay
// - Category tags
// - Author avatar and name
// - Read time estimation
// - Hover effects
// - Social sharing preview
```

#### BlogPost
```typescript
interface BlogPostProps {
  blog: Blog;
  relatedPosts?: Blog[];
  locale: 'tr' | 'en';
}

// Features:
// - Hero image with gradient overlay
// - Article metadata (author, date, read time)
// - Rich text content rendering
// - Table of contents (for long articles)
// - Social sharing buttons
// - Related posts section
// - Comments section (future)
```

### Collection Components

#### CollectionCard
```typescript
interface CollectionCardProps {
  collection: Collection;
  variant: 'featured' | 'standard';
  showItemCount?: boolean;
  locale: 'tr' | 'en';
}

// Features:
// - Preview grid of collection items
// - Collection title and description
// - Item count display
// - Curator information
// - Hover effects with preview
```

#### CollectionGrid
```typescript
interface CollectionGridProps {
  collections: Collection[];
  loading?: boolean;
  variant: 'grid' | 'carousel';
}

// Features:
// - Responsive grid layout
// - Featured collections highlighting
// - Category filtering
// - Load more functionality
```

## Interactive Components

### Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  title?: string;
  children: React.ReactNode;
}

// Features:
// - Focus trap and keyboard navigation
// - Backdrop click to close
// - ESC key to close
// - Scroll lock on body
// - Animation with framer-motion
```

### ImageGallery Component
```typescript
interface ImageGalleryProps {
  images: Image[];
  variant: 'grid' | 'carousel' | 'masonry';
  showThumbnails?: boolean;
  allowFullscreen?: boolean;
}

// Features:
// - Lightbox with navigation
// - Thumbnail navigation
// - Zoom functionality
// - Keyboard controls
// - Touch/swipe gestures
// - Image lazy loading
```

### Map Component
```typescript
interface MapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  places?: Place[];
  interactive?: boolean;
  showControls?: boolean;
  clustered?: boolean;
}

// Features:
// - Google Maps/Mapbox integration
// - Custom markers for places
// - Clustering for performance
// - Info windows on marker click
// - Drawing tools (future)
// - Responsive design
```

## Form Components

### SearchForm
```typescript
interface SearchFormProps {
  onSubmit: (values: SearchValues) => void;
  defaultValues?: SearchValues;
  variant: 'horizontal' | 'vertical' | 'modal';
}

// Features:
// - Location autocomplete
// - Date range picker
// - Guest selector
// - Category pills
// - Validation with Zod
// - Responsive design
```

### ContactForm
```typescript
interface ContactFormProps {
  placeId?: string;
  onSuccess?: () => void;
  variant: 'modal' | 'inline';
}

// Features:
// - Multi-step form
// - Field validation
// - File upload support
// - Spam protection
// - Success/error states
```

## Utility Components

### LanguageSwitcher
```typescript
interface LanguageSwitcherProps {
  variant: 'dropdown' | 'toggle' | 'tabs';
  showFlags?: boolean;
  position: 'header' | 'footer' | 'sidebar';
}

// Features:
// - Smooth language transitions
// - URL preservation
// - Cookie persistence
// - Accessible dropdown
```

### LoadingState
```typescript
interface LoadingStateProps {
  variant: 'skeleton' | 'spinner' | 'pulse' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  count?: number; // For skeleton items
}

// Features:
// - Multiple loading patterns
// - Shimmer effects
// - Accessible loading states
// - Consistent timing
```

### ErrorBoundary
```typescript
interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: React.ReactNode;
}

// Features:
// - Graceful error handling
// - Custom error UI
// - Error reporting integration
// - Recovery mechanisms
```

## Responsive Design Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Large desktop
};

// Component behavior:
// - Mobile-first design approach
// - Touch-friendly interactions
// - Collapsible navigation
// - Stacked layouts on small screens
// - Grid adjustments per breakpoint
```

## Animation & Micro-interactions

### Animation Tokens
```typescript
const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};
```

### Common Animations
- **Page transitions**: Slide in/out effects
- **Modal animations**: Scale and fade
- **Card hover**: Lift and shadow increase
- **Button interactions**: Scale and color transitions
- **Loading states**: Skeleton shimmer, spinner rotation
- **Form validation**: Error shake, success checkmark

## Accessibility Implementation

### ARIA Patterns
- Proper semantic HTML structure
- ARIA labels for interactive elements
- Focus management for modals and navigation
- Screen reader announcements for dynamic content
- Keyboard navigation support

### Testing Requirements
- Automated testing with @axe-core/react
- Manual testing with screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation testing
- Color contrast validation (4.5:1 minimum)
- Touch target size (44px minimum)

## Performance Optimization

### Code Splitting
- Route-based splitting (automatic with Next.js)
- Component-level dynamic imports
- Lazy loading for heavy components

### Image Optimization
- Next.js Image component with optimization
- WebP format with fallbacks
- Responsive images with srcSet
- Lazy loading with intersection observer

### Bundle Optimization
- Tree shaking for unused code
- Dynamic imports for large dependencies
- Font optimization and preloading

This component library specification provides a comprehensive foundation for building a consistent, accessible, and performant user interface that aligns with AirBNB's design principles while supporting the unique requirements of the MyTrip platform.