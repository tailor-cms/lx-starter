# Authentication Module

NestJS authentication and authorization system with user login, OAuth 2.0, and API client credentials.

## Overview

- **User Authentication**: Email/password login, Google OAuth, JWT sessions
- **OAuth 2.0 Client Credentials**: Machine-to-machine API access with scopes
- **Authorization**: Role-based (users) and scope-based (OAuth clients)
- **Security**: Bcrypt hashing, HTTP-only cookies, JWT tokens

See subdirectories for detailed documentation:
- `user-auth/` - User authentication (login, password management)
- `oauth/` - OAuth 2.0 client credentials flow
- `oidc/` - OpenID Connect (Google OAuth)
- `common/guards/README.md` - Authentication and authorization guards
- `common/` - Shared decorators, guards, and utilities

## Authentication Methods

1. **Email/Password** - Local authentication
2. **Google OAuth** - OIDC with domain whitelisting
3. **JWT** - Cookie (users) or Bearer token (OAuth clients)
4. **OAuth Client Credentials** - Machine-to-machine API access

## Authorization

- **Users**: Role-based (`@Roles()`)
- **OAuth Clients**: Scope-based (`@EnableOAuth()`)
- **Default**: User-only (OAuth must be explicitly enabled)

## Key Features

- Global authentication guard (opt-out with `@Public()`)
- Separate JWT strategies for users vs OAuth clients
- Scope validation with wildcard support (`write:*`)
- Admin-only scope restrictions
- Secret rotation and client lifecycle management

## Module Structure

```
auth/
├── auth.module.ts                          # Main module configuration
├── README.md                               # This file
│
├── user-auth/                              # User Authentication
│   ├── auth.controller.ts                  # Login, logout, password management
│   ├── auth.service.ts                     # User auth business logic
│   ├── dto/                                # User auth DTOs
│   │   ├── login.dto.ts
│   │   └── reset-password.dto.ts
│   └── strategies/                         # User auth strategies
│       ├── jwt.strategy.ts                 # Cookie-based JWT for users
│       ├── local.strategy.ts               # Email/password authentication
│       └── google.strategy.ts              # Google OAuth strategy
│
├── oauth/                                  # OAuth 2.0 Client Credentials
│   ├── oauth-clients.controller.ts         # OAuth client CRUD (admin-only)
│   ├── oauth-client.service.ts             # Client management
│   ├── oauth-client.repository.ts          # Client persistence
│   ├── oauth-token.controller.ts           # Token generation endpoint
│   ├── oauth-token.service.ts              # Token generation logic
│   ├── oauth.service.ts                    # Core OAuth business logic
│   ├── dto/                                # OAuth DTOs
│   │   ├── oauth-client.dto.ts
│   │   ├── oauth-client-response.dto.ts
│   │   └── oauth-token.dto.ts
│   ├── entities/                           # OAuth entities
│   │   └── oauth-client.entity.ts
│   ├── strategies/                         # OAuth strategies
│   │   └── oauth-jwt.strategy.ts           # Bearer token validation
│   ├── scopes/                             # OAuth scope system
│   │   ├── scope-definitions.ts            # Available scopes
│   │   └── index.ts
│   └── guards/                             # OAuth-specific guards
│       └── oauth-scopes.guard.ts           # Scope validation
│
├── oidc/                                   # OpenID Connect
│   ├── oidc.controller.ts                  # Google OAuth endpoints
│   └── utils/
│       └── oauth-redirect.util.ts
│
└── common/                                 # Shared Resources
    ├── guards/                             # Shared authentication guards
    │   ├── authentication.guard.ts         # Multi-strategy auth guard
    │   ├── roles.guard.ts                  # Role-based access control
    │   ├── google-oauth.guard.ts
    │   ├── local-auth.guard.ts
    │   ├── README.md                       # Guard documentation
    │   └── index.ts
    ├── decorators/                         # Shared decorators
    │   ├── current-user.decorator.ts       # Extract user from request
    │   ├── current-oauth-client.decorator.ts
    │   ├── enable-oauth.decorator.ts       # Enable OAuth access
    │   ├── oauth-only.decorator.ts         # OAuth-exclusive access
    │   ├── public.decorator.ts             # Mark routes as public
    │   ├── roles.decorator.ts              # Require specific roles
    │   └── index.ts
    ├── entities/
    │   └── index.ts                        # Entity re-exports
    └── index.ts                            # Main barrel export
```

## Guard Execution Order

```
Request → AuthenticationGuard → RolesGuard → OAuthScopesGuard → Controller
          (JWT validation)      (User roles) (OAuth scopes)
```

- **AuthenticationGuard**: Validates JWT (user or OAuth client)
- **RolesGuard**: Checks `@Roles()` for users only
- **OAuthScopesGuard**: Checks `@EnableOAuth()` for OAuth clients (default: user-only)

## Importing from Auth Module

The auth module provides a clean barrel export from `common/` for external modules:

```typescript
// Import decorators and guards (recommended)
import { Public, Roles, CurrentUser, EnableOAuth, OAuthOnly } from '@/modules/auth/common';

// Import specific services
import { AuthService } from '@/modules/auth/user-auth/auth.service';
import { OAuthClientService } from '@/modules/auth/oauth/oauth-client.service';

// Import entities (use database barrel export)
import { OAuthClient } from '@/database/entities';
```

