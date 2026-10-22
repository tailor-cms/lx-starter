# Backend Testing Documentation

A comprehensive end-to-end testing suite for the backend API, focusing on
security, authentication, authorization, and data integrity.

## 🧪 Testing Philosophy

Our testing approach prioritizes:
- **Security First**: Comprehensive security testing including XSS, SQL
  injection, and access control
- **Real-World Scenarios**: End-to-end tests that simulate actual user workflows
- **Test Isolation**: Each test runs in a clean environment with fresh data
- **Developer Experience**: Rich helper utilities and clear test patterns

## 🚀 Quick Start

### Setup Test Environment
```bash
# Copy test environment configuration
cp test.env.example .env.test

# Install dependencies (from backend root)
pnpm install
```

### Running Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run with coverage report
pnpm test:e2e:cov

# Run in watch mode for development
pnpm test:e2e:watch

# Run specific test file
pnpm test:e2e -- --testNamePattern="auth.login"

# Run with verbose output
pnpm test:e2e -- --verbose
```

## 📊 Test Coverage Overview

### 🔐 Authentication & Security (95%+ Coverage)
- **Login/Logout Flows**: Credential validation, session management, security headers
- **Password Management**: Change password, forgot/reset flows, token validation
- **Token Security**: JWT validation, expiration, httpOnly cookies (user auth is cookie-only)
- **OAuth2 Authentication**: Client credentials flow for machine-to-machine API access
- **Security Hardening**: XSS prevention, SQL injection protection, rate limiting

> **Note**: User authentication uses httpOnly cookies exclusively. Bearer tokens with
> `Authorization` headers are reserved for OAuth2 client authentication only.

### 👥 User Management (100% Coverage)
- **CRUD Operations**: Create, read, update, delete with proper authorization
- **Access Control**: Role-based permissions, self-modification prevention
- **Data Protection**: Sensitive field filtering, input validation, data integrity
- **Search & Filtering**: Text search, sorting, pagination, archived user handling

### 🛡️ Authorization & Access Control (100% Coverage)
- **Role-Based Access**: Admin vs User permissions across all endpoints
- **Self-Protection**: Prevent users from escalating privileges or deleting themselves
- **Last Admin Protection**: Prevent deletion/demotion of the last admin user
- **Cross-User Protection**: Prevent users from accessing other users' data

### ✅ Input Validation & Data Integrity (100% Coverage)
- **Type Safety**: Reject invalid data types, arrays where strings expected
- **Format Validation**: Email formats, UUID validation, string length limits
- **Edge Cases**: Unicode characters, special characters, null/undefined handling
- **Security Validation**: XSS payload rejection, SQL injection prevention

## 🏗️ Test Architecture

### Directory Structure
```
test/
├── esm-shims/          # CommonJS compatibility for ESM packages
│   ├── app-config.js   # Mock for @app/config package
│   ├── yn.js           # CommonJS wrapper for yn package
│   └── README.md       # Documentation for shims
├── helpers/            # Test utilities and shared functions
│   ├── api-request.ts  # HTTP client for API testing
│   ├── auth-client.ts  # Specialized authentication client
│   ├── assertions.ts   # Custom assertion helpers
│   ├── auth.spec.helpers.ts # JWT token generation utilities
│   ├── bootstrap.ts    # Test app creation and teardown
│   ├── cookie.ts       # Cookie parsing and validation
│   ├── db.helpers.ts   # Database seeding and cleanup
│   ├── factories.ts    # Test data factories
│   ├── routes.ts       # API route constants
│   ├── test.helpers.ts # Main helper exports
│   └── index.ts        # Helper module exports
├── specs/              # Test specifications organized by feature
│   ├── auth/           # Authentication testing
│   ├── me/             # Current user profile testing
│   └── user/           # User management testing
├── global-setup.ts     # Global test environment setup
├── global-teardown.ts  # Global test cleanup
├── jest-e2e.json      # Jest configuration for E2E tests
├── mikro-orm.config.ts # Test database configuration
└── test-app.module.ts  # NestJS test application module
```

## 🛠️ Helper Utilities

### Core Testing Helpers

#### `ApiRequest` - HTTP Client
Fluent API for making authenticated requests to any endpoint:
```typescript
const api = new ApiRequest(app, '/api/users');

