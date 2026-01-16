# Admin API Routes

This directory contains all admin-specific routes for the TatilDesen travel booking platform. All routes in this directory are protected by authentication middleware and require admin role access.

## Authentication

All admin routes are protected by the `adminAuth` middleware which:

1. Verifies the user is authenticated via Better Auth
2. Ensures the user has an `admin` role
3. Checks that the user account is `active`

If authentication fails, appropriate HTTP status codes are returned:
- `401` - Authentication required
- `403` - Insufficient permissions or account suspended

## Available Route Groups

### `/api/admin/auth`
Admin authentication and session management
- `GET /session` - Get current admin session
- `GET /admins` - List all admin users (super admin only)
- `POST /admins` - Create new admin user (super admin only)
- `GET /sessions` - List all active sessions
- `DELETE /sessions/:sessionId` - Revoke a specific session

### `/api/admin/users`
User management operations
- `GET /` - List all users with pagination and filtering
- `GET /:userId` - Get specific user details
- `PUT /:userId` - Update user information
- `PATCH /:userId/status` - Update user status (suspend/activate)
- `GET /stats` - Get user statistics

### `/api/admin/places`
Place management operations
- `GET /` - List all places with pagination and filtering
- `GET /:placeId` - Get specific place details
- `POST /` - Create new place
- `PUT /:placeId` - Update place information
- `PATCH /:placeId/status` - Update place status
- `PATCH /:placeId/verify` - Toggle place verification
- `PATCH /:placeId/feature` - Toggle place featured status
- `DELETE /:placeId` - Delete place
- `GET /stats` - Get place statistics

### `/api/admin/bookings`
Booking management operations
- `GET /` - List all bookings with pagination and filtering
- `GET /:bookingId` - Get specific booking details
- `POST /` - Create new booking (admin can create on behalf of users)
- `PUT /:bookingId` - Update booking information
- `PATCH /:bookingId/status` - Update booking status
- `PATCH /:bookingId/payment` - Update payment status
- `DELETE /:bookingId` - Delete booking
- `GET /stats` - Get booking statistics

### `/api/admin/collections`
Collection management operations
- `GET /` - List all collections with pagination and filtering
- `GET /:collectionId` - Get specific collection details
- `POST /` - Create new collection
- `PUT /:collectionId` - Update collection information
- `PATCH /:collectionId/status` - Update collection status
- `DELETE /:collectionId` - Delete collection
- `GET /stats` - Get collection statistics

### `/api/admin/blog`
Blog content management operations
- `GET /` - List all blog posts with pagination and filtering
- `GET /:postId` - Get specific blog post details
- `POST /` - Create new blog post
- `PUT /:postId` - Update blog post
- `PATCH /:postId/status` - Update blog post status
- `PATCH /:postId/feature` - Toggle blog post featured status
- `DELETE /:postId` - Delete blog post
- `GET /stats` - Get blog statistics

### `/api/admin/reviews`
Review moderation operations
- `GET /` - List all reviews with pagination and filtering
- `GET /:reviewId` - Get specific review details
- `PUT /:reviewId` - Update review information
- `PATCH /:reviewId/status` - Update review status
- `PATCH /:reviewId/respond` - Add owner response to review
- `PATCH /:reviewId/verify` - Toggle verified stay status
- `DELETE /:reviewId` - Delete review
- `GET /stats` - Get review statistics

### `/api/admin/analytics`
Analytics and reporting operations
- `GET /overview` - Get analytics overview
- `GET /events` - List analytics events
- `GET /daily-stats` - Get daily statistics
- `POST /events` - Track analytics event
- `GET /popular-places` - Get popular places data

## Common Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Filtering
- `search` - Search across relevant fields
- `status` - Filter by status
- `sortBy` - Sort field
- `sortOrder` - Sort order: asc/desc (default: desc)

## Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### List Response with Pagination
```json
{
  "items": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

## Authentication Flow

1. User authenticates via Better Auth at `/api/auth/*`
2. Session cookies are automatically set
3. Admin routes check for valid session and admin role
4. User and session data are available in context for routes

## Database Models

The admin API works with these main database models:
- **User**: Authentication and role management
- **Place**: Accommodation/activity listings
- **Booking**: Reservation management
- **Collection**: Curated travel itineraries
- **BlogPost**: Content management
- **Review**: User-generated content moderation
- **AnalyticsEvent**: Usage tracking and analytics

## Security Considerations

- All routes require authentication and admin role
- Input validation is performed on all requests
- SQL injection protection via Drizzle ORM
- CORS properly configured for allowed origins
- Session management via Better Auth secure cookies

## Rate Limiting

Consider implementing rate limiting for sensitive operations like:
- User creation/deletion
- Status updates
- Bulk operations