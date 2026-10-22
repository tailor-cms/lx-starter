import type { GarmentEnv } from './enums';
import type { LoggerConfig } from './logger';

export type FileKey = 'id' | 'uid';
export type FileKeyType = number | string;

export interface GarmentConfig {
  [GarmentEnv.Source]: string;
  [GarmentEnv.Snapshot]: string;
  fileKeyProp: FileKey;
  logger?: LoggerConfig;
}

export interface EntityProcessorContext {
  env: GarmentEnv;
  config: GarmentConfig;
}

/**
 * Configuration for expiration thresholds
 */
export interface ExpirationConfig {
  /** Time until expiration when content is considered stale (in milliseconds) */
  staleThreshold: number;
  /** Total time until content expires (in milliseconds) */
  expirationTime: number;
}

/**
 * Entity state change events
 */
export enum EntityEvent {
  /** Emitted when entity is loaded */
  LOADED = 'loaded',
  /** Emitted when entity is signed (makePublic called) */
  SIGNED = 'signed',
  /** Emitted when entity becomes dirty (state changed) */
  DIRTY = 'dirty',
}

/**
 * Event data for state changes
 */
export interface EntityEventData {
  /** Entity UID */
  uid: string;
  /** Event-specific data */
  [key: string]: any;
}

/**
 * Repository access control data
 */
export interface RepositoryAccessUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  /** Direct repository role (ADMIN or AUTHOR) */
  role: string;
  /** When user was assigned directly to repository */
  assignedAt: string;
}

export interface RepositoryAccessGroupMember {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  /** User's role within this group */
  role: string;
}

export interface RepositoryAccessGroup {
  id: number;
  name: string;
  logoUrl: string | null;
  /** Users who are members of this group */
  members: RepositoryAccessGroupMember[];
}

export interface RepositoryAccessData {
  // Repository ID
  id: number;
  uid: string;
  users: RepositoryAccessUser[];
  groups: RepositoryAccessGroup[];
  updatedAt: string;
}
