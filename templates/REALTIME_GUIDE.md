# Real-Time Subscriptions Guide

This template includes a complete setup for real-time communication using **Server-Sent Events (SSE)** through ORPC event iterators with TanStack Query integration.

## Overview

Real-time features are implemented using:

1. **ORPC Event Iterators** - Type-safe, contract-based subscriptions over HTTP streaming (SSE)
2. **TanStack Query Integration** - Reactive data management with automatic caching and cleanup
3. **Async Generators** - Server-side streaming via JavaScript async generators

## Why Server-Sent Events (SSE)?

SSE is the recommended approach for real-time server-to-client communication because:

- ✅ **Simpler** - Built on standard HTTP, easier to implement and debug
- ✅ **Auto-reconnection** - Built-in reconnection with `lastEventId` support
- ✅ **Works everywhere** - Passes through proxies, firewalls, and CDNs
- ✅ **HTTP/2 multiplexing** - Multiple streams over one connection
- ✅ **Better debugging** - Shows up as regular HTTP in browser DevTools
- ✅ **Perfect fit** - Ideal for notifications, live updates, and streaming data
- ✅ **TanStack Query** - Natural integration with React Query patterns

## Architecture

```
┌─────────────┐         HTTP (SSE)        ┌─────────────┐
│   Client    │ ◄──────────────────────── │   Server    │
│  (React)    │                            │   (Hono)    │
└─────────────┘                            └─────────────┘
      │                                          │
      │                                          │
   ORPC Client                             ORPC Server
   TanStack Query                       Async Generators
      │                                          │
      └──────────────────────────────────────────┘
              Contract (@template/contract)
```

## Implementation

### 1. Contract Definition

Define event iterators in `packages/contract/src/routes/subscription-routes.ts`:

```typescript
import { oc, eventIterator } from '@orpc/contract';
import { z } from 'zod';

// Real-time notification subscription
export const notificationSubscription = oc.output(
  eventIterator(
    z.object({
      id: z.string(),
      type: z.enum(['info', 'warning', 'error', 'success']),
      message: z.string(),
      timestamp: z.string(),
    })
  )
);
```

**Important**: Always wrap the output schema with `eventIterator()` for streaming endpoints. This signals SSE streaming rather than a single response.

### 2. Server Implementation

Implement using async generators in `apps/server/src/routes/subscriptions.ts`:

```typescript
import { publicRoute } from './base.ts';

const notifications = publicRoute.subscriptions.notifications.handler(async function* () {
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
  notifications,
};
```

**Key patterns:**
- Use `async function*` (async generator) for the handler
- Use `yield` to emit events to the client
- Use `while (true)` for continuous streams
- Handle cleanup in `finally` blocks if needed
- Access `lastEventId` parameter for resume support

### 3. Client Usage

Subscribe using TanStack Query's `useQuery` with `experimental_liveOptions`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { orpc } from '@/lib/api-client';