// Make authenticated requests
await api.as(adminUser).get().expect(200);
await api.as(regularUser).post({ body: userData }).expect(403);
await api.as(null).get().expect(401); // Unauthenticated
```

#### `AuthClient` - Authentication Helper
Specialized client for authentication workflows with automatic session management:
```typescript
const authClient = new AuthClient(app);

// Login with automatic cookie handling
const loginResponse = await authClient.login(email, password);

// Access protected endpoints with session
await authClient.get('/api/me'); // Uses stored cookies

// Authentication operations
await authClient.auth.logout();
await authClient.auth.changePassword(oldPw, newPw);
await authClient.auth.forgotPassword(email);
```

### Database Helpers

#### User Management
```typescript
// Seed standard test users (admin + regular user)
const { admin, user } = await seedTestUsers();

// Create custom test users
const customUser = await createTestUser({
  email: 'custom@test.com',
  role: UserRole.ADMIN,
  firstName: 'Custom',
  lastName: 'User'
});

// Clean database between tests
await cleanDatabase();
```

#### Database Access
```typescript
// Get fresh entity manager
const em = getEntityManager();
const user = await em.findOne(User, { email: 'test@example.com' });
```

### Security Testing Utilities

#### Test Data Factories
```typescript
import { userFactory } from '../helpers/factories';

// Generate valid test data
const userData = userFactory.createData({
  email: 'test@example.com',
  role: UserRole.USER
});

// Security testing payloads
userFactory.xssPayloads        // XSS attack vectors
userFactory.sqlInjectionPayloads // SQL injection attempts
userFactory.invalidEmails     // Invalid email formats
```

#### JWT Token Generation
```typescript
import { createAccessToken, createResetToken, createExpiredToken } from '../helpers/auth.spec.helpers';

// Create tokens for testing
const accessToken = await createAccessToken(user, jwtService, configService);
const resetToken = await createResetToken(user, jwtService, configService);
const expiredToken = await createExpiredToken(user, jwtService, configService);
```

### Assertion Helpers

#### User Validation
```typescript
import { expectUser, expectPaginatedResponse } from '../helpers/assertions';

// Validate user object structure
expectUser(response.body.user, {
  email: 'expected@example.com',
  role: UserRole.ADMIN
});

// Validate paginated responses
expectPaginatedResponse(response.body, {
  page: 1,
  total: 10,
  hasNext: true
});
```

#### Error Validation
```typescript
import { expectValidationError, expectForbidden, expectNotFound } from '../helpers/assertions';

// Validate specific error types
expectValidationError(response, 'email'); // Checks for email validation error
expectForbidden(response);               // Validates 403 response
expectNotFound(response);                // Validates 404 response
```

## 📝 Writing Tests

### Test Structure Pattern
```typescript
describe('Feature Name', () => {
  let app: INestApplication;
  let apiClient: ApiRequest; // or AuthClient for auth tests
  let admin: TestUser;
  let user: TestUser;

  beforeAll(async () => {
    app = await createTestingApp();
    apiClient = new ApiRequest(app, '/api/endpoint');
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    admin = users.admin;
    user = users.user;
  });

  afterAll(async () => {
    await closeTestingApp();
  });

  describe('Specific functionality', () => {
    it('should handle expected behavior', async () => {
      // Test implementation
    });
  });
});
```

### Best Practices

#### 1. Use Descriptive Test Names
```typescript
// ✅ Good
it('should prevent regular users from accessing admin endpoints')
it('should validate email format and reject invalid emails')

// ❌ Bad  
it('should work')
it('test user creation')
```

#### 2. Test Both Success and Failure Cases
```typescript
describe('User creation', () => {
  it('should create user with valid data', async () => {
    // Test successful creation
  });

  it('should reject duplicate email addresses', async () => {
    // Test failure case
  });

  it('should validate required fields', async () => {
    // Test validation errors
  });
});
```

#### 3. Use Helpers for Common Operations
```typescript
// ✅ Good - Use helpers (cookie-based authentication)
const { admin, user } = await seedTestUsers();
await apiClient.as(admin).post({ body: userData }).expect(201);

