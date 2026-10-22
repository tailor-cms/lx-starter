# Authentication & Authorization Guards

## Global Guards (Execute on All Routes)

### AuthenticationGuard
Validates JWT tokens (user or OAuth). Tries `jwt` and `oauth-jwt` strategies. Routes opt-out with `@Public()`.

### RolesGuard
Role-based access control for users. Checks `@Roles()` decorator.

### OAuthScopesGuard
Scope-based access control for OAuth clients. **Default: user-only** (OAuth must be explicitly enabled with `@EnableOAuth()`).

## Route-Level Guards

### LocalAuthGuard
Username/password authentication via LocalStrategy.

### GoogleOAuthGuard
Google OAuth/OIDC authentication. Used in `oidc.controller.ts`.

---

## Common Usage Patterns

```typescript
// User-only (default)
@Get('/admin/users')
@Roles(UserRole.ADMIN)
async getUsers(@CurrentUser() user: User) { }

// OAuth-only
@Get('/api/users')
@Public()
@EnableOAuth('read:users')
async getUsers(@CurrentOAuthClient() client: OAuthTokenPayload) { }

// Both user OR OAuth
@Get('/api/users')
@Roles(UserRole.ADMIN)
@EnableOAuth('read:users')
async getUsers(@CurrentUser() userOrClient: User | OAuthTokenPayload) { }

// Public (no auth)
@Get('/health')
@Public()
async health() { }
```

---

## Request Context

After authentication, `req.user` contains:

**User Authentication:**

```typescript
{ id, email, role, ... } // User entity
```

**OAuth Authentication:**

```typescript
{
  (sub, client_id, owner_type, owner_id, scope, aud, iss, exp, iat, jti);
}
```

**Type Check:**

```typescript
if ('client_id' in req.user) {
  // OAuth
} else if ('email' in req.user) {
  // User
}
```
