import chalk from 'chalk';

// Handle both ESM and CJS chalk imports
const chalkInstance = (chalk as any).default || chalk;

/**
 * Standard logger interface compatible with console, pino, winston, etc.
 */
export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

/**
 * Log level for filtering messages
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /**
   * Custom logger instance (defaults to console)
   */
  logger?: Logger;

  /**
   * Enable/disable colored output (defaults to true)
   */
  colors?: boolean;

  /**
   * Minimum log level to output (defaults to 'error')
   * Use 'debug' to enable full telemetry output
   */
  logLevel?: LogLevel;

  /**
   * Enable/disable logging entirely (defaults to false - logging enabled)
   */
  silent?: boolean;

  /**
   * Enable/disable telemetry (performance metrics, timing, counts)
   * When disabled, only basic operation status is logged
   * Defaults to true (telemetry enabled)
   */
  telemetry?: boolean;
}

/**
 * Log level hierarchy for filtering
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Operation icons for visual clarity
 */
const ICONS = {
  loading: '⏳',
  success: '✓',
  info: '→',
  warning: '⚠',
  error: '✗',
  debug: '🔍',
} as const;

/**
 * GarmentLogger - Wrapper around custom or default logger with colorization
 */
export class GarmentLogger implements Logger {
  private logger: Logger;
  private colors: boolean;
  private minLevel: number;
  private silent: boolean;
  private telemetry: boolean;
  private scope: string | null;

  constructor(config: LoggerConfig = {}) {
    this.logger = config.logger || console;
    this.colors = config.colors ?? true;
    // Default to 'error' - only show errors unless debug enabled
    this.minLevel = LOG_LEVELS[config.logLevel || 'error'];
    this.silent = config.silent ?? false;
    this.telemetry = config.telemetry ?? true;
    this.scope = null;
  }

  /**
   * Create a scoped logger that prefixes all messages with a context tag
   * Shares the same configuration (level, colors, silent, telemetry) as the parent
   * @param name - Scope name (e.g., 'MetadataGenerator', 'SurveyGenerator')
   * @returns New GarmentLogger instance with scoped prefix
   *
   * @example
   * const log = logger.scoped('MetadataGenerator');
   * log.debug('extracted 500 chars'); // [MetadataGenerator] 🔍 extracted 500 chars
   * log.warn('0 tags generated');     // [MetadataGenerator] ⚠ 0 tags generated
   */
  scoped(name: string): GarmentLogger {
    const scoped = new GarmentLogger();
    scoped.logger = this.logger;
    scoped.colors = this.colors;
    scoped.minLevel = this.minLevel;
    scoped.silent = this.silent;
    scoped.telemetry = this.telemetry;
    scoped.scope = this.scope ? `${this.scope}:${name}` : name;
    return scoped;
  }

