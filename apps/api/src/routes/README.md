# TatilDesen API Routes

This directory contains all public-facing API routes for the TatilDesen travel booking platform. These routes provide access to the platform's content and functionality for end users.

## Route Overview

### `/api/places` - Places & Accommodations
Complete place discovery and information system for Muğla, Türkiye.

**Key Endpoints:**
- `GET /` - List all places with filtering and pagination
- `GET /featured` - Get featured places
- `GET /popular` - Get popular places (by ratings and reviews)
- `GET /:slug` - Get detailed place information
- `GET /categories` - Get place categories
- `GET /cities` - Get available cities
- `GET /types` - Get place types (hotels, restaurants, etc.)

**Features:**
- Advanced filtering by type, category, city, price level
- Sorting by various criteria (rating, price, popularity)
- Image galleries and detailed descriptions
- Location data for maps integration
- Owner verification and featured status
- View count tracking
- Related places suggestions

### `/api/collections` - Curated Travel Collections
Curated travel itineraries and destination guides.

**Key Endpoints:**
- `GET /` - List all published collections
- `GET /featured` - Get featured collections
- `GET /:slug` - Get detailed collection with itinerary
- `GET /seasons` - Get collections by season
- `GET /audiences` - Get collections by target audience

**Features:**
- Day-by-day itineraries
- Travel tips and highlights
- Featured places integration
- Seasonal recommendations
- Target audience filtering
- Duration information

### `/api/blog` - Travel Blog & Stories
Content management for travel articles and destination guides.

**Key Endpoints:**
- `GET /` - List published blog posts
- `GET /featured` - Get featured articles
- `GET /popular` - Get most popular articles
- `GET /:slug` - Get full article content
- `GET /categories` - Get blog categories
- `GET /tags` - Get popular tags
- `GET /latest` - Get latest articles

**Features:**
- Multi-language support (TR/EN)
- Reading time estimates
- SEO optimization
- Author information
- Related articles
- Tag-based categorization
- View tracking

### `/api/reviews` - User Reviews & Ratings
Review system for places and accommodations.

**Key Endpoints:**
- `GET /` - List all published reviews
- `GET /place/:placeId` - Get reviews for specific place
- `GET /:reviewId` - Get individual review
- `POST /:reviewId/helpful` - Mark review as helpful
- `GET /recent` - Get recent reviews
- `GET /top-rated` - Get highest-rated reviews

**Features:**
- Star rating system
- Verified stay badges
- Helpfulness voting
- Image uploads
- Owner responses
- Review statistics
- Place-specific filtering

### `/api/search` - Global Search
Unified search across all platform content.

**Key Endpoints:**
- `GET /` - Global search across places, collections, and blog
- `GET /suggestions` - Search autocomplete suggestions
- `GET /advanced` - Advanced search with filters
- `GET /popular` - Popular search terms

**Features:**
- Multi-model search
- Search autocomplete
- Advanced filtering
- Relevance ranking
- Search suggestions
- Popular queries tracking

## Common Features

### Pagination
All list endpoints support pagination:
```json
{
  "page": 1,
  "limit": 20,
  "total": 100,
  "totalPages": 5
}
```

### Filtering
Common query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Text search across relevant fields
- `sortBy` - Sort field
- `sortOrder` - Sort order: asc/desc (default: desc)

### Language Support
Blog endpoints support multiple languages:
- `language` - Language code (tr, en)

### Response Format

**Success Response:**
```json
{
  "data": [ ... ],
  "pagination": { ... },
  "filters": { ... }
}
```

**Error Response:**
```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

## API Access Patterns

### Discovery Flow
1. **Browse Places**: `/api/places` with filters
2. **Featured Content**: `/api/places/featured` and `/api/collections/featured`
3. **Search**: `/api/search?q=keyword` for specific queries
4. **Place Details**: `/api/places/{slug}` for full information

### Content Flow
1. **Blog Discovery**: `/api/blog` for travel stories
2. **Collections**: `/api/collections` for curated itineraries
3. **Reviews**: `/api/reviews` for user experiences

### Search Integration
- Use `/api/search/suggestions` for autocomplete
- Use `/api/search/advanced` for complex queries
- Global search covers all content types

## Performance Optimizations

### Database Queries
- Efficient filtering with indexed fields
- Join queries for related data
- Proper ordering for relevance

### Response Optimization
- Pagination to limit data transfer
- Selective field returns
- Image URL optimization
- Caching-friendly structure

### Search Performance
- Text search optimization
- Relevance ranking algorithms
- Suggestion caching

## Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Structure
All errors include:
- Error type identifier
- Human-readable message
- Validation details when applicable

## Security Considerations

### Input Validation
- Query parameter validation
- SQL injection prevention
- XSS protection

### Rate Limiting
- Consider rate limiting for search endpoints
- Implement caching for expensive queries
- Monitor API usage patterns

### Data Privacy
- No personal data in public endpoints
- User anonymization where needed
- GDPR compliance considerations

## Integration Notes

### Frontend Integration
- All endpoints return JSON
- Consistent error handling
- Predictable response structures
- CORS configured for web apps

### Mobile App Support
- RESTful API design
- Efficient pagination
- Mobile-optimized responses
- Image CDN integration

### Third-Party Integration
- Well-documented API surface
- Consistent naming conventions
- Version-friendly structure
- Webhook support for future features

## Development Guidelines

### Adding New Endpoints
1. Follow existing naming patterns
2. Include comprehensive filtering
3. Add proper error handling
4. Document query parameters
5. Include pagination where applicable

### Database Queries
- Use parameterized queries
- Optimize for performance
- Include proper joins
- Handle null values gracefully

### Response Design
- Keep responses minimal but complete
- Use consistent field names
- Include metadata where helpful
- Format dates in ISO 8601

## Future Enhancements

### Planned Features
- Real-time updates with WebSockets
- Advanced search with AI
- Personalization algorithms
- Recommendation engine
- Multi-language content expansion

### Scaling Considerations
- Database read replicas
- Redis caching layer
- CDN for static assets
- Load balancing strategies
- Geographic distribution