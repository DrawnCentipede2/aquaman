# Security Improvements - API Routes & Environment Variables

## Overview
This document outlines the security improvements made to the Google Pins Marketplace application to better protect sensitive API keys and follow security best practices.

## Changes Made

### 1. **API Routes Updated**
- **File**: `app/api/places/details/route.ts`
- **File**: `app/api/places/reviews/route.ts`
- **Change**: Updated to use server-side Google Maps API key instead of client-side key

**Before:**
```typescript
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

**After:**
```typescript
// Use server-side API key for better security
const apiKey = process.env.GOOGLE_MAPS_API_KEY_SERVER || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### 2. **Environment Variables Restructured**
- **File**: `lib/env.ts`
- **Change**: Added support for both client-side and server-side Google Maps API keys

**New Structure:**
```typescript
// Google Maps API Keys
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(), // Client-side key
GOOGLE_MAPS_API_KEY_SERVER: z.string().optional(), // Server-side key (more permissive)
```

### 3. **Environment Configuration Updated**
- **File**: `env.example`
- **Change**: Added documentation for the new server-side API key

```bash
# Google Maps API Configuration
# Client-side key (restricted to your domain)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# Server-side key (for API routes - more permissive)
GOOGLE_MAPS_API_KEY_SERVER=your_google_maps_server_key
```

## Security Benefits

### 1. **Reduced Exposure**
- Server-side API keys are never exposed to the browser
- Client-side keys can be restricted to specific domains
- Sensitive operations happen server-side only

### 2. **Better Key Management**
- **Client-side key**: Restricted to your domain, limited permissions
- **Server-side key**: More permissive for API operations, never exposed

### 3. **Fallback Support**
- API routes fall back to client-side key if server-side key is not configured
- Ensures backward compatibility during migration

## Setup Instructions

### 1. **Update Your Environment Variables**
Add to your `.env.local` file:
```bash
# Google Maps API Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_restricted_client_key
GOOGLE_MAPS_API_KEY_SERVER=your_server_key_with_more_permissions
```

### 2. **Google Cloud Console Configuration**

#### Client-Side Key Restrictions:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Edit your client-side API key
4. Set **Application restrictions**: HTTP referrers (web sites)
5. Add **Website restrictions**: `yourdomain.com/*`
6. Set **API restrictions**: Only Maps JavaScript API, Places API

#### Server-Side Key Configuration:
1. Create a separate API key for server-side operations
2. Set **Application restrictions**: None (or IP restrictions if possible)
3. Set **API restrictions**: Places API, Geocoding API, etc.
4. This key will have more permissions but is never exposed to the browser

### 3. **Testing**
- Client-side maps functionality should work with restricted key
- API routes should work with server-side key
- Both keys can be the same during development

## Security Best Practices

### 1. **Key Rotation**
- Regularly rotate your API keys
- Use different keys for development and production
- Monitor API usage for unusual patterns

### 2. **Rate Limiting**
- Implement rate limiting on your API routes
- Monitor for abuse and implement additional restrictions if needed

### 3. **Monitoring**
- Set up alerts for unusual API usage
- Monitor for unauthorized access attempts
- Log API requests for security analysis

## Migration Notes

### Backward Compatibility
- Existing functionality will continue to work
- API routes fall back to client-side key if server-side key is not set
- No breaking changes to existing code

### Recommended Timeline
1. **Immediate**: Update environment variables with new structure
2. **Short-term**: Create separate Google Maps API keys
3. **Long-term**: Implement additional security measures (rate limiting, monitoring)

## Files Modified
- `app/api/places/details/route.ts`
- `app/api/places/reviews/route.ts`
- `lib/env.ts`
- `env.example`
- `SECURITY_IMPROVEMENTS.md` (this file)

## Next Steps
1. Update your `.env.local` file with the new structure
2. Create separate Google Maps API keys in Google Cloud Console
3. Test all functionality to ensure it works correctly
4. Consider implementing additional security measures

---

**Remember**: Always keep your server-side API keys secure and never expose them in client-side code or version control. 