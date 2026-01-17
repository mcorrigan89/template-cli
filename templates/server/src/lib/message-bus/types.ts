import type { z } from 'zod';

/**
 * Event map type - maps event names to their Zod schemas.
 * Users define their own event maps when creating a message bus.
 */
export type EventMap = Record<string, z.ZodType>;

/**
 * Infer the payload type from an event schema.
 */
export type EventPayload<T extends EventMap, K extends keyof T> = z.infer<T[K]>;

/**
 * Event handler function type.
 */
export type EventHandler<T> = (payload: T) => void | Promise<void>;

/**
 * Subscription handle returned when subscribing to events.
 * Call unsubscribe() to stop receiving events.
 */
export interface Subscription {
  unsubscribe: () => void;
}

/**
 * Adapter interface for message bus storage backends.
 * Implement this interface to create custom adapters (Redis, RabbitMQ, etc.)
 */
export interface MessageBusAdapter {
  /**
   * Publish an event with the given payload.
   */
  publish(event: string, payload: unknown): Promise<void>;

  /**
   * Subscribe to an event with a handler function.
   * Returns a Subscription that can be used to unsubscribe.
   */
  subscribe(event: string, handler: (payload: unknown) => void): Subscription;
}
