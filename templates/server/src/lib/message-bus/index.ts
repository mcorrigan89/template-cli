// Core types
export type {
  EventHandler,
  EventMap,
  EventPayload,
  MessageBusAdapter,
  Subscription,
} from './types.ts';

// Main class
export { MessageBus } from './message-bus.ts';

// Factory function
export { createMessageBus } from './create-message-bus.ts';

// Adapters
export { InMemoryAdapter } from './adapters/in-memory-adapter.ts';
export { RedisAdapter } from './adapters/redis-adapter.ts';
export type { RedisClient } from './adapters/redis-adapter.ts';
