import { base } from './base.ts';

// Counter subscription - emits incrementing count every interval
const counter = base.subscriptions.counter.handler(async function* ({
  input,
}: {
  input: { interval: number };
}) {
  let count = 0;
  while (true) {
    yield {
      count,
      timestamp: new Date().toISOString(),
    };
    count++;
    await new Promise((resolve) => setTimeout(resolve, input.interval));
  }
});

// Chat subscription - emits messages for a specific room
// In a real app, this would listen to a message broker or database changes
const chat = base.subscriptions.chat.handler(async function* ({
  input,
}: {
  input: { roomId: string };
}) {
  const { roomId } = input;

  // This is a simplified example - in production you'd use Redis pub/sub,
  // database triggers, or a message queue
  let messageCount = 0;

  // Emit a welcome message
  yield {
    id: crypto.randomUUID(),
    roomId,
    userId: 'system',
    message: `Welcome to room ${roomId}`,
    timestamp: new Date().toISOString(),
  };

  // Simulate periodic messages (replace with real event listener)
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    messageCount++;
    yield {
      id: crypto.randomUUID(),
      roomId,
      userId: 'user-' + Math.floor(Math.random() * 100),
      message: `Message ${messageCount} in ${roomId}`,
      timestamp: new Date().toISOString(),
    };
  }
});

// Notification subscription - requires authentication
// In a real app, this would emit user-specific notifications
const notifications = base.subscriptions.notifications.handler(async function* () {
  // Example: emit periodic notifications
  const notificationTypes = ['info', 'warning', 'error', 'success'] as const;

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    yield {
      id: crypto.randomUUID(),
      type,
      message: `This is a ${type} notification`,
      timestamp: new Date().toISOString(),
    };
  }
});

export const subscriptionRoutes = {
  counter,
  chat,
  notifications,
};
