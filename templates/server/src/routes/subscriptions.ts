import { publicRoute } from './base.ts';

// Notification subscription - emits system-wide notifications
// ORPC automatically handles async generators as Server-Sent Events (SSE)
// In a real app, this would emit user-specific notifications based on events
const notifications = publicRoute.subscriptions.notifications.handler(async function* ({
  context,
}) {
  // Example: emit periodic notifications
  const notificationTypes = ['info', 'warning', 'error', 'success'] as const;

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    yield {
      id: crypto.randomUUID(),
      type,
      message: context.user?.name
        ? `This is a ${type} notification for ${context.user.name}`
        : `Hello Guest! This is a ${type} notification`,
      timestamp: new Date().toISOString(),
    };
  }
});

export const subscriptionRoutes = {
  notifications,
};
