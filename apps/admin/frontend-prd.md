# Product Requirements Document (PRD)

## 1. Overview

### Product Vision
A web-first platform that helps travelers discover and plan their trips by providing a one-stop hub for accommodations, restaurants, villas, activity places (e.g., scuba diving, paragliding, golf), and curated experiences. The product combines listings, activities, and blog-style editorial content in a clean, modern, Airbnb-style interface.

### Target Audience
* **Travelers**: Domestic and international visitors to Türkiye (starting in Muğla).
* **Place Owners**: Hotels, restaurants, villas, flats, and activity operators looking to increase visibility.
* **Admin Team**: Internal staff who manage listings, subscriptions, payments, and content.

### Business Model
* **B2B Subscription Model**: Places pay a recurring subscription fee to list their business and optionally contribute blog content.
* No booking or payment from travelers in MVP.

### Initial Launch Region
* **Muğla, Türkiye** with Turkish as the primary language and English support for international travelers.

---

## 2. Goals & Objectives

* **Travelers**: Easily discover accommodations, restaurants, and activities in one place, supported by filters, maps, and curated blogs.
* **Place Owners**: Manage listings and publish promotional blogs while subscribing to gain visibility.
* **Admin Team**: Efficiently manage listings, blogs, subscriptions, and provide platform oversight with analytics.

---

## 3. Technical Architecture

### Turborepo Structure
```
tatildesen/
├── apps/
│   ├── web/                 # NextJS - Traveler frontend
│   ├── dashboard/           # NextJS - Place owner dashboard  
│   ├── admin/               # NextJS - Admin panel
│   └── api/                 # HonoJS - Backend API
├── packages/
│   ├── database/            # Drizzle + PostgreSQL
│   ├── config/             # Shared configs (Tailwind, ESLint, TS)
│   ├── types/              # Shared TypeScript types
│   ├── eslint-config/      # Shared ESLint configs
│   └── typescript-config/  # Shared TypeScript config
├── package.json
├── turbo.json
```

### Tech Stack
* **Frontend**: Next.js 14+ (App Router)
* **Backend**: Hono.js
* **Database**: PostgreSQL with Drizzle ORM
* **Styling**: Tailwind CSS
* **Monorepo**: Turborepo
* **Language**: TypeScript
* **Authentication**: NextAuth.js
* **i18n**: next-intl (for Next.js apps)
* **Design System**: AirBNB-inspired components

### Design Philosophy
* **Visual Design**: Exact replication of AirBNB's clean, modern aesthetic
* **Component Library**: Custom components matching AirBNB patterns
* **Typography**: Similar font hierarchy (Circular or similar geometric sans-serif)
* **Color Palette**: Clean whites, subtle grays, and accent colors similar to AirBNB
* **Spacing**: Generous whitespace and breathing room between elements

---

## 4. Scope (MVP)

### Traveler Features
* Search and filter listings.
* Map-based browsing (with geolocation support).
* Curated collections and blog content.
* Responsive web app with multilingual support (Turkish & English).
* Dynamic language switching without page reload.

### Place Owner Features
* Manage core and type-specific listing details.
* Manage subscription plan and renewals.
* Add blog posts (subject to admin approval).
* Multi-language content management.

### Admin Features
* Manage users, places, and listings (approve, reject, suspend).
* Manage blogs (approve/reject owner posts, publish editorial content).
* Manage subscriptions and payments.
* Support tools for handling owner inquiries.
* Analytics dashboard for platform KPIs.
* Translation management interface.

### Out of Scope (Future Phases)
* Traveler bookings and payments.
* Reviews and ratings.
* Mobile apps (iOS/Android).
* Owner analytics and insights.
* AI-driven recommendations.
* Additional languages beyond Turkish and English.

---

## 5. Internationalization (i18n) Requirements

### Supported Languages
* **Primary**: Turkish (tr-TR)
* **Secondary**: English (en-US)