  /**
   * Check if telemetry is enabled
   */
  get isTelemetryEnabled(): boolean {
    return this.telemetry;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.silent)
      return false;
    return LOG_LEVELS[level] >= this.minLevel;
  }

  /**
   * Format entity context prefix
   * @param entity - Entity name (e.g., 'TailorContent', 'Repository:123')
   */
  private formatContext(entity: string): string {
    if (!this.colors)
      return `[${entity}]`;
    return chalkInstance.dim(`[${chalkInstance.bold(entity)}]`);
  }

  /**
   * Format message with icon and color
   */
  private formatMessage(
    icon: string,
    message: string,
    color?: (str: string) => string,
  ): string {
    if (!this.colors) {
      return `${icon} ${message}`;
    }
    const coloredIcon = color ? color(icon) : icon;
    const coloredMessage = color ? color(message) : message;
    return `${coloredIcon} ${coloredMessage}`;
  }

  /**
   * Prepend scope context to a message when scope is set
   */
  private prefixScope(message: string): string {
    if (!this.scope) return message;
    const context = this.formatContext(this.scope);
    return `${context} ${message}`;
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug'))
      return;
    const formatted = this.colors
      ? `${chalkInstance.dim(ICONS.debug)} ${chalkInstance.cyan(message)}`
      : `${ICONS.debug} ${message}`;
    this.logger.debug(this.prefixScope(formatted), ...args);
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info'))
      return;
    const formatted = this.colors
      ? chalkInstance.cyan(`${ICONS.info} ${message}`)
      : `${ICONS.info} ${message}`;
    this.logger.info(this.prefixScope(formatted), ...args);
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn'))
      return;
    const formatted = this.colors
      ? chalkInstance.yellow(`${ICONS.warning} ${message}`)
      : `${ICONS.warning} ${message}`;
    this.logger.warn(this.prefixScope(formatted), ...args);
  }

  /**
   * Log error message
   */
  error(message: string, ...args: any[]): void {
    if (!this.shouldLog('error'))
      return;
    const formatted = this.colors
      ? chalkInstance.red(`${ICONS.error} ${message}`)
      : `${ICONS.error} ${message}`;
    this.logger.error(this.prefixScope(formatted), ...args);
  }

  /**
   * Log operation start (loading)
   */
  loading(entity: string, operation: string): void {
    if (!this.shouldLog('info'))
      return;
    const context = this.formatContext(entity);
    const message = this.formatMessage(
      ICONS.loading,
      operation,
      this.colors ? chalkInstance.cyan : undefined,
    );
    this.logger.info(`${context} ${message}`);
  }

  /**
   * Log operation success
   */
  success(entity: string, operation: string, details?: string): void {
    if (!this.shouldLog('info'))
      return;
    const context = this.formatContext(entity);
    const msg = details
      ? `${operation} ${chalkInstance.dim(`(${details})`)}`
      : operation;
    const message = this.formatMessage(
      ICONS.success,
      msg,
      this.colors ? chalkInstance.green : undefined,
    );
    this.logger.info(`${context} ${message}`);
  }

  /**
   * Log operation progress/info
   */
  progress(entity: string, message: string): void {
    if (!this.shouldLog('info'))
      return;
    const context = this.formatContext(entity);
    const formatted = this.formatMessage(
      ICONS.info,
      message,
      this.colors ? chalkInstance.blue : undefined,
    );
    this.logger.info(`${context} ${formatted}`);
  }

  /**
   * Log operation warning
   */
  operationWarn(entity: string, message: string): void {
    if (!this.shouldLog('warn'))
      return;
    const context = this.formatContext(entity);
    const formatted = this.formatMessage(
      ICONS.warning,
      message,
      this.colors ? chalkInstance.yellow : undefined,
    );
    this.logger.warn(`${context} ${formatted}`);
  }

  /**
   * Log operation error
   */
  operationError(entity: string, message: string, error?: Error): void {
    if (!this.shouldLog('error'))
      return;
    const context = this.formatContext(entity);
    const formatted = this.formatMessage(
      ICONS.error,
      message,
      this.colors ? chalkInstance.red : undefined,
    );
    if (error) {
      this.logger.error(`${context} ${formatted}`, error);
    } else {
      this.logger.error(`${context} ${formatted}`);
    }
  }

  /**
   * Log debug-level operation
   */
  debugOperation(entity: string, message: string): void {
    if (!this.shouldLog('debug'))
      return;
    const context = this.formatContext(entity);
    const formatted = this.colors
      ? chalkInstance.dim(`${ICONS.debug} ${message}`)
      : `${ICONS.debug} ${message}`;
    this.logger.debug(`${context} ${formatted}`);
  }

  /**
   * Format duration for display
   */
  formatDuration(ms: number): string {
    if (ms < 1000)
      return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Format file size for display
   */
  formatSize(bytes: number): string {
    if (bytes < 1024)
      return `${bytes}B`;
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /**
   * Format number with separators
   */
  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}

/**
 * Default logger instance (no-op until configured)
 */
export const defaultLogger = new GarmentLogger({ silent: true });
