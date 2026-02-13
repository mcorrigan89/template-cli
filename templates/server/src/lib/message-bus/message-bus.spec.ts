import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { InMemoryAdapter } from './adapters/in-memory-adapter.ts';
import { MessageBus } from './message-bus.ts';

const busEvents = {
  'user.created': z.object({
    userId: z.string(),
    email: z.string(),
  }),
  'user.deleted': z.object({
    userId: z.string(),
  }),
} as const;

function createBus() {
  return new MessageBus(busEvents, new InMemoryAdapter());
}

/** Wait for setImmediate to flush so handlers run. */
function flush() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

describe('MessageBus', () => {
  it('should deliver the correct payload to subscribers', async () => {
    const bus = createBus();
    const received: { userId: string; email: string }[] = [];

    bus.subscribe('user.created', (payload) => {
      received.push(payload);
    });

    await bus.publish('user.created', { userId: '1', email: 'a@b.com' });
    await flush();

    expect(received).toEqual([{ userId: '1', email: 'a@b.com' }]);
  });

  it('should deliver multiple published events in order', async () => {
    const bus = createBus();
    const received: string[] = [];

    bus.subscribe('user.deleted', ({ userId }) => {
      received.push(userId);
    });

    await bus.publish('user.deleted', { userId: '1' });
    await bus.publish('user.deleted', { userId: '2' });
    await flush();

    expect(received).toEqual(['1', '2']);
  });

  it('should deliver to multiple subscribers', async () => {
    const bus = createBus();
    const receivedA: string[] = [];
    const receivedB: string[] = [];

    bus.subscribe('user.created', ({ email }) => {
      receivedA.push(email);
    });
    bus.subscribe('user.created', ({ email }) => {
      receivedB.push(email);
    });

    await bus.publish('user.created', { userId: '1', email: 'a@b.com' });
    await flush();

    expect(receivedA).toEqual(['a@b.com']);
    expect(receivedB).toEqual(['a@b.com']);
  });

  it('should not deliver events after unsubscribe', async () => {
    const bus = createBus();
    const received: string[] = [];

    const sub = bus.subscribe('user.deleted', ({ userId }) => {
      received.push(userId);
    });

    await bus.publish('user.deleted', { userId: '1' });
    await flush();

    sub.unsubscribe();

    await bus.publish('user.deleted', { userId: '2' });
    await flush();

    expect(received).toEqual(['1']);
  });

  it('should not deliver events to unrelated subscribers', async () => {
    const bus = createBus();
    const received: string[] = [];

    bus.subscribe('user.deleted', ({ userId }) => {
      received.push(userId);
    });

    await bus.publish('user.created', { userId: '1', email: 'a@b.com' });
    await flush();

    expect(received).toEqual([]);
  });

  it('should reject invalid payloads', async () => {
    const bus = createBus();

    await expect(
      // @ts-expect-error intentionally passing invalid payload
      bus.publish('user.created', { userId: 123 })
    ).rejects.toThrow('Invalid payload');
  });

  it('should reject unknown event names', async () => {
    const bus = createBus();

    await expect(
      // @ts-expect-error intentionally passing unknown event
      bus.publish('nonexistent', {})
    ).rejects.toThrow('Unknown event');
  });
});
