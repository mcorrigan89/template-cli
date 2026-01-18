import { notificationBus } from '@/lib/notification-bus.ts';
import { publicRoute } from './base.ts';

// Notification subscription - emits system-wide notifications
// ORPC automatically handles async generators as Server-Sent Events (SSE)
// Bridges the dev message bus to SSE for real-time notifications
const notifications = publicRoute.subscriptions.notifications.handler(async function* () {
  // Queue to hold incoming events from the message bus
  const queue: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: string;
  }> = [];
  let resolver: (() => void) | null = null;

  // Subscribe to notifications from the notification bus
  const subscription = notificationBus.subscribe('notification', (payload) => {
    queue.push({
      id: crypto.randomUUID(),
      type: payload.type,
      message: payload.description ? `${payload.message}: ${payload.description}` : payload.message,
      timestamp: new Date().toISOString(),
    });
    // Wake up the generator if it's waiting
    if (resolver) {
      resolver();
      resolver = null;
    }
  });

  try {
    while (true) {
      // Wait for events if queue is empty
      if (queue.length === 0) {
        await new Promise<void>((resolve) => {
          resolver = resolve;
        });
      }

      // Yield all queued events
      while (queue.length > 0) {
        const event = queue.shift();
        if (event) {
          yield event;
        }
      }
    }
  } finally {
    // Clean up subscription when client disconnects
    subscription.unsubscribe();
  }
});

export const subscriptionRoutes = {
  notifications,
};
