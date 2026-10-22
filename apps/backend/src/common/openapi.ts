import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

export function generateOpenApiDocument(app: INestApplication) {
  const apiDocConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health', 'Health-check endpoints')
    .addTag('auth', 'User auth endpoints')
    .addTag('oauth', 'OAuth endpoints for 3rd party integrations')
    .addTag('oidc', 'OpenID Connect endpoints')
    .addTag('me', 'Current user profile endpoints')
    .addTag('content', 'Tailor CMS content delivery endpoints')
    .addTag('learning', 'Onboarding, activity tracking, and recommendations')
    .addTag('scenario', 'AI-powered role-play scenarios for learning')
    .addTag('users', 'User management endpoints')
    .addTag('integrations', 'Create and manage api consumers')
    .addTag('webhooks', 'Content webhook endpoints')
    .addTag('seed', 'Database seeding endpoints (non-production only)')
    .build();

  const document = SwaggerModule.createDocument(app, apiDocConfig, {
    operationIdFactory: (ctrl: string, method: string) => {
      return `${ctrl.replaceAll('Controller', '')}_${method}`;
    },
  });
  // Sort operations by x-order extension
  sortOperationsByOrder(document);
  return document;
}

function sortOperationsByOrder(document: any) {
  const paths = document.paths;
  if (!paths) return;

  // Group operations by tag
  const tagOps: Record<
    string,
    Array<{ path: string; method: string; order: number }>
  > = {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods as Record<string, any>)) {
      const tags = op.tags || ['default'];
      const order = op['x-order'] ?? 999;
      for (const tag of tags) {
        if (!tagOps[tag]) tagOps[tag] = [];
        tagOps[tag].push({ path, method, order });
      }
    }
  }

  // Sort each tag's operations and rebuild paths in order
  const sortedPaths: Record<string, any> = {};
  const processedPaths = new Set<string>();

  for (const tag of Object.keys(tagOps)) {
    tagOps[tag].sort((a, b) => a.order - b.order);
    for (const { path, method } of tagOps[tag]) {
      if (!sortedPaths[path]) sortedPaths[path] = {};
      sortedPaths[path][method] = paths[path][method];
      processedPaths.add(path);
    }
  }

  // Add any remaining paths not in tags
  for (const path of Object.keys(paths)) {
    if (!processedPaths.has(path)) {
      sortedPaths[path] = paths[path];
    }
  }

  document.paths = sortedPaths;
}

export function saveOpenApiSpec(document: any) {
  const openApiPath = join(process.cwd(), 'openapi.json');
  try {
    writeFileSync(openApiPath, JSON.stringify(document, null, 2));
    console.log(`📄 OpenAPI spec saved to: ${openApiPath}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Could not save OpenAPI spec to file:`, error.message);
    return false;
  }
}
