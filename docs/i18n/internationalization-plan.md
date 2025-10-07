# Internationalization Implementation Plan - MyTrip Web Application

## Overview

This document outlines the comprehensive internationalization (i18n) strategy for the MyTrip web application, supporting Turkish (primary) and English (secondary) languages with future expansion capabilities.

## Language Support Strategy

### Primary Languages
- **Turkish (tr-TR)**: Primary language, default for Turkey-based users
- **English (en-US)**: Secondary language for international travelers

### Language Priority
1. **Turkish**: Default language, comprehensive content coverage
2. **English**: Full translation coverage with cultural adaptation
3. **Future Languages**: Arabic (ar), German (de), Russian (ru) - planned for Phase 2

## Technical Implementation

### Framework: next-intl

#### Core Configuration
```typescript
// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js config
};

export default withNextIntl(nextConfig);
```

#### Middleware Setup
```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['tr', 'en'],
  defaultLocale: 'tr',
  localePrefix: 'always',
  localeDetection: true,
  alternateLinks: true
});

export const config = {
  matcher: ['/', '/(tr|en)/:path*']
};
```

#### i18n Configuration
```typescript
// src/i18n.ts
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Europe/Istanbul',
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }
      },
      number: {
        currency: {
          style: 'currency',
          currency: 'TRY',
          currencyDisplay: 'symbol'
        }
      }
    }
  };
});
```

## URL Structure & Routing

### URL Patterns
```
Base Domain: mytrip.com

Turkish (Default):
/tr                           -> Homepage
/tr/yerler                   -> Places listing
/tr/yerler/[slug]            -> Place detail
/tr/blog                     -> Blog listing
/tr/blog/[slug]              -> Blog post
/tr/koleksiyonlar            -> Collections
/tr/koleksiyonlar/[slug]     -> Collection detail

English:
/en                          -> Homepage
/en/places                   -> Places listing
/en/places/[slug]            -> Place detail (uses slug_en)
/en/blog                     -> Blog listing
/en/blog/[slug]              -> Blog post (uses slug_en)
/en/collections              -> Collections
/en/collections/[slug]       -> Collection detail
```

### Route Configuration
```typescript
// src/app/[locale]/layout.tsx
export function generateStaticParams() {
  return [
    { locale: 'tr' },
    { locale: 'en' }
  ];
}

// Dynamic routing with locale
export default function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## Content Translation Strategy

### Static Content (UI Text)
Translation files organized by feature and page:

```
messages/
├── tr/
│   ├── common.json          # Common UI elements
│   ├── navigation.json      # Navigation items
│   ├── homepage.json        # Homepage content
│   ├── places.json          # Places related text
│   ├── blog.json           # Blog related text
│   ├── forms.json          # Form labels and validation
│   └── errors.json         # Error messages
└── en/
    ├── common.json
    ├── navigation.json
    ├── homepage.json
    ├── places.json
    ├── blog.json
    ├── forms.json
    └── errors.json
```

#### Example Translation Files
```json
// messages/tr/common.json
{
  "buttons": {
    "search": "Ara",
    "save": "Kaydet",
    "cancel": "İptal",
    "loadMore": "Daha Fazla Yükle"
  },
  "labels": {
    "location": "Konum",
    "checkIn": "Giriş Tarihi",
    "checkOut": "Çıkış Tarihi",
    "guests": "Misafir Sayısı"
  },
  "meta": {
    "loading": "Yükleniyor...",
    "error": "Bir hata oluştu",
    "noResults": "Sonuç bulunamadı"
  }
}

// messages/en/common.json
{
  "buttons": {
    "search": "Search",
    "save": "Save",
    "cancel": "Cancel",
    "loadMore": "Load More"
  },
  "labels": {
    "location": "Location",
    "checkIn": "Check In",
    "checkOut": "Check Out",
    "guests": "Guests"
  },
  "meta": {
    "loading": "Loading...",
    "error": "An error occurred",
    "noResults": "No results found"
  }
}
```

### Dynamic Content (Database)
Database fields support both languages with fallback strategy:

```typescript
// Database content structure
interface Place {
  // Turkish (primary)
  name: string;
  description: string;
  slug: string;

