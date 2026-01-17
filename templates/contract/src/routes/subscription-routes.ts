import { oc } from '@orpc/contract';
import { z } from 'zod';

// Example: Real-time counter subscription
// Subscriptions are defined by async generator handlers on the server
export const counterSubscription = oc
  .input(z.object({ interval: z.number().optional().default(1000) }))
  .output(z.object({ count: z.number(), timestamp: z.string() }));

// Example: Chat message subscription
export const chatSubscription = oc.input(z.object({ roomId: z.string() })).output(
  z.object({
    id: z.string(),
    roomId: z.string(),
    userId: z.string(),
    message: z.string(),
    timestamp: z.string(),
  })
);

// Example: Notification subscription (authenticated)
export const notificationSubscription = oc.output(
  z.object({
    id: z.string(),
    type: z.enum(['info', 'warning', 'error', 'success']),
    message: z.string(),
    timestamp: z.string(),
  })
);
