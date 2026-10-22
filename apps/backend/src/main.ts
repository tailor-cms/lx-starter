// Sentry must be imported FIRST, before any other modules
import './sentry';

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { NestFactory, Reflector } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { generateOpenApiDocument, saveOpenApiSpec } from './common/openapi';
import { swaggerCustomCss, swaggerCustomJs } from './common/swagger-theme';
import { MikroORM } from '@mikro-orm/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import history from 'connect-history-api-fallback';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  if (config.get<boolean>('database.autoMigrations')) {
    console.log('🔄 Running database migrations...');
    const orm = app.get(MikroORM);
    const migrator = orm.getMigrator();
    await migrator.up();
    console.log('✅ Database migrations completed');
  }

  const reflector = app.get(Reflector);
  app.useLogger(app.get(Logger));
  app.use(cookieParser(config.get<string>('auth.jwt.secret')));
  app.use(helmet({ contentSecurityPolicy: false }));
  // SPA Client-Side Routing Fallback
  // ─────────────────────────────────────────────────────────────────────────
  // Problem: When users refresh or directly navigate to SPA routes like
  // /courses/abc/modules/xyz, the server returns 404 because no static file
  // exists at that path.
  //
  // Solution: Use connect-history-api-fallback to rewrite non-API, non-file
  // requests to /index.html, allowing Vue Router to handle client-side routing.
  //
  // Note: @nestjs/serve-static's renderPath option doesn't work reliably with
  // Express 5 / path-to-regexp 8 due to breaking changes in wildcard syntax.
  // ─────────────────────────────────────────────────────────────────────────
  app.use(
    history({
      index: '/index.html',
      rewrites: [
        // Preserve API routes - let NestJS handle them
        { from: /^\/api\/.*$/, to: (context) => context.parsedUrl.path! },
      ],
    }),
  );
  app.enableCors({
    origin: config.get<string[]>('corsAllowedOrigins'),
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      validateCustomDecorators: true,
    }),
  );
  app.useGlobalInterceptors(
    app.get(LoggingInterceptor),
    new ClassSerializerInterceptor(reflector, {
      excludeExtraneousValues: false,
      enableImplicitConversion: false,
      strategy: 'exposeAll',
    }),
    new ResponseInterceptor(reflector),
  );
  // Registered in reverse order of execution
  // Order: Most specific → Most general
  app.useGlobalFilters(
    app.get(AllExceptionsFilter), // 4th: Catch-all for non-HTTP exceptions
    app.get(HttpExceptionFilter), // 3rd: General HTTP exceptions
    app.get(ValidationExceptionFilter), // 2nd: BadRequestException (validation)
    app.get(ThrottlerExceptionFilter), // 1st: ThrottlerException
  );

  // Enable Swagger documentation
  const document = generateOpenApiDocument(app);
  // for offline access and build-time client generation
  if (!config.get<string>('isProduction')) saveOpenApiSpec(document);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'LX API Console',
    customCss: swaggerCustomCss,
    customJsStr: swaggerCustomJs,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });
  // Set config cookie for all non-API routes
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      const configCookie = JSON.stringify(
        Object.fromEntries(
          Object.entries(process.env).filter(([key]) =>
            key.startsWith('NUXT_PUBLIC_'),
          ),
        ),
      );
      res.cookie('config', configCookie);
    }
    next();
  });
  const port = config.get<number>('port') as number;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
