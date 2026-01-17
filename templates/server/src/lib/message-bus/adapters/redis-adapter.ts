import type { MessageBusAdapter, Subscription } from '../types.ts';

/**
 * Redis client interface - implement this or use a compatible Redis client.
 */
export interface RedisClient {
  publish(channel: string, message: string): Promise<void>;
  subscribe(channel: string, handler: (message: string) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
}

/**
 * Redis message bus adapter for distributed pub/sub across multiple instances.
 *
 * Requires a Redis client to be provided.
 * Events are serialized as JSON.
 *
 * @example
 * ```typescript
 * import { createClient } from 'redis';
 *
 * const redis = createClient({ url: process.env.REDIS_URL });
 * await redis.connect();
 *
 * // Wrap redis client to match RedisClient interface
 * const client: RedisClient = {
 *   async publish(channel, message) {
 *     await redis.publish(channel, message);
 *   },
 *   async subscribe(channel, handler) {
 *     const subscriber = redis.duplicate();
 *     await subscriber.connect();
 *     await subscriber.subscribe(channel, handler);
 *   },
 *   async unsubscribe(channel) {
 *     await redis.unsubscribe(channel);
 *   },
 * };
 *
 * const adapter = new RedisAdapter(client, 'myapp:events:');
 * ```
 */
export class RedisAdapter implements MessageBusAdapter {
  private readonly handlers = new Map<string, Set<(payload: unknown) => void>>();

  constructor(
    private readonly client: RedisClient,
    private readonly prefix: string = 'message-bus:'
  ) {}

  async publish(event: string, payload: unknown): Promise<void> {
    const channel = this.prefix + event;
    const message = JSON.stringify(payload);
    await this.client.publish(channel, message);
  }

  subscribe(event: string, handler: (payload: unknown) => void): Subscription {
    const channel = this.prefix + event;

    let eventHandlers = this.handlers.get(event);
    if (!eventHandlers) {
      eventHandlers = new Set();
      this.handlers.set(event, eventHandlers);

      // Subscribe to Redis channel
      void this.client.subscribe(channel, (message: string) => {
        try {
          const payload: unknown = JSON.parse(message);
          const handlers = this.handlers.get(event);
          if (handlers) {
            for (const h of handlers) {
              try {
                h(payload);
              } catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to parse message for "${event}":`, error);
        }
      });
    }

    eventHandlers.add(handler);

    return {
      unsubscribe: () => {
        eventHandlers.delete(handler);
        if (eventHandlers.size === 0) {
          this.handlers.delete(event);
          void this.client.unsubscribe(channel);
        }
      },
    };
  }
}