  // English (secondary)
  nameEn?: string;
  descriptionEn?: string;
  slugEn?: string;

  // Meta tags
  metaTitle?: string;
  metaTitleEn?: string;
  metaDescription?: string;
  metaDescriptionEn?: string;
}

// Content retrieval with fallback
function getLocalizedContent(content: Place, locale: 'tr' | 'en') {
  return {
    name: locale === 'en' && content.nameEn
      ? content.nameEn
      : content.name,
    description: locale === 'en' && content.descriptionEn
      ? content.descriptionEn
      : content.description,
    slug: locale === 'en' && content.slugEn
      ? content.slugEn
      : content.slug
  };
}
```

## Component Implementation

### Translation Hooks
```typescript
// components/shared/LocalizedContent.tsx
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

export function LocalizedContent({ content }: { content: Place }) {
  const locale = useLocale();
  const t = useTranslations('places');

  return (
    <div>
      <h1>{getLocalizedField(content, 'name', locale)}</h1>
      <p>{getLocalizedField(content, 'description', locale)}</p>
      {!getLocalizedField(content, 'description', locale, false) && (
        <p className="text-gray-500 text-sm">
          {t('translationMissing')}
        </p>
      )}
    </div>
  );
}

// Utility function for localized fields
function getLocalizedField(
  content: any,
  field: string,
  locale: string,
  fallback: boolean = true
): string {
  const localizedField = locale === 'en' ? `${field}En` : field;
  const value = content[localizedField];

  if (value) return value;
  if (fallback && locale === 'en') return content[field];
  return '';
}
```

### Language Switcher Component
```typescript
// components/shared/LanguageSwitcher.tsx
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'toggle';
  showFlags?: boolean;
}

