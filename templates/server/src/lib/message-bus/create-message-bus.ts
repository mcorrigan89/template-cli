import { InMemoryAdapter } from './adapters/in-memory-adapter.ts';
import { MessageBus } from './message-bus.ts';
import type { EventMap, MessageBusAdapter } from './types.ts';

/**
 * Create a new type-safe message bus.
 *
 * @param events - An object mapping event names to Zod schemas
 * @param adapter - Optional adapter (defaults to InMemoryAdapter)
 * @returns A fully typed MessageBus instance
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { createMessageBus } from '@/lib/message-bus';
 *
 * const userEvents = {
 *   'user.created': z.object({ userId: z.string(), email: z.string() }),
 *   'user.deleted': z.object({ userId: z.string() }),
 * } as const;
 *
 * const userBus = createMessageBus(userEvents);
 *
 * // With custom adapter
 * import { RedisAdapter } from '@/lib/message-bus';
 * const distributedBus = createMessageBus(userEvents, new RedisAdapter(redisClient));
 * ```
 */
export function createMessageBus<T extends EventMap>(
  events: T,
  adapter?: MessageBusAdapter
): MessageBus<T> {
  return new MessageBus(events, adapter ?? new InMemoryAdapter());
}
