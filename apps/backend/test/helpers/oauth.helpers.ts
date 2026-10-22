import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Integration } from '@/modules/integration/entities/integration.entity';
import { OAuthClient } from '@/modules/auth/oauth/entities/oauth-client.entity';
import { ApiRequest } from '../helpers';

/**
 * Helper to create OAuth client with hashed secret for testing
 */
export async function createOAuthClient(
  em: any,
  integration: Integration,
  plainSecret: string,
  scopes: string[] = ['read:users', 'write:users'],
  options: {
    name?: string;
    description?: string;
    allowedGrantTypes?: string[];
    isActive?: boolean;
  } = {},
): Promise<OAuthClient> {
  const hashedSecret = bcrypt.hashSync(plainSecret, 10);
  const client = em.create(OAuthClient, {
    clientId: `client_${randomBytes(16).toString('hex')}`,
    clientSecret: hashedSecret,
    name: options.name || 'Test OAuth Client',
    description: options.description || 'Test client for OAuth',
    ownerType: 'INTEGRATION',
    ownerIntegration: integration,
    allowedScopes: scopes,
    allowedGrantTypes: options.allowedGrantTypes || ['client_credentials'],
    isActive: options.isActive ?? true,
  } as any);
  await em.persistAndFlush(client);
  return client;
}

/**
 * Helper to get OAuth access token for testing
 */
export async function getAccessToken(
  api: ApiRequest,
  clientId: string,
  clientSecret: string,
  scope?: string,
): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  if (scope) {
    params.append('scope', scope);
  }
  const response = await api
    .as(null)
    .post({
      body: params.toString(),
      set: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .expect(200);

  return response.body.access_token;
}
