# Authentication Strategies

Passport strategies that validate credentials and return user/client information.

## Strategies

### LocalStrategy

**File:** `local.strategy.ts`
**Purpose:** Username/password authentication

- Validates email + password via `AuthService.validateCredentials()`
- Returns User entity if valid

### JwtStrategy

**File:** `jwt.strategy.ts`
**Purpose:** User JWT token authentication

- **Extracts from:** Cookie (`access_token`) only
- **Validates:** User tokens (no `aud` or `aud !== 'oauth:api'`)
- **Rejects:** OAuth tokens (`aud === 'oauth:api'`)
- **Returns:** User entity from database
- **Used by:** `AuthenticationGuard`
- **Note:** Bearer tokens are handled by OAuthJwtStrategy

### OAuthJwtStrategy

**File:** `oauth-jwt.strategy.ts`
**Purpose:** OAuth client JWT token authentication

- **Extracts from:** `Authorization: Bearer` only
- **Validates:** OAuth tokens (`aud === 'oauth:api'`)
- **Checks:** Client exists and `canAuthenticate` (active, not expired, not deleted)
- **Returns:** OAuthTokenPayload (not User entity)
- **Used by:** `AuthenticationGuard`

### GoogleStrategy

**File:** `google.strategy.ts`
**Purpose:** Google OAuth/OIDC authentication

- Handles Google sign-in flow
- Creates user if email domain is whitelisted
- Returns User entity
- **Used by:** `GoogleOAuthGuard` in `oidc.controller.ts`

---

## Strategy Flow

### User JWT Authentication

```
Request with cookie
  → JwtStrategy.validate()
    → Check aud !== 'oauth:api'
    → Lookup User by id + email
    → Check not deleted
    → Return User entity
  → Attached to req.user
```

### OAuth JWT Authentication

```
Request with Bearer token
  → OAuthJwtStrategy.validate()
    → Passport validates aud === 'oauth:api'
    → Lookup OAuthClient by id (sub)
    → Check client.canAuthenticate
    → Return OAuthTokenPayload
  → Attached to req.user
```

---

## Token Payloads

### User JWT Payload

```typescript
{
  sub: string;      // User ID
  email: string;    // User email
  role?: string;    // User role
  iss: string;      // Issuer
  iat: number;      // Issued at
  exp: number;      // Expiration
}
```

### OAuth JWT Payload

```typescript
{
  sub: string;              // OAuth client ID
  client_id: string;        // Client identifier
  owner_type: 'USER' | 'INTEGRATION';
  owner_id: string;         // Owner ID
  scope: string[];          // Granted scopes
  aud: 'oauth:api';         // Audience (differentiator)
  iss: string;              // Issuer
  exp: number;              // Expiration
  iat: number;              // Issued at
  jti: string;              // JWT ID (for revocation)
}
```

---

## How Strategies Are Selected

The `AuthenticationGuard` uses both `jwt` and `oauth-jwt` strategies:

```typescript
AuthGuard(['jwt', 'oauth-jwt']);
```

**Selection logic:**

1. Try `JwtStrategy` first
   - If token has `aud === 'oauth:api'` → reject, try next strategy
   - If valid user token → return User entity
2. If `JwtStrategy` fails, try `OAuthJwtStrategy`
   - Passport validates `aud === 'oauth:api'`
   - If valid OAuth token → return OAuthTokenPayload
3. If both fail → 401 Unauthorized

**Key discriminator:** The `aud` (audience) field

- User tokens: `aud` is undefined or not `'oauth:api'`
- OAuth tokens: `aud === 'oauth:api'`

---

## Configuration

All strategies use the same JWT secret from `auth.jwt.secret` config.

**JwtStrategy:**

```typescript
{
  jwtFromRequest: Cookie only,
  secretOrKey: config.auth.jwt.secret,
  ignoreExpiration: false
}
```

**OAuthJwtStrategy:**

```typescript
{
  jwtFromRequest: Bearer only,
  secretOrKey: config.auth.jwt.secret,
  audience: 'oauth:api',           // Only accept this audience
  issuer: config.auth.jwt.issuer,
  ignoreExpiration: false
}
```
