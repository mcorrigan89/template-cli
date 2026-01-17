import type { MessageBusAdapter, Subscription } from '../types.ts';

type Handler = (payload: unknown) => void;

/**
 * In-memory message bus adapter for local development and testing.
 *
 * - Events are dispatched asynchronously via setImmediate
 * - No persistence - events are lost on restart
 * - Single instance only - not distributed
 */
export class InMemoryAdapter implements MessageBusAdapter {
  private readonly handlers = new Map<string, Set<Handler>>();

  async publish(event: string, payload: unknown): Promise<void> {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers || eventHandlers.size === 0) {
      return;
    }

    // Dispatch asynchronously to avoid blocking the publisher
    setImmediate(() => {
      for (const handler of eventHandlers) {
        try {
          void handler(payload);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      }
    });
  }

  subscribe(event: string, handler: Handler): Subscription {
    let eventHandlers = this.handlers.get(event);
    if (!eventHandlers) {
      eventHandlers = new Set();
      this.handlers.set(event, eventHandlers);
    }

    eventHandlers.add(handler);

    return {
      unsubscribe: () => {
        eventHandlers.delete(handler);
        if (eventHandlers.size === 0) {
          this.handlers.delete(event);
        }
      },
    };
  }
}
