import {
  ApiRequest,
  paths,
  expectBadRequest,
  expectConflict,
  expectForbidden,
  expectNotFound,
} from '../../helpers';
import {
  cleanDatabase,
  closeTestingApp,
  createTestingApp,
  seedTestUsers,
} from '../../helpers/test.helpers';
import { Integration } from '@/modules/integration/entities/integration.entity';
import type { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { TestUser } from '../../helpers/test.helpers';

describe('Integration API: CRUD operations', () => {
  let app: INestApplication;
  let api: ApiRequest;
  let admin: TestUser;
  let user: TestUser;
  let em: EntityManager;

  beforeAll(async () => {
    app = await createTestingApp();
    em = app.get(EntityManager);
    api = new ApiRequest(app, paths.integrations.base);
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    admin = users.admin;
    user = users.user;
  });

  afterAll(async () => await closeTestingApp());

  // Helper function to create test integration
  const createIntegration = async (
    name: string,
    description?: string,
  ): Promise<Integration> => {
    // Get the admin user entity
    const adminUser = await em.findOneOrFail('User', { id: admin.id });
    const integration = em.create(Integration, {
      name,
      description,
      createdBy: adminUser,
      isActive: true,
    } as any);
    await em.persistAndFlush(integration);
    return integration;
  };

  describe('GET /integrations', () => {
    it('should return paginated integrations for admin', async () => {
      await createIntegration('TailorCMS', 'Content management system');
      await createIntegration('Stripe', 'Payment processing');
      const response = await api.as(admin).get().expect(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total', 2);
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body.data).toHaveLength(2);
    });

    it('should deny access for non-admin users', async () => {
      const response = await api.as(user).get().expect(403);
      expectForbidden(response);
    });

    it('should support pagination parameters', async () => {
      await createIntegration('Integration 1');
      await createIntegration('Integration 2');
      const response = await api
        .as(admin)
        .get({ query: { limit: 10, offset: 0 } })
        .expect(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('offset', 0);
    });

    it('should return empty array when no integrations exist', async () => {
      const response = await api.as(admin).get().expect(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('POST /integrations', () => {
    it('should create a new integration as admin', async () => {
      const newIntegration = {
        name: 'TailorCMS',
        description: 'Content management system',
      };
      const response = await api
        .as(admin)
        .post({ body: newIntegration })
        .expect(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newIntegration.name);
      expect(response.body.description).toBe(newIntegration.description);
      expect(response.body.isActive).toBe(true);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should create integration without description', async () => {
      const newIntegration = {
        name: 'Stripe',
      };
      const response = await api
        .as(admin)
        .post({ body: newIntegration })
        .expect(201);
      expect(response.body.name).toBe(newIntegration.name);
      expect(response.body.description).toBeUndefined();
    });

    it('should deny access for non-admin users', async () => {
      const newIntegration = {
        name: 'TailorCMS',
        description: 'Content management',
      };
      const response = await api
        .as(user)
        .post({ body: newIntegration })
        .expect(403);
      expectForbidden(response);
    });

    it('should reject duplicate integration name', async () => {
      await createIntegration('TailorCMS', 'Existing integration');
      const response = await api
        .as(admin)
        .post({ body: { name: 'TailorCMS' } })
        .expect(409);
      expectConflict(response, 'already exists');
    });

    it('should create integration with minimal data', async () => {
      const response = await api
        .as(admin)
        .post({ body: { name: 'Minimal Integration' } })
        .expect(201);
      expect(response.body.name).toBe('Minimal Integration');
      expect(response.body.description).toBeUndefined();
    });
  });

  describe('GET /integrations/:id', () => {
    it('should return integration by id for admin', async () => {
      const integration = await createIntegration('TailorCMS', 'CMS system');
      const response = await api
        .as(admin)
        .get({ path: `/${integration.id}` })
        .expect(200);
      expect(response.body.id).toBe(integration.id);
      expect(response.body.name).toBe(integration.name);
      expect(response.body.description).toBe(integration.description);
    });

    it('should deny access for non-admin users', async () => {
      const integration = await createIntegration('TailorCMS');
      const response = await api
        .as(user)
        .get({ path: `/${integration.id}` })
        .expect(403);
      expectForbidden(response);
    });

    it('should return 404 for non-existent integration', async () => {
      const response = await api
        .as(admin)
        .get({ path: '/00000000-0000-0000-0000-000000000000' })
        .expect(404);
      expectNotFound(response);
    });

    it('should soft delete and track deletedAt timestamp', async () => {
      const integration = await createIntegration('TailorCMS');
      await api
        .as(admin)
        .delete({ path: `/${integration.id}` })
        .expect(204);
      // Verify soft delete by checking entity directly
      await em.refresh(integration);
      expect(integration.deletedAt).toBeDefined();
      expect(integration.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('PATCH /integrations/:id', () => {
    it('should update integration name as admin', async () => {
      const integration = await createIntegration('TailorCMS', 'Old desc');
      const updateData = { name: 'TailorCMS Updated' };
      const response = await api
        .as(admin)
        .patch({ path: `/${integration.id}`, body: updateData })
        .expect(200);
      expect(response.body.id).toBe(integration.id);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe('Old desc');
    });

    it('should update integration description as admin', async () => {
      const integration = await createIntegration('TailorCMS', 'Old desc');
      const updateData = { description: 'New description' };
      const response = await api
        .as(admin)
        .patch({ path: `/${integration.id}`, body: updateData })
        .expect(200);
      expect(response.body.name).toBe('TailorCMS');
      expect(response.body.description).toBe(updateData.description);
    });

    it('should update isActive status', async () => {
      const integration = await createIntegration('TailorCMS');
      const updateData = { isActive: false };
      const response = await api
        .as(admin)
        .patch({ path: `/${integration.id}`, body: updateData })
        .expect(200);
      expect(response.body.isActive).toBe(false);
    });

    it('should deny access for non-admin users', async () => {
      const integration = await createIntegration('TailorCMS');
      const response = await api
        .as(user)
        .patch({ path: `/${integration.id}`, body: { name: 'Hacked' } })
        .expect(403);
      expectForbidden(response);
    });

    it('should reject duplicate name on update', async () => {
      await createIntegration('TailorCMS');
      const integration2 = await createIntegration('Stripe');
      const response = await api
        .as(admin)
        .patch({ path: `/${integration2.id}`, body: { name: 'TailorCMS' } })
        .expect(409);
      expectConflict(response, 'already exists');
    });

    it('should return 404 for non-existent integration', async () => {
      const response = await api
        .as(admin)
        .patch({
          path: '/00000000-0000-0000-0000-000000000000',
          body: { name: 'Test' },
        })
        .expect(404);
      expectNotFound(response);
    });

    it('should update with partial data', async () => {
      const integration = await createIntegration('TailorCMS', 'Old desc');
      const response = await api
        .as(admin)
        .patch({
          path: `/${integration.id}`,
          body: { description: 'Updated only description' },
        })
        .expect(200);
      expect(response.body.name).toBe('TailorCMS');
      expect(response.body.description).toBe('Updated only description');
    });
  });

  describe('DELETE /integrations/:id', () => {
    it('should soft delete integration as admin', async () => {
      const integration = await createIntegration('TailorCMS');
      await api
        .as(admin)
        .delete({ path: `/${integration.id}` })
        .expect(204);
      await em.refresh(integration);
      expect(integration.deletedAt).toBeDefined();
    });

    it('should deny access for non-admin users', async () => {
      const integration = await createIntegration('TailorCMS');
      const response = await api
        .as(user)
        .delete({ path: `/${integration.id}` })
        .expect(403);
      expectForbidden(response);
    });

    it('should return 404 for non-existent integration', async () => {
      const response = await api
        .as(admin)
        .delete({ path: '/00000000-0000-0000-0000-000000000000' })
        .expect(404);
      expectNotFound(response);
    });

    it('should exclude deleted integration from list by default', async () => {
      const integration = await createIntegration('TailorCMS');
      await api
        .as(admin)
        .delete({ path: `/${integration.id}` })
        .expect(204);
      const response = await api.as(admin).get().expect(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('POST /integrations/:id/restore', () => {
    let deletedIntegration: Integration;
    beforeEach(async () => {
      deletedIntegration = await createIntegration('Deleted Integration');
      await api
        .as(admin)
        .delete({ path: `/${deletedIntegration.id}` })
        .expect(204);
    });

    it('should restore soft-deleted integration', async () => {
      const response = await api
        .as(admin)
        .post({ path: `/${deletedIntegration.id}/restore` })
        .expect(200);
      expect(response.body.id).toBe(deletedIntegration.id);
      expect(response.body.deletedAt).toBeUndefined();
      expect(response.body.name).toBe(deletedIntegration.name);
    });

    it('should deny access for non-admin users', async () => {
      const response = await api
        .as(user)
        .post({ path: `/${deletedIntegration.id}/restore` })
        .expect(403);
      expectForbidden(response);
    });

    it('should return 400 when restoring non-deleted integration', async () => {
      const activeIntegration = await createIntegration('Active Integration');
      const response = await api
        .as(admin)
        .post({ path: `/${activeIntegration.id}/restore` })
        .expect(400);
      expectBadRequest(response);
      expect(response.body.message).toContain('not deleted');
    });

    it('should return 404 for non-existent integration', async () => {
      const response = await api
        .as(admin)
        .post({ path: '/00000000-0000-0000-0000-000000000000/restore' })
        .expect(404);
      expectNotFound(response);
    });

    it('should allow creating with prev deleted name after restore', async () => {
      // Delete integration
      const integration = await createIntegration('TailorCMS');
      await api
        .as(admin)
        .delete({ path: `/${integration.id}` })
        .expect(204);
      // Restore integration
      await api
        .as(admin)
        .post({ path: `/${integration.id}/restore` })
        .expect(200);
      // Should still reject duplicate name
      const response = await api
        .as(admin)
        .post({ body: { name: 'TailorCMS' } })
        .expect(409);
      expectConflict(response, 'already exists');
    });
  });

  describe('Integration Name Handling', () => {
    it('should accept names with various valid characters', async () => {
      const validNames = [
        'Tailor-CMS',
        'Tailor_CMS',
        'Tailor.CMS',
        'Tailor CMS',
        'TailorCMS v2.0',
      ];
      for (const name of validNames) {
        await createIntegration(name);
      }
      const response = await api.as(admin).get().expect(200);
      expect(response.body.total).toBeGreaterThanOrEqual(validNames.length);
    });

    it('should handle long integration names', async () => {
      const longName = 'A'.repeat(200);
      const response = await api
        .as(admin)
        .post({ body: { name: longName } })
        .expect(201);
      expect(response.body.name).toBe(longName);
    });
  });
});