### i18n Implementation Strategy
* **URL Structure**: Path-based routing (`/tr/`, `/en/`). If non provided, default to Turkish
* **Default Language**: Turkish (with automatic detection based on browser settings)
* **Content Translation**:
  * Static UI text: Stored in JSON translation files
  * Dynamic content (listings, blogs): Database fields for each language
  * Admin-managed translations for system messages

### i18n Features
* **Language Switcher**: Persistent across sessions (stored in cookies)
* **SEO Optimization**: hreflang tags for each language version
* **RTL Support**: Future-ready architecture (for Arabic, Hebrew)
* **Date/Time Formatting**: Locale-specific formats
* **Currency Display**: TRY with locale-appropriate formatting
* **Fallback Strategy**: English as fallback when Turkish translation unavailable

### Content Management
* **Place Listings**: Separate fields for Turkish and English content
* **Blog Posts**: Language-specific versions with cross-linking
* **Email Templates**: Localized based on user preference
* **Error Messages**: Fully translated error and validation messages

---

## 6. User Personas

### Traveler Persona
* Age: 25–45
* Motivations: Discover authentic experiences, easy trip planning.
* Pain points: Too many scattered sources, lack of trust in unknown platforms.
* Language preference: International travelers (English), Domestic (Turkish)

### Place Owner Persona
* Small hotel/villa owner, restaurant manager, or activity operator.
* Motivations: Increase visibility, attract domestic and international travelers.
* Pain points: Limited marketing budget, lack of digital tools.
* Language needs: Primarily Turkish interface with ability to add English content

### Admin Persona
* Platform operations manager.
* Motivations: Maintain content quality, ensure compliance, maximize subscriptions.
* Pain points: Manual overhead if tools are inefficient.
* Language needs: Bilingual (manage both Turkish and English content)

---

## 7. User Flows (Expanded with Visual Detail)

### Traveler Flow
1. **Landing Page/Homepage**
   * Language detection and selection prompt (first visit)
   * Hero section with search bar (localized placeholder text)
   * Featured collections and blog highlights
   * Map button for location-based browsing

2. **Search & Filter**
   * Enter location → Apply filters (type, amenities, tags, etc.)
   * Results shown as list + map toggle
   * Infinite scroll or pagination
   * All UI elements in selected language

3. **Listing Detail Page**
   * Photo gallery, description (in selected language)
   * Type-specific fields (e.g., cuisine for restaurants)
   * Location map embed
   * Contact information
   * Related listings section (localized)

4. **Blogs & Collections**
   * Language-specific blog content
   * Cross-language links when available
   * Share functionality with localized meta tags

**Wireframe-Level Detail:**
* Top navigation: Logo + Search + Language toggle (TR/EN) + Explore (Map/Collections/Blog)
* Footer: About, Terms, Contact, Subscription info (all localized)

### Place Owner Flow
1. **Onboarding**
   * Language preference selection
   * Sign up with email/password or social login
   * Select place type
   * Subscribe to a plan

2. **Dashboard**
   * Interface in owner's preferred language
   * Bilingual content management tools
   * Quick links: Manage Listings, Add Blog Post, Account Settings

3. **Listing Management**
   * Separate input fields for Turkish and English content
   * Translation helper tools/suggestions
   * Preview in both languages

4. **Blog Post Submission**
   * Create language-specific versions
   * Link related translations

### Admin Flow
1. **Admin Dashboard**
   * Bilingual interface
   * Translation management tools
   * Pending translations queue

2. **Content Management**
   * Side-by-side language editing
   * Translation status indicators
   * Batch translation tools

---

## 8. Feature Requirements

### 8.1 Traveler-Side (Web App)
* **Search & Filter**: Multi-language search with transliterated keyword support
* **Interactive Map**: Localized place names and tooltips
* **Curated Collections & Blogs**: Language-specific content
* **Multi-language**: Seamless switching with URL preservation
* **Responsive Design**: RTL-ready layouts

