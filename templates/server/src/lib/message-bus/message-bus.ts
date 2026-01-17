import type {
  EventHandler,
  EventMap,
  EventPayload,
  MessageBusAdapter,
  Subscription,
} from './types.ts';

/**
 * Type-safe message bus for publishing and subscribing to events.
 *
 * The bus is generic over an EventMap that defines all valid events
 * and their payload schemas. TypeScript will enforce that:
 * - Only defined event names can be published/subscribed
 * - Payloads match their Zod schemas
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { MessageBus, InMemoryAdapter } from '@/lib/message-bus';
 *
 * const events = {
 *   'user.created': z.object({ userId: z.string(), email: z.string() }),
 *   'user.deleted': z.object({ userId: z.string() }),
 * } as const;
 *
 * const bus = new MessageBus(events, new InMemoryAdapter());
 *
 * // TypeScript knows the payload shape
 * bus.subscribe('user.created', (payload) => {
 *   console.log(payload.email); // string
 * });
 *
 * // TypeScript enforces correct payload
 * await bus.publish('user.created', { userId: '123', email: 'test@example.com' });
 * ```
 */
export class MessageBus<T extends EventMap> {
  constructor(
    private readonly events: T,
    private readonly adapter: MessageBusAdapter
  ) {}

  /**
   * Publish an event with the given payload.
   * The payload is validated against the event's Zod schema.
   *
   * @param event - The event name (must be a key in the EventMap)
   * @param payload - The event payload (must match the event's schema)
   */
  async publish<K extends keyof T & string>(event: K, payload: EventPayload<T, K>): Promise<void> {
    const schema = this.events[event];
    if (!schema) {
      throw new Error(`Unknown event: ${event}`);
    }

    // Validate payload against schema
    const result = schema.safeParse(payload);
    if (!result.success) {
      throw new Error(`Invalid payload for event "${event}": ${result.error.message}`);
    }

    await this.adapter.publish(event, result.data);
  }

  /**
   * Subscribe to an event with a handler function.
   *
   * @param event - The event name (must be a key in the EventMap)
   * @param handler - Function called when the event is published
   * @returns A Subscription that can be used to unsubscribe
   */
  subscribe<K extends keyof T & string>(
    event: K,
    handler: EventHandler<EventPayload<T, K>>
  ): Subscription {
    const schema = this.events[event];
    if (!schema) {
      throw new Error(`Unknown event: ${event}`);
    }

    // Wrap handler to validate incoming payloads
    const wrappedHandler = (payload: unknown) => {
      const result = schema.safeParse(payload);
      if (!result.success) {
        console.error(`Invalid payload received for event "${event}":`, result.error.message);
        return;
      }
      void handler(result.data as EventPayload<T, K>);
    };

    return this.adapter.subscribe(event, wrappedHandler);
  }
}
