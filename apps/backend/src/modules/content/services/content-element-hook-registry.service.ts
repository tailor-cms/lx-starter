import camelCase from 'lodash/camelCase';
import type { ContentElementHooks } from '../interfaces';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class ContentElementHookRegistry {
  private config: Record<string, any> = {};
  private hooks = new Map<string, ContentElementHooks>();

  constructor(private logger: PinoLogger) {
    this.logger.setContext(ContentElementHookRegistry.name);
    try {
      this.loadCeConfiguration();
      this.registerInstalledElements();
    } catch (err) {
      this.logger.error(`Failed to initialize registry: ${err.message}`);
    }
  }

  /**
   * Process all TCE_* environment variables
   * Convention: TCE_{KEY} where KEY is transformed to camelCase
   * Example: TCE_MUX_VIDEO_TOKEN_ID=xxx → { muxVideoTokenId: 'xxx' }
   * Following Content Element Kit standard
   */
  private loadCeConfiguration(): void {
    const env = process.env;
    const tcePrefix = 'TCE_';
    Object.keys(env)
      .filter((key) => key.startsWith(tcePrefix))
      .forEach((key) => {
        // Remove 'TCE_' prefix and convert to camelCase
        const withoutPrefix = key.slice(tcePrefix.length);
        const camelCaseKey = camelCase(withoutPrefix);
        this.config[camelCaseKey] = env[key];
        this.logger.debug(`Loaded TCE config: ${camelCaseKey}`);
      });
    const configCount = Object.keys(this.config).length;
    if (configCount > 0) {
      this.logger.info(`Loaded TCE config with ${configCount} variables`);
    }
  }

  /**
   * Register installed content element packages
   * Static list of installed packages - add new packages here when installed
   */
  private async registerInstalledElements(): Promise<void> {
    // List of installed content element packages
    // Add new packages here when installed via pnpm
    const installedPackages = [
      {
        type: 'MUX_VIDEO',
        package: '@tailor-cms/ce-mux-video-server',
      },
    ];
    if (installedPackages.length === 0) {
      this.logger.info('No content element packages configured');
      return;
    }
    this.logger.info(`Registering ${installedPackages.length} packages`);
    for (const { type, package: packageName } of installedPackages) {
      try {
        const hooks = await import(packageName);
        this.registerHooks(type, hooks);
        this.logger.info(`Registered CE hooks: ${type} (${packageName})`);
      } catch (err) {
        this.logger.warn(
          `Failed to load CE hooks for ${type} (${packageName}): ${err.message}`,
        );
      }
    }
  }

  /**
   * Register hooks for a specific element type
   */
  registerHooks(elementType: string, hooks: ContentElementHooks): void {
    this.hooks.set(elementType, hooks);
    this.logger.debug(`Hooks registered for element type: ${elementType}`);
  }

  /**
   * Get hooks for a specific element type (used by Garment)
   */
  getFetchHooks(type: string): ContentElementHooks | null {
    const hooks = this.hooks.get(type);
    if (!hooks) {
      this.logger.debug(`No hooks registered for element type: ${type}`);
      return null;
    }
    // Get TCE config to inject into services/context
    const config = this.config;
    return {
      afterLoaded: hooks.afterLoaded
        ? async (element, services) => {
          const tce = { ...config };
          const enhancedServices = { ...services, config: { tce } };
          return hooks.afterLoaded!(element, enhancedServices, 'delivery');
        }
        : undefined,
    };
  }
}
