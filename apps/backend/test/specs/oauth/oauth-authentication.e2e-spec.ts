import { ApiRequest, paths } from '../../helpers';
import {
  cleanDatabase,
  closeTestingApp,
  createOAuthClient,
  createTestingApp,
  getAccessToken,
  getEntityManager,
  seedTestUsers,
} from '../../helpers/test.helpers';
import type { INestApplication } from '@nestjs/common';
import { Integration } from '@/modules/integration/entities/integration.entity';
import { OAuthClient } from '@/modules/auth/oauth/entities/oauth-client.entity';
import { randomBytes } from 'node:crypto';
import type { TestUser } from '../../helpers/test.helpers';

describe('OAuth Bearer Authentication', () => {
  let app: INestApplication;
  let tokenApi: ApiRequest;
  let usersApi: ApiRequest;
  let admin: TestUser;
  let integration: Integration;
  let oauthClient: OAuthClient;
  let plainClientSecret: string;
  let accessToken: string;

  beforeAll(async () => {
    app = await createTestingApp();
    tokenApi = new ApiRequest(app, paths.oauth.token);
    usersApi = new ApiRequest(app, paths.users.base);
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    admin = users.admin;
    // Create test integration
    const em = getEntityManager();
    const adminUser = await em.findOne('User', { id: admin.id });
    integration = em.create(Integration, {
      name: `Test Integration ${Date.now()}`,
      description: 'Test integration for OAuth authentication',
      isActive: true,
      createdBy: adminUser,
    } as any);
    await em.persistAndFlush(integration);
    // Create OAuth client
    plainClientSecret = `sk_test_${randomBytes(32).toString('hex')}`;
    oauthClient = await createOAuthClient(em, integration, plainClientSecret);
    // Get access token for tests
    accessToken = await getAccessToken(
      tokenApi,
      oauthClient.clientId,
      plainClientSecret,
    );
  });

  afterAll(async () => {
    await closeTestingApp();
  });

  describe('Bearer Token Authentication', () => {
    // Note: Similar tests exist in oauth-only-endpoint.e2e-spec.ts
    // This file tests OAuth on regular endpoints (mixed auth: user + OAuth)
    // oauth-only-endpoint.e2e-spec.ts tests @OAuthOnly() decorated endpoints
    it('should authenticate with valid Bearer token', async () => {
      // User listing endpoint has @EnableOAuth('read:users')
      const response = await usersApi
        .as(null)
        .get()
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject request with invalid Bearer token', async () => {
      const response = await usersApi
        .as(null)
        .get()
        .set('Authorization', 'Bearer invalid_token');
      expect(response.status).toBe(401);
    });

    it('should reject request with malformed Bearer header', async () => {
      const response = await usersApi
        .as(null)
        .get()
        .set('Authorization', accessToken); // Missing "Bearer" prefix
      expect(response.status).toBe(401);
    });

    it('should reject token without required scope', async () => {
      // Create a client without read:users scope
      const em = getEntityManager();
      const limitedClient = await createOAuthClient(
        em,
        integration,
        'limited_secret',
        ['read:content'], // Wrong scope
      );
      const limitedToken = await getAccessToken(
        tokenApi,
        limitedClient.clientId,
        'limited_secret',
      );
      const response = await usersApi
        .as(null)
        .get()
        .set('Authorization', `Bearer ${limitedToken}`);
      expect(response.status).toBe(403);
    });
  });

  describe('Token Structure', () => {
    it('should have the right format', async () => {
      // The token was already validated during generation in oauth-token tests
      // This test verifies the token can be used for authentication
      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(accessToken.split('.')).toHaveLength(3); // JWT structure
    });

    it('should generate unique tokens for each request', async () => {
      const token1 = await getAccessToken(
        tokenApi,
        oauthClient.clientId,
        plainClientSecret,
      );
      const token2 = await getAccessToken(
        tokenApi,
        oauthClient.clientId,
        plainClientSecret,
      );
      expect(token1).not.toBe(token2);
    });
  });

  describe('Scope-based Access', () => {
    it('should grant access with exact scope match', async () => {
      // Create a client with only read:users scope
      const em = getEntityManager();
      const readOnlyClient = await createOAuthClient(
        em,
        integration,
        'readonly_secret',
        ['read:users'],
      );
      const readToken = await getAccessToken(
        tokenApi,
        readOnlyClient.clientId,
        'readonly_secret',
      );
      // Should be able to list users
      const response = await usersApi
        .as(null)
        .get()
        .set('Authorization', `Bearer ${readToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should grant access with wildcard scope', async () => {
      // Create a client with admin:* wildcard scope
      const em = getEntityManager();
      const adminClient = await createOAuthClient(
        em,
        integration,
        'admin_secret',
        ['admin:*'],
      );
      const adminToken = await getAccessToken(
        tokenApi,
        adminClient.clientId,
        'admin_secret',
      );
      // Wildcard should grant access to any endpoint
      const response = await usersApi
        .as(null)
        .get()
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Multi-client Authentication', () => {
    it('should support multiple OAuth clients', async () => {
      const em = getEntityManager();
      // Create second client
      const client2Secret = `sk_test_${randomBytes(32).toString('hex')}`;
      const client2 = await createOAuthClient(em, integration, client2Secret);
      const token1 = await getAccessToken(
        tokenApi,
        oauthClient.clientId,
        plainClientSecret,
      );
      const token2 = await getAccessToken(
        tokenApi,
        client2.clientId,
        client2Secret,
      );
      expect(token1).not.toBe(token2);
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });
  });

  describe('Integration with User Authentication', () => {
    it('should not interfere with cookie-based user authentication', async () => {
      // User authentication via cookies should still work
      const response = await usersApi.as(admin).get();
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should not accept Bearer tokens via cookies', async () => {
      // Bearer authentication only checks Authorization header, not cookies
      const response = await usersApi
        .as(null)
        .get()
        .set('Cookie', `access_token=${accessToken}`);
      expect(response.status).toBe(401);
    });

    it('should reject user session tokens in Bearer header', async () => {
      // User session tokens have different audience claim than OAuth tokens
      // This verifies that the JWT audience validation is working correctly
      const response = await usersApi
        .as(null)
        .get()
        .set('Authorization', `Bearer ${admin.token}`);
      expect(response.status).toBe(401);
    });
  });
});