export function NotificationSubscriber() {
  const { data: notification } = useQuery({
    ...orpc.subscriptions.notifications.experimental_liveOptions({
      input: {},
    }),
    enabled: typeof window !== 'undefined',
    refetchInterval: false,
    retry: true,
  });

  useEffect(() => {
    if (!notification) return;

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
      case 'error':
        toast.error(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
      case 'warning':
        toast.warning(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
      case 'info':
      default:
        toast.info(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
    }
  }, [notification]);

  return null;
}
```

**Benefits:**
- Automatic caching and deduplication via TanStack Query
- Easy to enable/disable subscriptions with the `enabled` flag
- Integrates with React Query DevTools for debugging
- Automatically cleans up when component unmounts

## Demo

Visit `/subscriptions-demo` in your app to learn about the notification system.

The app includes a **global notification system** that displays toast notifications in real-time. Notifications are automatically subscribed at the root level and displayed using Sonner toasts. You'll see periodic notifications appear in the top-right corner as the server emits them.

## Real-Time Toast Notifications

The template includes a pre-configured notification system at the app root level that displays real-time server notifications as toasts.

### Implementation

**NotificationSubscriber Component** (`src/components/NotificationSubscriber.tsx`):

```typescript
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { orpc } from '@/lib/api-client';

export function NotificationSubscriber() {
  // Subscribe to notifications using experimental_liveOptions
  const { data: notification } = useQuery({
    ...orpc.subscriptions.notifications.experimental_liveOptions({
      input: {},
    }),
    enabled: typeof window !== 'undefined',
    refetchInterval: false,
    retry: true,
  });

  // Display toast when new notification arrives
  useEffect(() => {
    if (!notification) return;

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
      case 'error':
        toast.error(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
      case 'warning':
        toast.warning(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
      case 'info':
      default:
        toast.info(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
    }
  }, [notification]);

  return null;
}
```

**Root Layout Integration** (`src/routes/__root.tsx`):

```typescript
import { Toaster } from 'sonner';
import { NotificationSubscriber } from '@/components/NotificationSubscriber';

function RootDocument({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
        <NotificationSubscriber />
      </body>
    </html>
  );
}
```

### How It Works

1. **Toaster**: Sonner's `<Toaster />` component is rendered at the root level to display toasts
2. **NotificationSubscriber**: Subscribes to the server's notification stream on mount
3. **Automatic Display**: Incoming notifications are automatically displayed as toasts with appropriate styling based on type
4. **Cleanup**: Subscription is automatically cleaned up when the component unmounts

This pattern is ideal for:
- System-wide notifications
- Real-time alerts
- User-specific updates
- Background task completion notifications

## Common Patterns

### Authentication with Subscriptions

Apply middleware to subscriptions for authentication:

```typescript
// Server
const authorizedRoute = publicRoute.use(authMiddleware);

const notifications = authorizedRoute.subscriptions.notifications.handler(
  async function* ({ context }) {
    const userId = context.user.id;

    // Emit user-specific notifications
    while (true) {
      const notification = await fetchUserNotification(userId);
      yield notification;
    }
  }
);
```

### Broadcasting to Multiple Clients

Use a pub/sub system (like Redis) for broadcasting:

```typescript
// Server with Redis
import { createClient } from 'redis';

const pubClient = createClient();
const subClient = pubClient.duplicate();

const notifications = publicRoute.subscriptions.notifications.handler(async function* ({ input }) {
  const { userId } = input;
  const channel = `user:${userId}:notifications`;

  try {
    for await (const notification of subscribeToChannel(channel)) {
      yield notification;
    }
  } finally {
    await unsubscribeFromChannel(channel);
  }
});
```

### Handling Disconnections

ORPC with TanStack Query automatically handles reconnections:

```typescript
// Enable retry for automatic reconnection
const { data, error } = useQuery({
  ...orpc.subscriptions.notifications.experimental_liveOptions({
    input: {},
  }),
  enabled: true,
  retry: true, // Automatically retry on connection errors
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Handle errors in your component
useEffect(() => {
  if (error) {
    console.error('Connection error:', error);
    // Connection will automatically retry
  }
}, [error]);
```

## Best Practices

1. **Use TanStack Query** - Leverage `experimental_liveOptions` for automatic cleanup and caching
2. **Control subscriptions** - Use the `enabled` flag to start/stop subscriptions
3. **Limit data rate** - Use throttling/debouncing on the server
4. **Handle errors** - Enable `retry` in useQuery for automatic reconnection
5. **Type safety** - Use ORPC contracts with `eventIterator()` for full type inference
6. **Authentication** - Apply middleware to subscription routes for user validation
7. **Resource limits** - Set max clients and message size limits on the server
8. **Monitoring** - Log subscription events and monitor active connections

## Performance Considerations

- ORPC subscriptions use HTTP streaming (Server-Sent Events)
- HTTP/2 multiplexing allows multiple streams over one connection
- Consider using Redis pub/sub for horizontal scaling
- Implement backpressure handling for high-throughput scenarios
- Monitor memory usage for long-lived subscriptions

## Troubleshooting

### Subscriptions not receiving data

1. Check server logs for errors
2. Verify the subscription handler is properly registered
3. Check network tab for connection status (look for EventStream)
4. Ensure `enabled` flag is set to `true` in useQuery
5. Verify `eventIterator()` is used in the contract

### Connection errors

1. Check CORS settings if client and server are on different domains
2. Verify server is running and accessible
3. Check for proxy/firewall blocking SSE connections
4. Enable `retry: true` in useQuery for automatic reconnection

### Type errors

1. Rebuild the contract package after changes
2. Ensure client and server use the same contract version
3. Restart TypeScript server in your editor
4. Verify `eventIterator()` wraps the output schema

## When NOT to Use SSE

SSE is perfect for server-to-client streaming, but consider alternatives if you need:

- **Bidirectional communication** - Client needs to send frequent messages to server
  - Consider: Regular HTTP POST requests for client→server, SSE for server→client
- **Binary data transfer** - Sending images, videos, or other binary data
  - Consider: Regular HTTP file uploads/downloads
- **Gaming or collaboration** - Extremely low latency (<50ms) bidirectional messaging
  - Consider: WebSocket (would need to be implemented separately)

For 95% of use cases (notifications, live updates, dashboards, chat), **SSE is the better choice**.

## Resources

- [ORPC Event Iterator Documentation](https://orpc.dev/docs/event-iterator)
- [ORPC OpenAI Streaming Example](https://orpc.dev/docs/examples/openai-streaming)
- [ORPC Durable Iterator Integration](https://orpc.dev/docs/integrations/durable-iterator)
- [TanStack Query Integration](https://orpc.dev/docs/integrations/tanstack-query)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
