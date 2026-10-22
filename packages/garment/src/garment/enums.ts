export enum GarmentEnv {
  Source = 'sourcePath',
  Snapshot = 'snapshotPath',
}

/**
 * Expiration states for signed/public content
 */
export enum ExpirationState {
  /** Content signatures are still valid */
  FRESH = 'fresh',
  /** Content signatures are approaching expiration (within warning threshold) */
  STALE = 'stale',
  /** Content signatures have expired and need re-signing */
  EXPIRED = 'expired',
  /** Content has never been signed */
  NEVER_SIGNED = 'never_signed',
}