## Usage Examples

### Route Protection

```typescript
// Public route (no authentication)
@Public()
@Get()
getPublic() { }

// User-only (default)
@Get()
getPrivate(@CurrentUser() user: User) { }

// Admin-only
@Roles(UserRole.ADMIN)
@Get()
getAdmin(@CurrentUser() user: User) { }

// OAuth-only (Bearer token required, rejects user cookies)
@OAuthOnly('webhook:publish')
@Post('webhook')
handleWebhook(@CurrentOAuthClient() client: OAuthTokenPayload) { }

// User OR OAuth (dual authentication)
@Roles(UserRole.ADMIN)
@EnableOAuth('read:users')
@Get()
getUsers(@CurrentUser() userOrClient: User | OAuthTokenPayload) { }
```

### Authentication Patterns

#### 1. User-Only (Default)
By default, all routes require user authentication (cookies). OAuth clients are rejected.

```typescript
@Get()
getUsers(@CurrentUser() user: User) {
  // Only authenticated users can access
}
```

#### 2. OAuth-Only
Use `@OAuthOnly()` when you want **only** OAuth Bearer tokens (machine-to-machine). This pattern:
- Sets the route as public (bypasses default auth)
- Requires Bearer token authentication
- Rejects user cookie authentication
- Validates OAuth scopes

```typescript
@OAuthOnly('webhook:publish', 'webhook:subscribe')
@Post('webhook/publish')
handleWebhook(@CurrentOAuthClient() client: OAuthTokenPayload) {
  // Only OAuth clients with correct scopes can access
  // User cookies are rejected
}
```

#### 3. Dual Authentication (User OR OAuth)
Use `@Roles()` + `@EnableOAuth()` to support both users and OAuth clients:

```typescript
@Roles(UserRole.ADMIN)
@EnableOAuth('read:users')
@Get()
getUsers(@CurrentUser() userOrClient: User | OAuthTokenPayload) {
  // Admins (cookies) OR OAuth clients with 'read:users' scope
  // Use type guards or JWT audience to differentiate
}
```

#### 4. Public (No Authentication)
Use `@Public()` for endpoints that don't require authentication:

```typescript
@Public()
@Get('health')
getHealth() {
  // Anyone can access
}
```

### OAuth Client Flow

```bash
# 1. Create integration (admin only)
POST /api/integrations
{
  "name": "My Integration",
  "description": "External API integration"
}

# 2. Create OAuth client for integration (admin only)
POST /api/integrations/:integrationId/clients
{
  "name": "API Client",
  "scopes": ["read:users", "write:content"]
}

# Response includes client_id and client_secret (shown once!)

# 3. Get access token
POST /api/oauth/token
grant_type=client_credentials
&client_id=client_xxx
&client_secret=sk_xxx
&scope=read:users write:content

# 4. Use token
GET /api/users
Authorization: Bearer <access_token>
```

## OAuth Scopes

| Scope | Description | Admin Required |
|-------|-------------|----------------|
| `read:users` | Read user information | Yes |
| `write:users` | Create and update users | Yes |
| `delete:users` | Delete users | Yes |
| `read:content` | Read content repositories and nodes | No |
| `webhook:publish` | Receive content publish webhook notifications | No |
| `admin:*` | Full administrative access | Yes |

**Wildcard matching**:
- `write:*` matches `write:users`, `write:content`, etc.
- `admin:*` matches everything

## API Endpoints

### Auth
- `POST /auth/login` - Email/password login
- `GET /auth/logout` - Clear session
- `POST /auth/change-password` - Change password
- `POST /auth/forgot-password` - Request reset
- `POST /auth/reset-password` - Reset with token

### OAuth
- `GET /oidc` - Google OAuth login
- `GET /oidc/callback` - OAuth callback

### OAuth Clients (Admin Only - Integration-Based)
- `GET /integrations/:id/clients` - List integration's OAuth clients
- `POST /integrations/:id/clients` - Create OAuth client for integration
- `GET /integrations/:id/clients/:clientId` - Get OAuth client
- `POST /integrations/:id/clients/:clientId/rotate-secret` - Rotate secret
- `DELETE /integrations/:id/clients/:clientId` - Delete client

### OAuth Token
- `POST /oauth/token` - Generate access token (client credentials)

## Security

- **Passwords**: bcrypt with configurable salt rounds
- **JWT**: Separate secrets for user vs OAuth tokens
- **Cookies**: HTTP-only, signed, secure in production
- **OAuth Secrets**: Hashed with bcrypt
- **Scopes**: Admin-only scopes enforced during client creation
- **OAuth Clients**: Only created for integrations, managed by admins
- **Token Audiences**: User tokens (`scope:access`) vs OAuth tokens (`oauth:api`)

## Related Documentation

- `common/guards/README.md` - Guard details and execution flow
- `oauth/scopes/scope-definitions.ts` - Available OAuth scopes and definitions
- `user-auth/strategies/` - Passport authentication strategies
- `oauth/strategies/` - OAuth JWT validation strategy

---

**For detailed implementation examples and troubleshooting**, refer to NestJS and Passport.js documentation.
