import { eventIterator, oc } from '@orpc/contract';
import { z } from 'zod';

// Real-time notification subscription
// Emits system-wide notifications that are displayed as toasts
export const notificationSubscription = oc.output(
  eventIterator(
    z.object({
      id: z.string(),
      type: z.enum(['info', 'warning', 'error', 'success', 'link']),
      message: z.string(),
      link: z.url().optional(),
      timestamp: z.string(),
    })
  )
);