export function LanguageSwitcher({
  variant = 'dropdown',
  showFlags = true
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLanguage = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  if (variant === 'toggle') {
    return (
      <button
        onClick={() => switchLanguage(locale === 'tr' ? 'en' : 'tr')}
        className=\"flex items-center space-x-2 px-3 py-2 rounded-md\"
      >
        {showFlags && <span>{locale === 'tr' ? '🇺🇸' : '🇹🇷'}</span>}
        <span>{locale === 'tr' ? 'EN' : 'TR'}</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className=\"flex items-center space-x-2\">
        {showFlags && <span>{languages.find(l => l.code === locale)?.flag}</span>}
        <span>{locale.toUpperCase()}</span>
        <ChevronDown size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={locale === lang.code ? 'bg-gray-100' : ''}
          >
            {showFlags && <span className=\"mr-2\">{lang.flag}</span>}
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## SEO & Meta Tag Implementation

### Localized Meta Tags
```typescript
// app/[locale]/places/[slug]/page.tsx
export async function generateMetadata({
  params: { locale, slug }
}: {
  params: { locale: string; slug: string }
}): Promise<Metadata> {
  const place = await getPlaceBySlug(slug, locale);
  const t = await getTranslations({ locale, namespace: 'places' });

  return {
    title: getLocalizedField(place, 'metaTitle', locale) ||
           `${getLocalizedField(place, 'name', locale)} - ${t('siteName')}`,
    description: getLocalizedField(place, 'metaDescription', locale) ||
                getLocalizedField(place, 'shortDescription', locale),
    openGraph: {
      title: getLocalizedField(place, 'name', locale),
      description: getLocalizedField(place, 'shortDescription', locale),
      images: [place.featuredImage],
      locale: locale,
      alternateLocale: locale === 'tr' ? 'en' : 'tr',
      type: 'website'
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/places/${place.slug}`,
      languages: {
        'tr': `${process.env.NEXT_PUBLIC_SITE_URL}/tr/places/${place.slug}`,
        'en': place.slugEn
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/en/places/${place.slugEn}`
          : undefined
      }
    }
  };
}
```

### Structured Data (JSON-LD)
```typescript
// components/seo/StructuredData.tsx
import { useLocale } from 'next-intl';

interface StructuredDataProps {
  place: Place;
}

export function PlaceStructuredData({ place }: StructuredDataProps) {
  const locale = useLocale();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': place.type === 'restaurant' ? 'Restaurant' : 'LodgingBusiness',
    name: getLocalizedField(place, 'name', locale),
    description: getLocalizedField(place, 'description', locale),
    address: {
      '@type': 'PostalAddress',
      streetAddress: getLocalizedField(place, 'address', locale),
      addressLocality: place.city,
      addressCountry: 'TR'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.latitude,
      longitude: place.longitude
    },
    image: place.featuredImage,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/places/${place.slug}`,
    inLanguage: [locale],
    alternateName: locale === 'tr' && place.nameEn ? place.nameEn : undefined
  };

  return (
    <script
      type=\"application/ld+json\"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
}
```

## Content Management Workflow

### Translation Process
1. **Content Creation**: Content created in Turkish (primary)
2. **Translation Request**: English translation requested via admin panel
3. **Professional Translation**: Content sent to professional translators
4. **Review Process**: Translated content reviewed by native speakers
5. **Content Publishing**: Both versions published simultaneously

### Translation Quality Assurance
- **Native Speaker Review**: All translations reviewed by native speakers
- **Cultural Adaptation**: Content adapted for cultural differences
- **SEO Optimization**: Translated content optimized for English keywords
- **Consistency Checks**: Terminology consistency across all content

## Date, Time, and Number Formatting

### Localized Formats
```typescript
// lib/formatting.ts
import { useLocale, useFormatter } from 'next-intl';

export function useLocalizedFormatting() {
  const locale = useLocale();
  const format = useFormatter();

  return {
    formatDate: (date: Date) => format.dateTime(date, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),

    formatPrice: (amount: number, currency = 'TRY') => format.number(amount, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }),

    formatDistance: (meters: number) => {
      if (locale === 'en') {
        const miles = meters * 0.000621371;
        return miles < 1
          ? `${Math.round(meters * 3.28084)} ft`
          : `${miles.toFixed(1)} mi`;
      } else {
        return meters < 1000
          ? `${Math.round(meters)} m`
          : `${(meters / 1000).toFixed(1)} km`;
      }
    }
  };
}
```

### Cultural Considerations
- **Turkish Culture**:
  - Family-oriented travel content
  - Emphasis on hospitality and local experiences
  - Traditional Turkish breakfast and cuisine highlights
  - Religious and cultural site respect

- **English (International)**:
  - Adventure and discovery focus
  - Practical travel information
  - International cuisine options
  - Cultural sensitivity for diverse audience

## Performance Optimization for i18n

### Bundle Optimization
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizeCss: true
  },
  i18n: {
    locales: ['tr', 'en'],
    defaultLocale: 'tr',
    domains: [
      {
        domain: 'mytrip.com.tr',
        defaultLocale: 'tr'
      },
      {
        domain: 'mytrip.com',
        defaultLocale: 'en'
      }
    ]
  }
};
```

### Translation Loading Strategy
- **Static Messages**: Bundled with application for immediate availability
- **Dynamic Messages**: Loaded on demand for admin features
- **Caching Strategy**: Translation files cached with appropriate TTL
- **Fallback Handling**: Graceful degradation for missing translations

## Testing Strategy

### Translation Testing
- **Unit Tests**: Test translation key existence and formatting
- **Integration Tests**: Test language switching functionality
- **E2E Tests**: Test complete user journeys in both languages
- **Visual Regression**: Test UI layout with different text lengths

### Accessibility Testing
- **Screen Reader Compatibility**: Test with Turkish and English screen readers
- **Keyboard Navigation**: Ensure consistent navigation across languages
- **Text Scaling**: Test readability with increased text size
- **RTL Preparation**: Architecture ready for future RTL language support

## Future Expansion Plan

### Phase 2 Languages (Planned)
- **Arabic (ar)**: RTL support implementation
- **German (de)**: European market expansion
- **Russian (ru)**: Russian-speaking tourist market

### Technical Preparations
- **RTL Support**: CSS logical properties and direction handling
- **Font Support**: Multi-language font loading strategy
- **Cultural Adaptation**: Region-specific content and features
- **Legal Compliance**: GDPR and regional privacy requirements

This internationalization plan provides a comprehensive foundation for building a truly bilingual platform that serves both Turkish and international users while maintaining excellent user experience and technical performance.