### 8.2 Owner Panel
* **Listing Management**: Bilingual content fields
* **Translation Tools**: Character counters, translation tips
* **Blog Posts**: Multi-language post creation

### 8.3 Admin Panel
* **Translation Management**: Review and approve translations
* **Content Moderation**: Language-specific moderation queues
* **Analytics**: Language-based usage statistics

---

## 9. Step-by-Step Implementation Tasks

### Phase 1: Foundation (Week 1-2)

#### 1.1 Database Setup (Priority 1)
- [ ] Set up PostgreSQL instance
- [ ] Configure Drizzle ORM in packages/database
- [ ] Design database schema with i18n support
  - [ ] Users table (travelers, owners, admins)
  - [ ] Places table with translation fields
    - [ ] slug field (unique, URL-friendly identifier)
    - [ ] slug_en field for English version
  - [ ] Listings table with type-specific JSONB fields
  - [ ] Blogs table with language versions
    - [ ] slug field (unique, URL-friendly identifier)
    - [ ] slug_en field for English version
  - [ ] Subscriptions table
  - [ ] Payment records table
- [ ] Create slug generation utilities
- [ ] Create migration scripts
- [ ] Seed database with test data
- [ ] Set up database backup strategy

#### 1.2 Shared Packages Setup (Priority 1)
- [ ] Configure TypeScript shared config
- [ ] Set up ESLint shared rules
- [ ] Create shared types package
- [ ] Configure Tailwind shared config
- [ ] Set up i18n translation structure

### Phase 2: API Development (Week 3-5)

#### 2.1 Core API Setup (Priority 1)
- [ ] Initialize Hono.js application
- [ ] Set up middleware (CORS, rate limiting, logging)
- [ ] Implement authentication (JWT)
- [ ] Create API documentation (OpenAPI/Swagger)

#### 2.2 API Endpoints (Priority 1)
- [ ] **Auth endpoints**
  - [ ] POST /api/auth/register
  - [ ] POST /api/auth/login
  - [ ] POST /api/auth/refresh
  - [ ] POST /api/auth/logout
  
- [ ] **Places endpoints**
  - [ ] GET /api/places (with filters, pagination)
  - [ ] GET /api/places/:id
  - [ ] GET /api/places/slug/:slug (SEO-friendly access)
  - [ ] POST /api/places (owner only)
  - [ ] PUT /api/places/:id (owner only)
  - [ ] DELETE /api/places/:id (owner only)
  
- [ ] **Blogs endpoints**
  - [ ] GET /api/blogs
  - [ ] GET /api/blogs/:id
  - [ ] GET /api/blogs/slug/:slug (SEO-friendly access)
  - [ ] POST /api/blogs (owner only)
  - [ ] PUT /api/blogs/:id (owner only)
  
- [ ] **Subscription endpoints**
  - [ ] GET /api/subscriptions/plans
  - [ ] POST /api/subscriptions/subscribe
  - [ ] GET /api/subscriptions/status
  
- [ ] **Admin endpoints**
  - [ ] PUT /api/admin/places/:id/approve
  - [ ] PUT /api/admin/places/:id/reject
  - [ ] PUT /api/admin/blogs/:id/approve
  - [ ] GET /api/admin/analytics

#### 2.3 Integration Setup (Priority 2)
- [ ] Payment gateway integration (Iyzico/Stripe)
- [ ] Email service integration (SendGrid/Resend)
- [ ] Image upload service (Cloudinary/S3)
- [ ] Map service integration (Google Maps/Mapbox)

### Phase 3: Web Application (Week 6-9)

#### 3.1 Web App Foundation (Priority 1)
- [ ] Initialize Next.js app with App Router
- [ ] Configure next-intl for i18n
- [ ] Set up Tailwind CSS
- [ ] Create layout components
- [ ] Implement language switcher

