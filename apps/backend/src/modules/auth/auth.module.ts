import {
  AuthenticationGuard,
  GoogleOAuthGuard,
  RolesGuard,
} from './common/guards';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module, forwardRef } from '@nestjs/common';
import {
  GoogleStrategy,
  JwtStrategy,
  LocalStrategy,
  OAuthJwtStrategy,
} from './user-auth/strategies';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './user-auth/auth.controller';
import { AuthService } from './user-auth/auth.service';
import { IntegrationModule } from '../integration/integration.module';
import { IntegrationOAuthClientsController } from './oauth/oauth-clients.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import ms from 'ms';
import { OAuthClient } from './oauth/entities/oauth-client.entity';
import { OAuthClientService } from './oauth/oauth-client.service';
import { OAuthService } from './oauth/oauth.service';
import { OAuthScopesGuard } from './oauth/guards/oauth-scopes.guard';
import { OAuthTokenController } from './oauth/oauth-token.controller';
import { OAuthTokenService } from './oauth/oauth-token.service';
import { OidcController } from './oidc/oidc.controller';
import { PassportModule } from '@nestjs/passport';
import { User } from '@/database/entities';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    IntegrationModule,
    MailModule,
    MikroOrmModule.forFeature([User, OAuthClient]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwt.secret'),
        signOptions: {
          expiresIn: ms(configService.get<number>('auth.jwt.expiresInMs')),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController,
    IntegrationOAuthClientsController,
    OidcController,
    OAuthTokenController,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    OAuthJwtStrategy,
    GoogleStrategy,
    GoogleOAuthGuard,
    OAuthClientService,
    OAuthService,
    OAuthTokenService,
    // All routes protected by default & global access control
    // AuthenticationGuard:
    //  User JWT (cookies/bearer) OR
    //  OAuth JWT (bearer with aud:oauth:api)
    // RolesGuard: Role-based access control for users
    // OAuthScopesGuard: Scope-based access control for OAuth clients
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: OAuthScopesGuard },
  ],
  exports: [AuthService, OAuthService, OAuthClientService, OAuthTokenService],
})
export class AuthModule {}
