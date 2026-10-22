/**
 * Event handler function type
 */
export type EventHandler<T = any> = (data: T) => void;

/**
 * Lightweight event emitter for entity state changes
 * Supports basic pub/sub pattern for internal event handling
 */
export class EventEmitter {
  private listeners: Map<string, Set<EventHandler>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param handler - Event handler function to remove
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Subscribe to an event for one-time execution
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  once(event: string, handler: EventHandler): () => void {
    const wrapper: EventHandler = (data) => {
      handler(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * Emit an event
   * @param event - Event name
   * @param data - Event data
   */
  emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * Remove all listeners for an event or all events
   * @param event - Event name (optional, removes all if not specified)
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event
   * @param event - Event name
   * @returns Number of listeners
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