#### 3.2 Traveler Features (Priority 1)
- [ ] **Homepage (AirBNB-style)**
  - [ ] Sticky header with search bar that transforms on scroll
  - [ ] Category pills (Hotels, Villas, Restaurants, Activities)
  - [ ] Grid of cards with:
    - [ ] Image carousel with dots indicator
    - [ ] Heart icon for saving (top-right)
    - [ ] Title, subtitle, price/info
    - [ ] Hover effects on cards
  - [ ] Infinite scroll with skeleton loaders
  - [ ] Footer with sitemap links in columns
  
- [ ] **Search & Discovery (AirBNB-style)**
  - [ ] Sticky search bar with "Where", "Check in", "Check out", "Guests"
  - [ ] Filter modal with:
    - [ ] Price range slider
    - [ ] Type of place (entire place, private room)
    - [ ] Amenities grid with icons
    - [ ] "Show X places" sticky button
  - [ ] Split view: Map on right, listings on left (desktop)
  - [ ] Map pins with price bubbles
  - [ ] Quick view on map pin hover
  
- [ ] **Listing Details (AirBNB-style)**
  - [ ] Large title with share/save buttons
  - [ ] Photo grid: 1 large + 4 small with "Show all photos" button
  - [ ] Sticky booking widget on right (desktop)
  - [ ] Host/Owner info with avatar
  - [ ] Amenities in icon grid
  - [ ] Expandable description with "Show more"
  - [ ] Map with neighborhood highlights
  - [ ] SEO-friendly URLs: /places/[slug]
  
- [ ] **Blogs & Collections**
  - [ ] Magazine-style layout
  - [ ] Featured hero article
  - [ ] Grid of blog cards
  - [ ] SEO-friendly URLs: /blog/[slug]

#### 3.3 SEO & Performance (Priority 2)
- [ ] Meta tags management
- [ ] Sitemap generation
- [ ] Image optimization
- [ ] Lazy loading
- [ ] PWA configuration

### Phase 4: Dashboard Application (Week 10-12)

#### 4.1 Dashboard Foundation (Priority 1)
- [ ] Initialize Next.js dashboard app
- [ ] Implement authentication flow
- [ ] Create dashboard layout
- [ ] Set up protected routes

#### 4.2 Owner Features (Priority 1) - AirBNB Host Dashboard Style
- [ ] **Dashboard Overview**
  - [ ] Welcome message with avatar
  - [ ] Action cards grid (Update listing, Add photos, etc.)
  - [ ] Performance metrics cards:
    - [ ] Views this month (with trend)
    - [ ] Total earnings (with graph)
    - [ ] Response rate
    - [ ] Overall rating (future)
  - [ ] Recent activity timeline
  
- [ ] **Listing Management (AirBNB-style)**
  - [ ] Card-based listing overview
  - [ ] Multi-step creation flow:
    - [ ] Step 1: Place type selection with icons
    - [ ] Step 2: Location with map picker
    - [ ] Step 3: Floor plan (rooms, beds, bathrooms)
    - [ ] Step 4: Amenities checklist with icons
    - [ ] Step 5: Photos with drag-and-drop grid
    - [ ] Step 6: Title and description (with character counts)
    - [ ] Step 7: Pricing
    - [ ] Step 8: Review and publish
  - [ ] Progress bar at top
  - [ ] "Save & exit" option
  - [ ] Preview mode toggle
  - [ ] Slug auto-generation from title
  - [ ] Translation tabs for TR/EN content
  
- [ ] **Blog Management**
  - [ ] Medium-style editor
  - [ ] Cover image upload
  - [ ] SEO settings (slug, meta description)
  - [ ] Draft/Published status toggle
  - [ ] Translation management interface
  
- [ ] **Subscription Management**
  - [ ] Clean pricing cards
  - [ ] Current plan highlight
  - [ ] Upgrade/Downgrade flow
  - [ ] Payment method cards
  - [ ] Invoice list with download buttons

### Phase 5: Admin Panel (Week 13-15)

#### 5.1 Admin Foundation (Priority 1)
- [ ] Initialize Next.js admin app
- [ ] Implement admin authentication
- [ ] Create admin layout
- [ ] Role-based access control

