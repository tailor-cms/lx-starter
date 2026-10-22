import type { ExpirationConfig } from './interfaces';
import { ExpirationState } from './enums';

// Re-export for convenience
export { type ExpirationConfig, ExpirationState };

export const isString = (val) => typeof val === 'string' || val instanceof String;

/**
 * Deep clone a plain object or array
 * Uses JSON serialization for simplicity and broad compatibility
 * Note: Does not preserve functions, symbols, or circular references
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function cloneDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Processor function type for transforming property values during pick
 */
export type PropertyProcessor<T = any, R = any> = (value: T) => R;

/**
 * Processor tuple: [toJSON processor, fromJSON processor]
 */
export type ProcessorTuple = [PropertyProcessor, PropertyProcessor];

/**
 * Pick configuration - either a simple key or [key, [toJSONProcessor, fromJSONProcessor]]
 */
export type PickConfig<T, K extends keyof T> =
  | K
  | readonly [K, ProcessorTuple];

/**
 * Enhanced pick function that supports both simple keys and key+processor tuples
 *
 * @example
 * Simple pick
 * pick(obj, ['id', 'name'])
 *
 * @example
 * With processors
 * pick(obj, [
 *   'id',
 *   'name',
 *   ['structure', [
 *     (activities) => activities.map(a => a.toJSON()),
 *     (data) => data.map(a => Activity.fromJSON(a))
 *   ]]
 * ], 'toJSON')
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  configs: Array<PickConfig<T, K>>,
  mode: 'toJSON' | 'fromJSON' | 'clone' = 'toJSON',
): any {
  const result: any = {};
  const processorIndex = mode === 'toJSON' ? 0 : 1;

  for (const config of configs) {
    // Handle simple key
    if (typeof config === 'string'
      || typeof config === 'number'
      || typeof config === 'symbol') {
      const key = config as K;
      if (key in obj) {
        result[key] = obj[key];
      }
    } else if (Array.isArray(config)) {
      // Handle [key, [toJSON, fromJSON]] tuple
      const [key, processors] = config;
      if (key in obj) {
        // For clone mode, just copy the value directly (no transformation)
        if (mode === 'clone') {
          result[key] = obj[key];
        } else {
          const processor = processors[processorIndex];
          result[key] = processor(obj[key]);
        }
      }
    }
  }
  return result;
}
