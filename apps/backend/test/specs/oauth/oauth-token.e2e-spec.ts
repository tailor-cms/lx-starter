import * as jwt from 'jsonwebtoken';
import { ApiRequest, paths } from '../../helpers';
import {
  cleanDatabase,
  closeTestingApp,
  createOAuthClient,
  createTestingApp,
  getEntityManager,
  seedTestUsers,
} from '../../helpers/test.helpers';
import { Integration } from '@/modules/integration/entities/integration.entity';
import type { INestApplication } from '@nestjs/common';
import { OAuthClient } from '@/modules/auth/oauth/entities/oauth-client.entity';
import { randomBytes } from 'node:crypto';
import type { TestUser } from '../../helpers/test.helpers';

describe('OAuth Token API', () => {
  let app: INestApplication;
  let api: ApiRequest;
  let admin: TestUser;
  let integration: Integration;
  let oauthClient: OAuthClient;
  let plainClientSecret: string;

  beforeAll(async () => {
    app = await createTestingApp();
    api = new ApiRequest(app, paths.oauth.token);
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
      description: 'Test integration for OAuth',
      isActive: true,
      createdBy: adminUser,
    } as any);
    await em.persistAndFlush(integration);
    // Create OAuth client with plain secret
    plainClientSecret = `sk_test_${randomBytes(32).toString('hex')}`;
    oauthClient = await createOAuthClient(em, integration, plainClientSecret);
  });

  afterAll(async () => {
    await closeTestingApp();
  });

  describe('POST /oauth/token', () => {
    describe('Valid token generation', () => {
      it('should generate access token with valid client creds (body)',
        async () => {
          const response = await api
            .as(null)
            .post({
              body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: oauthClient.clientId,
                client_secret: plainClientSecret,
              }).toString(),
              set: { 'Content-Type': 'application/x-www-form-urlencoded' },
            })
            .expect(200);
          expect(response.body).toHaveProperty('access_token');
          expect(response.body).toHaveProperty('token_type', 'Bearer');
          expect(response.body).toHaveProperty('expires_in');
          expect(response.body).toHaveProperty('scope');
          expect(typeof response.body.access_token).toBe('string');
          expect(typeof response.body.expires_in).toBe('number');
        });

      it('should generate access token with Basic Auth (RFC 6749)', async () => {
        const credentials = Buffer.from(
          `${oauthClient.clientId}:${plainClientSecret}`,
        ).toString('base64');
        const response = await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
            }).toString(),
            set: {
              'content-type': 'application/x-www-form-urlencoded',
              'authorization': `Basic ${credentials}`,
            },
          })
          .expect(200);
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('token_type', 'Bearer');
        expect(response.body).toHaveProperty('expires_in');
        expect(response.body).toHaveProperty('scope');
      });

      it('should generate access token with Basic Auth and scope in body', async () => {
        const credentials = Buffer.from(
          `${oauthClient.clientId}:${plainClientSecret}`,
        ).toString('base64');
        const response = await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              scope: 'read:users',
            }).toString(),
            set: {
              'content-type': 'application/x-www-form-urlencoded',
              'authorization': `Basic ${credentials}`,
            },
          })
          .expect(200);
        const decoded = jwt.decode(response.body.access_token) as any;
        expect(decoded.scope).toContain('read:users');
      });

      it('should generate token with valid JWT structure', async () => {
        const response = await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(200);

        const decoded = jwt.decode(response.body.access_token, {
          complete: true,
        }) as any;
        expect(decoded).toBeDefined();
        expect(decoded.payload.aud).toBe('oauth:api');
        expect(decoded.payload.sub).toBe(oauthClient.id);
        expect(decoded.payload.scope).toBeDefined();
        expect(decoded.payload.iat).toBeDefined();
        expect(decoded.payload.exp).toBeDefined();
      });

      it('should include requested scopes in token', async () => {
        const response = await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
              scope: 'read:users',
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(200);
        const decoded = jwt.decode(response.body.access_token) as any;
        expect(decoded.scope).toContain('read:users');
      });

      it('should grant all allowed scopes when no scope requested', async () => {
        const response = await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(200);
        const decoded = jwt.decode(response.body.access_token) as any;
        expect(decoded.scope).toContain('read:users');
        expect(decoded.scope).toContain('write:users');
      });
    });

    describe('Invalid credentials', () => {
      it('should reject invalid client_id (request body)', async () => {
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: 'invalid_client_id',
              client_secret: plainClientSecret,
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(404);
      });

      it('should reject invalid client_secret (request body)', async () => {
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
              client_secret: 'wrong_secret',
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(401);
      });

      it('should reject invalid client_id (Basic Auth)', async () => {
        const credentials = Buffer.from(
          `invalid_client_id:${plainClientSecret}`,
        ).toString('base64');
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
            }).toString(),
            set: {
              'content-type': 'application/x-www-form-urlencoded',
              'authorization': `Basic ${credentials}`,
            },
          })
          .expect(404);
      });

      it('should reject invalid client_secret (Basic Auth)', async () => {
        const credentials = Buffer.from(
          `${oauthClient.clientId}:wrong_secret`,
        ).toString('base64');
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
            }).toString(),
            set: {
              'content-type': 'application/x-www-form-urlencoded',
              'authorization': `Basic ${credentials}`,
            },
          })
          .expect(401);
      });

      it('should reject malformed Basic Auth (no colon)', async () => {
        const credentials = Buffer.from('invalid_format').toString('base64');
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
            }).toString(),
            set: {
              'content-type': 'application/x-www-form-urlencoded',
              'authorization': `Basic ${credentials}`,
            },
          })
          .expect(400);
      });

      it('should reject invalid base64 in Basic Auth', async () => {
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
            }).toString(),
            set: {
              'content-type': 'application/x-www-form-urlencoded',
              'authorization': 'Basic !!!invalid-base64!!!',
            },
          })
          .expect(400);
      });

      it('should reject missing client_id (request body)', async () => {
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_secret: plainClientSecret,
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(400);
      });

      it('should reject missing client_secret (request body)', async () => {
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(400);
      });

      it('should reject missing credentials (neither body nor Basic Auth)', async () => {
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(400);
      });
    });

    describe('Client state validation', () => {
      // Note: Related to oauth-clients.crud.e2e-spec.ts:446-476 (expired client tests)
      // This file tests token generation denial, crud tests verify response format
      it('should reject token request for inactive client', async () => {
        const em = getEntityManager();
        oauthClient.isActive = false;
        await em.persistAndFlush(oauthClient);
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(401);
      });

      it('should reject token request for expired client', async () => {
        const em = getEntityManager();
        oauthClient.expiresAt = new Date(Date.now() - 1000);
        await em.persistAndFlush(oauthClient);
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(401);
      });

      it('should reject token request for deleted client', async () => {
        const em = getEntityManager();
        oauthClient.deletedAt = new Date();
        await em.persistAndFlush(oauthClient);
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(404);
      });
    });

    describe('Scope validation', () => {
      it('should reject request for invalid scope format', async () => {
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
              scope: 'invalid_scope',
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(400);
      });

      it('should reject request for unauthorized scope', async () => {
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
              scope: 'delete:users',
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(403);
      });

      it('should allow requesting subset of allowed scopes', async () => {
        const response = await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
              scope: 'read:users',
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(200);
        const decoded = jwt.decode(response.body.access_token) as any;
        expect(decoded.scope).toContain('read:users');
        expect(decoded.scope).not.toContain('write:users');
      });
    });

    describe('Grant type validation', () => {
      it('should reject unsupported grant_type', async () => {
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(400);
      });

      it('should reject missing grant_type', async () => {
        await api
          .as(null)
          .post({
            body: new URLSearchParams({
              client_id: oauthClient.clientId,
              client_secret: plainClientSecret,
            }).toString(),
            set: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .expect(400);
      });
    });
  });
});
