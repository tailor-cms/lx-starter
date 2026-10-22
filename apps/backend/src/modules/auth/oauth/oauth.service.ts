import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserRole } from '@/database/entities';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PinoLogger } from 'nestjs-pino';
import type { Profile as GoogleProfile } from 'passport-google-oauth20';
import { UserRepository } from '@/modules/user/user.repository';
import { randomBytes } from 'crypto';

export interface GoogleOAuthProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profilePhoto?: string;
  isEmailVerified: boolean;
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
  ) {
    this.logger.setContext(OAuthService.name);
  }

  /**
   * Find or create user from Google OAuth
   * Uses email as the primary identifier
   * Optional: Check domain whitelist
   */
  async findOrCreateUser(googleProfile: GoogleOAuthProfile): Promise<User> {
    const { email } = googleProfile;
    this.logger.debug(`Google OAuth: Finding or creating user for: ${email}`);
    // Optional: Domain whitelist check
    const allowedDomains = this.configService.get<string[]>(
      'oauth.google.allowedDomains',
    );
    if (allowedDomains && allowedDomains.length > 0) {
      const emailDomain = email.split('@')[1];
      if (!allowedDomains.includes(emailDomain)) {
        this.logger.warn(`Domain ${emailDomain} not in whitelist for ${email}`);
        throw new ForbiddenException(
          `Your email domain is not authorized to access this application.`,
        );
      }
    }

    let user = await this.userRepository.findByEmail(email);
    if (user) {
      if (user.isDeleted) {
        this.logger.warn(`Deleted user attempted Google login: ${email}`);
        throw new UnauthorizedException('User account has been deactivated');
      }
      this.logger.debug(`Found existing user: ${email}`);
      // Update user profile info from Google (might have changed)
      this.updateUserFromGoogle(user, googleProfile);
      await this.em.flush();
      return user;
    }

    this.logger.debug(`Creating new user from Google OAuth: ${email}`);
    user = this.createUserFromGoogle(googleProfile);
    await this.em.persistAndFlush(user);
    this.logger.info(`Created new user via Google OAuth: ${user.email}`);
    return user;
  }

  /**
   * Create user entity from Google profile
   * Generate random password for OAuth users (they won't use it)
   */
  private createUserFromGoogle(profile: GoogleOAuthProfile): User {
    const user = new User();
    user.email = profile.email;
    user.firstName = profile.firstName;
    user.lastName = profile.lastName;
    user.imgUrl = profile.profilePhoto;
    // OAuth users get a random secure password (they won't use it)
    // This satisfies the NOT NULL constraint while preventing password login
    user.password = this.generateSecureRandomPassword();
    // Default role is USER
    user.role = UserRole.USER;
    return user;
  }

  parseGoogleProfile(profile: GoogleProfile): GoogleOAuthProfile {
    const email = profile.emails?.[0]?.value;
    const isEmailVerified = profile.emails?.[0]?.verified ?? true;
    if (!email) throw new UnauthorizedException('Email not provided by Google');
    const displayName = profile.displayName || '';
    const nameParts = displayName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const profilePhoto = profile.photos?.[0]?.value;
    return {
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      displayName,
      profilePhoto,
      isEmailVerified,
    };
  }

  private updateUserFromGoogle(user: User, profile: GoogleOAuthProfile): void {
    if (profile.firstName) user.firstName = profile.firstName;
    if (profile.lastName) user.lastName = profile.lastName;
    if (profile.profilePhoto) user.imgUrl = profile.profilePhoto;
  }

  private generateSecureRandomPassword(): string {
    return randomBytes(32).toString('hex');
  }
}