#### 5.2 Admin Features (Priority 1)
- [ ] **Dashboard**
  - [ ] KPI widgets
  - [ ] Recent activity feed
  - [ ] Pending approvals count
  
- [ ] **Content Moderation**
  - [ ] Listing approval queue
  - [ ] Blog approval queue
  - [ ] Bulk actions
  - [ ] Rejection reason management
  
- [ ] **User Management**
  - [ ] User listing with filters
  - [ ] User detail view
  - [ ] Suspend/Activate users
  - [ ] Role management
  
- [ ] **Subscription Management**
  - [ ] Active subscriptions list
  - [ ] Payment tracking
  - [ ] Manual adjustments
  - [ ] Plan management
  
- [ ] **Analytics**
  - [ ] User growth charts
  - [ ] Revenue analytics
  - [ ] Content performance
  - [ ] Export functionality

#### 5.3 Support Tools (Priority 2)
- [ ] Support ticket system
- [ ] Internal notes
- [ ] Email templates
- [ ] Bulk email sender

### Phase 6: Testing & Deployment (Week 16-17)

#### 6.1 Testing (Priority 1)
- [ ] Unit tests for API endpoints
- [ ] Integration tests
- [ ] E2E tests for critical flows
- [ ] Performance testing
- [ ] Security audit

#### 6.2 Deployment (Priority 1)
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Database migration strategy
- [ ] Monitoring setup (Sentry, Datadog)
- [ ] Backup and recovery procedures

### Phase 7: Launch Preparation (Week 18)

- [ ] Content creation (initial blogs, collections)
- [ ] Owner onboarding materials
- [ ] Admin training
- [ ] Beta testing with selected users
- [ ] Performance optimization
- [ ] Final security review
- [ ] Launch marketing materials

---

## 10. Non-Functional Requirements

* **Performance**: 
  - Pages load within 2–3 seconds
  - API response time < 200ms for queries
  - Support for 10,000+ concurrent users
* **Security**: 
  - SSL/TLS encryption
  - Bcrypt password hashing
  - Rate limiting
  - XSS/CSRF protection
* **Data Privacy**: 
  - GDPR compliance
  - KVKK (Turkish data law) compliance
  - Cookie consent management
* **Scalability**: 
  - Horizontal scaling capability
  - CDN for static assets
  - Database read replicas
* **Reliability**: 
  - 99.5% uptime target
  - Automated backups
  - Disaster recovery plan
* **Accessibility**:
  - WCAG 2.1 AA compliance
  - Screen reader support
  - Keyboard navigation

---

## 11. Success Metrics

* **Listings**: 
  - Target: 500+ active listings in first 3 months
  - Quality score: 80%+ complete profiles
* **Subscriptions**: 
  - Target: 70% renewal rate
  - 100+ new subscriptions per month after launch
* **Engagement**: 
  - 10,000+ unique visitors per month
  - Average session duration: 5+ minutes
  - Blog engagement: 30%+ read rate
* **Admin Efficiency**: 
  - Average approval time: < 24 hours
  - Support ticket resolution: < 48 hours
* **Technical Performance**:
  - Page load speed: < 3 seconds
  - API uptime: 99.5%+
  - Error rate: < 1%

---

## 12. Future Enhancements (Post-MVP)

* **Mobile Apps**: Native iOS and Android apps
* **Traveler Bookings & Payments**: Integrated booking system
* **Reviews & Ratings**: User feedback and rating system
* **Advanced Analytics for Owners**: 
  - Traffic insights
  - Conversion tracking
  - Competitor analysis
* **AI Recommendations**: 
  - Personalized suggestions
  - Smart search
  - Content generation assistance
* **Additional Languages**: Arabic, German, Russian
* **Social Features**: 
  - User profiles
  - Trip planning tools
  - Social sharing
* **API for Partners**: Third-party integrations
* **Loyalty Program**: Rewards for frequent users