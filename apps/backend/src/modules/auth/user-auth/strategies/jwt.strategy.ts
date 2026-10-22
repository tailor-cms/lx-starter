import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { User } from '@/database/entities';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
  ) {
    const jwtSecret = configService.get<string>('auth.jwt.secret');
    if (!jwtSecret) {
      throw new Error('JWT secret is not configured');
    }
    // Only extract from cookies - Bearer tokens handled by OAuthJwtStrategy
    super({
      jwtFromRequest: (req: Request) => {
        const { cookies, signedCookies } = req || {};
        return cookies?.access_token || signedCookies?.access_token || null;
      },
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // Reject OAuth tokens - they should use oauth-jwt strategy
    if (payload.aud === 'oauth:api') {
      throw new UnauthorizedException('Invalid user token');
    }
    const user = await this.userRepository.findOne(
      { id: payload.sub, email: payload.email },
      { populate: false, refresh: true },
    );
    if (!user) throw new UnauthorizedException('User not found');
    if (user.isDeleted)
      throw new UnauthorizedException('User account has been deactivated');
    return user;
  }
}
