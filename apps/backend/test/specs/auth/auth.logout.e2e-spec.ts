import { INestApplication } from '@nestjs/common';
import {
  AuthClient,
  TestUser,
  cleanDatabase,
  closeTestingApp,
  createTestingApp,
  seedTestUsers,
} from '../../helpers/test.helpers';

describe('Auth logout', () => {
  let app: INestApplication;
  let apiClient: AuthClient;
  let user: TestUser;

  const fetchAuthenticatedUser = (expectedStatus = 200) =>
    apiClient.get('/api/me', { expectedStatus });

  beforeAll(async () => {
    app = await createTestingApp();
    apiClient = new AuthClient(app);
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    user = users.user;
    apiClient.resetSession();
  });

  afterAll(async () => {
    await closeTestingApp();
  });

  describe('GET /auth/logout - session termination', () => {
    it('should return 401 if user is not signed in', async () => {
      await apiClient.auth.logout(401);
    });

    it('should logout authenticated user', async () => {
      await apiClient.login(user.email, user.password);
      await fetchAuthenticatedUser(200);
      await apiClient.auth.logout(200);
      await fetchAuthenticatedUser(401);
    });

    it('should handle multiple logout attempts gracefully', async () => {
      await apiClient.login(user.email, user.password);
      await apiClient.auth.logout(200);
      await apiClient.auth.logout(401);
    });
  });
});
