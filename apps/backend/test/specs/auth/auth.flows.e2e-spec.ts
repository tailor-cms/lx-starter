import { INestApplication } from '@nestjs/common';
import {
  AuthClient,
  TestUser,
  cleanDatabase,
  closeTestingApp,
  createTestingApp,
  createTestUser,
  getConfigService,
  getJwtService,
  seedTestUsers,
} from '../../helpers/test.helpers';
import {
  createResetToken,
  generateValidPassword,
  mockMailService,
} from '../../helpers/auth.spec.helpers';

describe('AuthController - Integration flows', () => {
  let app: INestApplication;
  let authClient: AuthClient;
  let user: TestUser;

  beforeAll(async () => {
    app = await createTestingApp();
    authClient = new AuthClient(app);
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    user = users.user;
    authClient.resetSession();

    // Reset mail service mock
    mockMailService.sendPasswordResetEmail.mockClear();
    mockMailService.sendInvitationEmail.mockClear();
  });

  afterAll(async () => {
    await closeTestingApp();
  });

  describe('Complete authentication flow', () => {
    it('should handle full login-logout cycle', async () => {
      // 1. Login
      const loginResponse = await authClient.login(user.email, user.password);
      authClient.validateLoginResponse(loginResponse);
      // 2. Access protected endpoint
      const meResponse = await authClient.get('/api/me');
      expect(meResponse.status).toBe(200);
      expect(meResponse.body.email).toBe(user.email);
      // 3. Change password
      const newPassword = generateValidPassword();
      await authClient.auth.changePassword(user.password, newPassword);
      // 4. Logout
      await authClient.auth.logout();
      // 5. Login with new password
      const newLoginResponse = await authClient.login(user.email, newPassword);
      expect(newLoginResponse.user.email).toBe(user.email);
    });

    it('should handle concurrent sessions', async () => {
      // This test verifies that multiple cookie-based sessions work independently
      // by creating separate AuthClient instances that maintain their own cookies
      const clients = [
        new AuthClient(app),
        new AuthClient(app),
        new AuthClient(app),
      ];

      // Each client logs in and gets its own cookie
      const sessions = await Promise.all(
        clients.map((client) => client.login(user.email, user.password)),
      );
      sessions.forEach((session) => authClient.validateLoginResponse(session));

      // Each client should be able to access protected endpoints with its own cookie
      for (const client of clients) {
        const response = await client.get('/api/me');
        expect(response.status).toBe(200);
        expect(response.body.email).toBe(user.email);
      }
    });
  });

  describe('Password reset flow', () => {
    it('should complete full password reset cycle', async () => {
      const testUser = await createTestUser({
        email: 'resetflow@test.com',
        password: 'OldPassword123!',
      });
      // 1. Request password reset
      await authClient.auth.forgotPassword(testUser.email);
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      // 2. Get token from email (simulated)
      const configService = getConfigService();
      const jwtService = getJwtService();
      const resetToken = await createResetToken(
        testUser,
        jwtService,
        configService,
      );
      // 3. Validate token
      await authClient.auth.validateResetToken(resetToken);
      // 4. Reset password
      const newPassword = generateValidPassword();
      await authClient.auth.resetPassword(resetToken, newPassword);
      // 5. Login with new password
      const loginResponse = await authClient.login(testUser.email, newPassword);
      expect(loginResponse.user.email).toBe(testUser.email);
      // 6. Old password should not work
      await authClient.login(testUser.email, 'OldPassword123!', 401);
    });
  });
});
