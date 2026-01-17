import { z } from 'zod';

import { createMessageBus } from './message-bus/index.ts';

/**
 * Notification bus for streaming real-time notifications to clients via SSE.
 */
const notificationEvents = {
  notification: z.object({
    type: z.enum(['info', 'success', 'warning', 'error']),
    message: z.string(),
    description: z.string().optional(),
  }),
} as const;

export const notificationBus = createMessageBus(notificationEvents);

export type NotificationEvents = typeof notificationEvents;
