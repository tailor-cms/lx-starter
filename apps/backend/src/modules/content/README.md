# Content Module

High-performance content delivery system for Tailor CMS with multi-tier caching 
and automatic pre-warming.

## Overview

Delivers educational content from S3 storage with **sub-10ms response times** 
through intelligent caching and pre-warming strategies.

### Key Achievements
- **100x faster** content delivery (3.5ms vs 400ms)
- **Zero cold starts** with automatic pre-warming (production)
- **Real-time updates** via webhook invalidation
- **Production-ready** with Redis support and error handling

## Architecture

```
Client → REST API → ContentService → ContentCacheService → Garment (S3)
                                              ↓
                                  Cache Layer (Memory/Redis)
```

### Core Services

- **ContentService**: Business logic and request routing
- **ContentCacheService**: 4-tier cache management
- **ContentElementHookRegistry**: Extensible content element processing

## Cache Strategy

### 4-Tier Cache Layers

| Layer | Purpose | TTL | Cache Key Pattern |
|-------|---------|-----|-------------------|
| **Catalog** | Repository list | 8h | `{ns}:catalog` |
| **Repository** | Structure without content | 8h | `{ns}:repo:{uid}` |
| **Content Graph** | Node metadata for lookups | 8h | `{ns}:graph:{uid}` |
| **Activity** | Full content with signed URLs | 8h | `{ns}:a:{repoUid}:{activityUid}` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/content` | List all repositories |
| GET | `/content/:uid` | Get repository structure (no content) |
| GET | `/content/:uid/nodes/:nodeUid` | Get specific content (activity/element) |
| POST | `/content/webhook/publish` | Invalidate cache (OAuth protected) |

## Key Features

### Automatic Pre-warming
- Triggers after repository access
- Loads all content in background
- Eliminates first-request penalty

### Smart Path Optimization
- **Fast path**: Direct activity lookup for 90% of requests
- **Slow path**: Graph-based resolution for nested elements

### Concurrent Request Deduplication
- Prevents duplicate S3 operations
- Distributed locks across instances
- Automatic timeout protection

### Error Resilience
- Graceful S3 failure handling
- Fallback to lazy loading if pre-warming fails
- Detailed error logging

## Configuration

### Environment Variables

```bash
# Content Element Configuration (TCE_ prefix with camelCase)
# Pattern: TCE_{KEY} → transformed to camelCase
# Example: TCE_MUX_VIDEO_TOKEN_ID → muxVideoTokenId
TCE_MUX_VIDEO_TOKEN_ID=xxx
TCE_MUX_VIDEO_TOKEN_SECRET=xxx
TCE_MUX_VIDEO_PLAYBACK_POLICY=signed
```

### Content Element Hooks

TCE_ environment variables are exposed to content element hooks via the `services.config` object:

```typescript
// Example: @tailor-cms/ce-mux-video-server
export async function afterLoaded(element, services, runtime) {
  const { config } = services;
  // config.muxVideoTokenId = value from TCE_MUX_VIDEO_TOKEN_ID
  // config.muxVideoTokenSecret = value from TCE_MUX_VIDEO_TOKEN_SECRET
  const token = await generateMuxToken(
    element.data.playbackId,
    config.muxVideoTokenId,
    config.muxVideoTokenSecret
  );
  element.data.token = token;
  return element;
}
```

### Adding New Content Elements

To add a new content element package:

1. **Install the package**:
   ```bash
   pnpm add @tailor-cms/ce-{element}-server
   ```

2. **Register in hook registry** (`content-element-hook-registry.service.ts`):
   ```typescript
   const installedPackages = [
     { type: 'MUX_VIDEO', package: '@tailor-cms/ce-mux-video-server' },
     { type: 'IMAGE', package: '@tailor-cms/ce-image-server' }, // Add here
   ];
   ```

3. **Configure environment variables**:
   ```bash
   TCE_IMAGE_CDN_URL=https://cdn.example.com
   TCE_IMAGE_QUALITY=85
   ```

### Optimizations
- Repository instances map for avoiding S3 reloads
- Catalog pre-loading on service initialization
- Activity/signature cache invalidation on repository updates
- Distributed locking for concurrent request deduplication

## Production Considerations

1. **Use Redis** for multi-instance deployments
2. **Configure webhooks** in Tailor CMS for cache invalidation
3. **Monitor cache hit rates** (target >90%)
4. **Adjust TTLs** based on content update frequency
5. **Set up health checks** for S3 connectivity

## Dependencies

- **@tailor-cms/garment**: S3 content access and signing
- **@nestjs/cache-manager**: Cache abstraction
- **cache-manager**: In-memory/Redis cache implementation
