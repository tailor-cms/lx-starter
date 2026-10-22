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

describe('OAuth-Only Endpoint (Webhook)', () => {
  let app: INestApplication;
  let tokenApi: ApiRequest;
  let webhookApi: ApiRequest;
  let admin: TestUser;
  let integration: Integration;
  let oauthClient: OAuthClient;
  let plainClientSecret: string;
  let accessToken: string;

  beforeAll(async () => {
    app = await createTestingApp();
    tokenApi = new ApiRequest(app, paths.oauth.token);
    webhookApi = new ApiRequest(app, paths.content.webhookPublish);
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
      description: 'Test integration for webhook',
      isActive: true,
      createdBy: adminUser,
    } as any);
    await em.persistAndFlush(integration);
    // Create OAuth client with webhook scope
    plainClientSecret = `sk_test_${randomBytes(32).toString('hex')}`;
    oauthClient = await createOAuthClient(em, integration, plainClientSecret, [
      'webhook:publish',
    ]);
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

  describe('OAuth-Only Access Control', () => {
    // Note: Similar tests exist in oauth-authentication.e2e-spec.ts
    // This file tests @OAuthOnly() decorated endpoints (OAuth required, user auth rejected)
    // oauth-authentication.e2e-spec.ts tests mixed auth endpoints (user OR OAuth)
    it('should accept valid OAuth Bearer token', async () => {
      const response = await webhookApi
        .as(null)
        .post({
          body: { repositoryId: 456 },
        })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should reject requests without any authentication', async () => {
      const response = await webhookApi.as(null).post({
        body: { repositoryId: 456 },
      });
      expect(response.status).toBe(401);
    });

    it('should reject user cookie-based authentication', async () => {
      // @OAuthOnly() decorator rejects user authentication
      const response = await webhookApi.as(admin).post({
        body: { repositoryId: 456 },
      });
      expect(response.status).toBe(401);
    });

    it('should reject invalid Bearer token', async () => {
      const response = await webhookApi
        .as(null)
        .post({
          body: { repositoryId: 456 },
        })
        .set('Authorization', 'Bearer invalid_token');
      expect(response.status).toBe(401);
    });

    it('should reject OAuth token without required scope', async () => {
      // Create a client without webhook:publish scope
      const em = getEntityManager();
      const limitedClient = await createOAuthClient(
        em,
        integration,
        'limited_secret',
        ['read:users'], // Wrong scope
      );
      const limitedToken = await getAccessToken(
        tokenApi,
        limitedClient.clientId,
        'limited_secret',
      );
      const response = await webhookApi
        .as(null)
        .post({
          body: { repositoryId: 456 },
        })
        .set('Authorization', `Bearer ${limitedToken}`);
      expect(response.status).toBe(403);
    });
  });

  describe('Webhook Payload Processing', () => {
    it('should process publish webhook (repositoryId only)', async () => {
      const response = await webhookApi
        .as(null)
        .post({
          body: { repositoryId: 456 },
        })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it(
      'should process activity publish webhook for repositoryId, activityId',
      async () => {
        const response = await webhookApi
          .as(null)
          .post({
            body: {
              repositoryId: 456,
              activityId: 123,
            },
          })
          .set('Authorization', `Bearer ${accessToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      },
    );

    it('should reject payload without repositoryId', async () => {
      const response = await webhookApi
        .as(null)
        .post({
          body: { activityId: 123 },
        })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(400);
    });

    it('should reject payload with invalid repositoryId type', async () => {
      const response = await webhookApi
        .as(null)
        .post({
          body: { repositoryId: 'not-a-number' },
        })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(400);
    });

    it('should reject payload with invalid activityId type', async () => {
      const response = await webhookApi
        .as(null)
        .post({
          body: {
            repositoryId: 456,
            activityId: 'not-a-number',
          },
        })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe('Scope Validation', () => {
    it('should accept wildcard scope for webhook endpoint', async () => {
      const em = getEntityManager();
      const wildcardClient = await createOAuthClient(
        em,
        integration,
        'wildcard_secret',
        ['webhook:*'],
      );
      const wildcardToken = await getAccessToken(
        tokenApi,
        wildcardClient.clientId,
        'wildcard_secret',
      );
      const response = await webhookApi
        .as(null)
        .post({
          body: { repositoryId: 456 },
        })
        .set('Authorization', `Bearer ${wildcardToken}`);
      expect(response.status).toBe(200);
    });

    it('should accept admin wildcard scope', async () => {
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
      const response = await webhookApi
        .as(null)
        .post({
          body: { repositoryId: 456 },
        })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
    });
  });
});
