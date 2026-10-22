import {
  ApiRequest,
  paths,
  expectBadRequest,
  expectForbidden,
  expectNotFound,
} from '../../helpers';
import {
  cleanDatabase,
  closeTestingApp,
  createTestingApp,
  seedTestUsers,
} from '../../helpers/test.helpers';
import { EntityManager } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import { Integration } from '@/modules/integration/entities/integration.entity';
import type { TestUser } from '../../helpers/test.helpers';

describe('OAuth Client API: CRUD operations', () => {
  let app: INestApplication;
  let api: ApiRequest;
  let admin: TestUser;
  let user: TestUser;
  let em: EntityManager;
  let testIntegration: Integration;

  beforeAll(async () => {
    app = await createTestingApp();
    em = app.get(EntityManager);
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    admin = users.admin;
    user = users.user;
    // Create test integration
    const adminUser = await em.findOneOrFail('User', { id: admin.id });
    testIntegration = em.create(Integration, {
      name: 'Test Integration',
      description: 'Integration for OAuth client tests',
      createdBy: adminUser,
      isActive: true,
    } as any);
    await em.persistAndFlush(testIntegration);
    api = new ApiRequest(
      app,
      `${paths.integrations.base}/${testIntegration.id}/clients`,
    );
  });

  afterAll(async () => await closeTestingApp());

  // Helper function to create test OAuth client via API
  const createOAuthClient = async (
    name: string,
    scopes: string[],
    description?: string,
  ): Promise<any> => {
    const response = await api
      .as(admin)
      .post({ body: { name, scopes, description } })
      .expect(201);
    return response.body;
  };

  describe('GET /integrations/:id/clients', () => {
    it('should return paginated OAuth clients for admin', async () => {
      await createOAuthClient('Client 1', ['read:content']);
      await createOAuthClient('Client 2', ['webhook:publish']);
      const response = await api.as(admin).get().expect(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total', 2);
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body.data).toHaveLength(2);
    });

    it('should deny read access for non-admin users', async () => {
      const response = await api.as(user).get().expect(403);
      expectForbidden(response);
    });

    it('should support pagination parameters', async () => {
      await createOAuthClient('Client 1', ['read:content']);
      await createOAuthClient('Client 2', ['read:content']);
      const response = await api
        .as(admin)
        .get({ query: { limit: 10, offset: 0 } })
        .expect(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('offset', 0);
    });

    it('should return empty array when no clients exist', async () => {
      const response = await api.as(admin).get().expect(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('POST /integrations/:id/clients', () => {
    it('should create OAuth client with valid scopes', async () => {
      const newClient = {
        name: 'Test Client',
        description: 'Test OAuth client',
        scopes: ['read:content', 'webhook:publish'],
      };
      const response = await api
        .as(admin)
        .post({ body: newClient })
        .expect(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('clientId');
      expect(response.body).toHaveProperty('clientSecret');
      expect(response.body.name).toBe(newClient.name);
      expect(response.body.description).toBe(newClient.description);
      expect(response.body.allowedScopes).toEqual(
        expect.arrayContaining(newClient.scopes),
      );
      expect(response.body.isActive).toBe(true);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should create OAuth client without description', async () => {
      const newClient = {
        name: 'Simple Client',
        scopes: ['read:content'],
      };
      const response = await api
        .as(admin)
        .post({ body: newClient })
        .expect(201);
      expect(response.body.name).toBe(newClient.name);
      expect(response.body.description).toBeUndefined();
    });

    it('should create OAuth client with expiration date', async () => {
      const expiresAt = new Date('2025-12-31T23:59:59Z').toISOString();
      const newClient = {
        name: 'Expiring Client',
        scopes: ['read:content'],
        expiresAt,
      };
      const response = await api
        .as(admin)
        .post({ body: newClient })
        .expect(201);
      expect(response.body.expiresAt).toBeDefined();
      expect(new Date(response.body.expiresAt).toISOString()).toBe(expiresAt);
    });

    it('should create OAuth client with rate limit', async () => {
      const newClient = {
        name: 'Rate Limited Client',
        scopes: ['read:content'],
        rateLimit: 1000,
      };
      const response = await api
        .as(admin)
        .post({ body: newClient })
        .expect(201);
      expect(response.body.rateLimit).toBe(1000);
    });

    it('should apply default rate limit when not specified', async () => {
      const newClient = {
        name: 'Client Without Rate Limit',
        scopes: ['read:content'],
      };
      const response = await api
        .as(admin)
        .post({ body: newClient })
        .expect(201);
      // Default from OAUTH_DEFAULT_RATE_LIMIT env variable (1000)
      expect(response.body.rateLimit).toBe(1000);
    });

    it('should deny write access for non-admin users', async () => {
      const newClient = {
        name: 'Test Client',
        scopes: ['read:content'],
      };
      const response = await api.as(user).post({ body: newClient }).expect(403);
      expectForbidden(response);
    });

    it('should reject missing name field', async () => {
      const response = await api
        .as(admin)
        .post({ body: { scopes: ['read:content'] } })
        .expect(400);
      expectBadRequest(response);
    });

    it('should reject empty name', async () => {
      const response = await api
        .as(admin)
        .post({ body: { name: '', scopes: ['read:content'] } })
        .expect(400);
      expectBadRequest(response);
    });

    it('should reject missing scopes field', async () => {
      const response = await api
        .as(admin)
        .post({ body: { name: 'Test Client' } })
        .expect(400);
      expectBadRequest(response);
    });

    it('should reject empty scopes array', async () => {
      const response = await api
        .as(admin)
        .post({ body: { name: 'Test Client', scopes: [] } })
        .expect(400);
      expectBadRequest(response);
    });

    it('should reject invalid scopes', async () => {
      const response = await api
        .as(admin)
        .post({
          body: { name: 'Test Client', scopes: ['invalid:scope'] },
        })
        .expect(400);
      expectBadRequest(response);
      expect(response.body.message).toContain('invalid:scope');
    });

    it('should reject negative rate limit', async () => {
      const response = await api
        .as(admin)
        .post({
          body: {
            name: 'Test Client',
            scopes: ['read:content'],
            rateLimit: -100,
          },
        })
        .expect(400);
      expectBadRequest(response);
    });

    it('should reject invalid expiration date format', async () => {
      const response = await api
        .as(admin)
        .post({
          body: {
            name: 'Test Client',
            scopes: ['read:content'],
            expiresAt: 'invalid-date',
          },
        })
        .expect(400);
      expectBadRequest(response);
    });
  });

  describe('GET /integrations/:id/clients/:clientId', () => {
    it('should return OAuth client by id for admin', async () => {
      const client = await createOAuthClient('Test Client', ['read:content']);
      const response = await api
        .as(admin)
        .get({ path: `/${client.id}` })
        .expect(200);
      expect(response.body.id).toBe(client.id);
      expect(response.body.name).toBe(client.name);
      expect(response.body.allowedScopes).toEqual(['read:content']);
      expect(response.body).not.toHaveProperty('clientSecret');
    });

    it('should return 404 for non-existent client', async () => {
      const response = await api
        .as(admin)
        .get({ path: '/00000000-0000-0000-0000-000000000000' })
        .expect(404);
      expectNotFound(response);
    });
  });

  describe('POST /integrations/:id/clients/:clientId/rotate-secret', () => {
    it('should rotate client secret', async () => {
      const client = await createOAuthClient('Test Client', ['read:content']);
      const originalClientId = client.clientId;
      const response = await api
        .as(admin)
        .post({ path: `/${client.id}/rotate-secret` })
        .expect(200);
      expect(response.body).toHaveProperty('clientSecret');
      expect(response.body.clientId).toBe(originalClientId);
      expect(response.body.clientSecret).toBeDefined();
      expect(typeof response.body.clientSecret).toBe('string');
      expect(response.body.clientSecret.length).toBeGreaterThan(20);
    });

    it('should generate different secret on each rotation', async () => {
      const client = await createOAuthClient('Test Client', ['read:content']);
      const response1 = await api
        .as(admin)
        .post({ path: `/${client.id}/rotate-secret` })
        .expect(200);
      const response2 = await api
        .as(admin)
        .post({ path: `/${client.id}/rotate-secret` })
        .expect(200);
      expect(response1.body.clientSecret).not.toBe(response2.body.clientSecret);
    });
  });

  describe('DELETE /integrations/:id/clients/:clientId', () => {
    it('should soft delete OAuth client as admin', async () => {
      const client = await createOAuthClient('Test Client', ['read:content']);
      await api
        .as(admin)
        .delete({ path: `/${client.id}` })
        .expect(204);
      const listResponse = await api.as(admin).get().expect(200);
      const deletedClient = listResponse.body.data.find(
        (c: any) => c.id === client.id,
      );
      expect(deletedClient).toBeUndefined();
    });

    it('should return 404 for non-existent client', async () => {
      const response = await api
        .as(admin)
        .delete({ path: '/00000000-0000-0000-0000-000000000000' })
        .expect(404);
      expectNotFound(response);
    });
  });

  describe('OAuth Client Validation', () => {
    it('should reject name longer than 255 characters', async () => {
      const longName = 'a'.repeat(256);
      const response = await api
        .as(admin)
        .post({ body: { name: longName, scopes: ['read:content'] } })
        .expect(400);
      expectBadRequest(response);
    });

    it('should accept name with 255 characters', async () => {
      const maxName = 'a'.repeat(255);
      const response = await api
        .as(admin)
        .post({ body: { name: maxName, scopes: ['read:content'] } })
        .expect(201);
      expect(response.body.name).toBe(maxName);
    });

    it('should accept multiple valid scopes', async () => {
      const scopes = ['read:content', 'webhook:publish'];
      const response = await api
        .as(admin)
        .post({ body: { name: 'Multi-scope Client', scopes } })
        .expect(201);
      expect(response.body.allowedScopes).toEqual(
        expect.arrayContaining(scopes),
      );
    });

    it('should reject scopes with empty strings', async () => {
      const response = await api
        .as(admin)
        .post({ body: { name: 'Test', scopes: ['read:content', ''] } })
        .expect(400);
      expectBadRequest(response);
    });

    it('should reject non-array scopes', async () => {
      const response = await api
        .as(admin)
        .post({ body: { name: 'Test', scopes: 'read:content' } })
        .expect(400);
      expectBadRequest(response);
    });

    it('should handle expired client correctly', async () => {
      // This test verifies response format, token tests verify auth denial
      const pastDate = new Date('2020-01-01T00:00:00Z').toISOString();
      const response = await api
        .as(admin)
        .post({
          body: {
            name: 'Expired Client',
            scopes: ['read:content'],
            expiresAt: pastDate,
          },
        })
        .expect(201);
      expect(response.body.isExpired).toBe(true);
      expect(response.body.canAuthenticate).toBe(false);
    });

    it('should handle future expiration correctly', async () => {
      const futureDate = new Date('2030-01-01T00:00:00Z').toISOString();
      const response = await api
        .as(admin)
        .post({
          body: {
            name: 'Future Client',
            scopes: ['read:content'],
            expiresAt: futureDate,
          },
        })
        .expect(201);
      expect(response.body.isExpired).toBe(false);
      expect(response.body.canAuthenticate).toBe(true);
    });
  });

  describe('OAuth Client Scope Security', () => {
    it(
      'should allow creating client with write:users ' +
        '(admin scope for first-party integrations)',
      async () => {
        const response = await api
          .as(admin)
          .post({
            body: { name: 'Admin Scope Client', scopes: ['write:users'] },
          })
          .expect(201);
        expect(response.body.allowedScopes).toEqual(['write:users']);
      },
    );

    it(
      'should allow creating client with delete:users ' +
        '(admin scope for first-party integrations)',
      async () => {
        const response = await api
          .as(admin)
          .post({
            body: { name: 'Delete Scope Client', scopes: ['delete:users'] },
          })
          .expect(201);
        expect(response.body.allowedScopes).toEqual(['delete:users']);
      },
    );

    it(
      'should allow creating client with admin:* wildcard ' +
        'for full control',
      async () => {
        const response = await api
          .as(admin)
          .post({
            body: { name: 'Wildcard Admin Client', scopes: ['admin:*'] },
          })
          .expect(201);
        expect(response.body.allowedScopes).toEqual(['admin:*']);
      },
    );

    it('should allow creating client with non-admin scopes', async () => {
      const response = await api
        .as(admin)
        .post({
          body: {
            name: 'Safe Client',
            scopes: ['read:content', 'webhook:publish'],
          },
        })
        .expect(201);
      expect(response.body.allowedScopes).toEqual(
        expect.arrayContaining(['read:content', 'webhook:publish']),
      );
    });

    it('should allow mixed admin and non-admin scopes', async () => {
      const response = await api
        .as(admin)
        .post({
          body: {
            name: 'Mixed Scope Client',
            scopes: ['read:content', 'write:users'],
          },
        })
        .expect(201);
      expect(response.body.allowedScopes).toEqual(
        expect.arrayContaining(['read:content', 'write:users']),
      );
    });
  });

  describe('OAuth Client Lifecycle', () => {
    it('should initialize with usageCount of 0', async () => {
      const response = await api
        .as(admin)
        .post({ body: { name: 'New Client', scopes: ['read:content'] } })
        .expect(201);
      expect(response.body.usageCount).toBe(0);
      expect(response.body.lastUsedAt).toBeNull();
    });

    it('should be active by default', async () => {
      const response = await api
        .as(admin)
        .post({ body: { name: 'New Client', scopes: ['read:content'] } })
        .expect(201);
      expect(response.body.isActive).toBe(true);
    });

    it('should generate unique clientId', async () => {
      const response1 = await api
        .as(admin)
        .post({ body: { name: 'Client 1', scopes: ['read:content'] } })
        .expect(201);
      const response2 = await api
        .as(admin)
        .post({ body: { name: 'Client 2', scopes: ['read:content'] } })
        .expect(201);
      expect(response1.body.clientId).not.toBe(response2.body.clientId);
      expect(response1.body.clientId).toMatch(/^client_/);
      expect(response2.body.clientId).toMatch(/^client_/);
    });

    it('should not expose clientSecret in GET requests', async () => {
      const createResponse = await api
        .as(admin)
        .post({ body: { name: 'Test Client', scopes: ['read:content'] } })
        .expect(201);
      const clientId = createResponse.body.id;
      const getResponse = await api
        .as(admin)
        .get({ path: `/${clientId}` })
        .expect(200);
      expect(getResponse.body).not.toHaveProperty('clientSecret');
    });
  });

  describe('404 Not Found Handling', () => {
    it('should return 404 for non-existent integration', async () => {
      const invalidApi = new ApiRequest(
        app,
        `${paths.integrations.base}/00000000-0000-0000-0000-000000000000/clients`,
      );
      const response = await invalidApi.as(admin).get().expect(404);
      expectNotFound(response);
    });

    it(
      'should return 404 when creating client for non-existent integration',
      async () => {
        const invalidApi = new ApiRequest(
          app,
          `${paths.integrations.base}/00000000-0000-0000-0000-000000000000/clients`,
        );
        const response = await invalidApi
          .as(admin)
          .post({ body: { name: 'Test', scopes: ['read:content'] } })
          .expect(404);
        expectNotFound(response);
      },
    );

    it(
      'should return 404 when rotating secret for non-existent client',
      async () => {
        const response = await api
          .as(admin)
          .post({ path: '/00000000-0000-0000-0000-000000000000/rotate-secret' })
          .expect(404);
        expectNotFound(response);
      },
    );
  });
});