// ❌ Bad - Manual setup
const admin = await createUser({ role: 'ADMIN' });
const token = await generateToken(admin);
const response = await request(app).post('/api/users')
  .set('Cookie', `access_token=${token}`)
  .send(userData);
```

#### 4. Test Security Thoroughly
```typescript
describe('Security validation', () => {
  it('should prevent XSS attacks in user input', async () => {
    for (const xssPayload of userFactory.xssPayloads) {
      const response = await api.as(admin).post({
        body: { firstName: xssPayload }
      });
      // Verify XSS is blocked or sanitized
    }
  });
});
```

## 🔧 Configuration

### Test Environment (`test.env.example`)
```env
NODE_ENV=test
PORT=3001
LOG_LEVEL=error                    # Minimal logging for performance

# In-memory database for isolation
DATABASE_NAME=:memory:
DATABASE_LOGGING=false

# Test-specific auth settings
AUTH_JWT_SECRET=test-jwt-secret    # Weak secret OK for testing
AUTH_JWT_EXPIRES_IN=7d            # Longer expiration for test convenience
```

### Jest Configuration (`jest-e2e.json`)
- **Test Pattern**: Matches `*.e2e-spec.ts` files
- **Module Mapping**: ESM compatibility shims
- **Global Setup**: Environment initialization
- **Timeout**: 30 seconds for comprehensive tests
- **Single Worker**: Ensures test isolation

### Database Configuration (`mikro-orm.config.ts`)
- **In-Memory SQLite**: Fast, isolated, no cleanup needed
- **Auto-Migration**: Automatic schema creation
- **Seeding**: Fresh data for each test run
- **No Foreign Keys**: Simplified testing constraints

## 📈 Coverage Reports

### Generating Coverage
```bash
# Generate coverage report
pnpm test:e2e:cov

# View HTML report
open coverage-e2e/lcov-report/index.html
```

### Coverage Targets
- **Overall Coverage**: >95%
- **Authentication**: >98%
- **Authorization**: 100%
- **Security Features**: 100%
- **API Endpoints**: >95%

## 🐛 Debugging Tests

### Debug Mode
```bash
# Run tests with debugger
pnpm test:e2e:debug

# Debug specific test
pnpm test:e2e:debug -- --testNamePattern="specific test"
```

### Common Issues

#### 1. Port Conflicts
```bash
# Kill processes on test port
lsof -ti:3001 | xargs kill -9
```

#### 2. Database Connection Issues
- Verify test environment variables are loaded
- Check that in-memory database configuration is correct

#### 3. Token Expiration
- Test tokens are configured with longer expiration
- Use helper functions to generate fresh tokens

## 🚀 Performance Optimization

### Test Performance Tips
1. **Use `beforeAll` for expensive setup** (app creation)
2. **Use `beforeEach` for data setup** (database seeding)
3. **Minimize external dependencies** (mocked email service)
4. **Use in-memory database** for speed
5. **Parallel test execution** when possible

### Monitoring Test Performance
```bash
# Run with timing information
pnpm test:e2e -- --verbose --detectOpenHandles
```

## 🤝 Contributing to Tests

### Adding New Tests
1. **Identify the feature area** (auth, user management, etc.)
2. **Choose appropriate test file** or create new one
3. **Use existing helpers** for common operations
4. **Follow naming conventions** and test structure
5. **Include security testing** for new endpoints
6. **Add both positive and negative test cases**

### Test Categories to Include
- **Happy Path**: Expected successful operations
- **Validation**: Input validation and error handling  
- **Authorization**: Role-based access control
- **Security**: XSS, injection, and other security concerns
- **Edge Cases**: Boundary conditions and unusual inputs
- **Data Integrity**: Consistency and constraint enforcement

---

For questions about testing patterns or adding new test coverage, 
refer to existing test files as examples or consult the main
[backend documentation](../README.md).
