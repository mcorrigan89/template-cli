# WebSocket & Real-Time Subscriptions Guide

This template includes a complete setup for real-time communication using WebSockets and ORPC subscriptions with TanStack Query integration.

## Overview

The setup includes three main approaches for real-time communication:

1. **ORPC Subscriptions** - Type-safe, contract-based subscriptions over HTTP streaming
2. **Raw WebSocket** - Direct WebSocket connections for custom protocols
3. **TanStack Query Integration** - Reactive data management with subscriptions

## Architecture

```
┌─────────────┐         HTTP/WS          ┌─────────────┐
│   Client    │ ◄──────────────────────► │   Server    │
│  (React)    │                          │   (Hono)    │
└─────────────┘                          └─────────────┘
      │                                         │
      │                                         │
   ORPC Client                            ORPC Server
   TanStack Query                      Async Generators
      │                                         │
      └─────────────────────────────────────────┘
              Contract (@template/contract)
```

## 1. ORPC Subscriptions

### Contract Definition

Subscriptions are defined in `packages/contract/src/routes/subscription-routes.ts`:

```typescript
import { oc } from '@orpc/contract';
import { z } from 'zod';

export const counterSubscription = oc
  .input(z.object({ interval: z.number().optional().default(1000) }))
  .output(z.object({ count: z.number(), timestamp: z.string() }));
```

### Server Implementation

Subscriptions use async generators in `apps/server/src/routes/subscriptions.ts`:

```typescript
const counter = base.subscriptions.counter.handler(
  async function* ({ input }: { input: { interval: number } }) {
    let count = 0;
    while (true) {
      yield {
        count,
        timestamp: new Date().toISOString(),
      };
      count++;
      await new Promise((resolve) => setTimeout(resolve, input.interval));
    }
  }
);
```

### Client Usage

Use ORPC subscriptions with TanStack Query:

```typescript
import { orpc } from '@/lib/api-client';

function Component() {
  useEffect(() => {
    const subscription = orpc.subscriptions.counter.subscribe(
      { interval: 1000 },
      {
        onData: (data) => {
          console.log('Received:', data);
        },
        onError: (error) => {
          console.error('Error:', error);
        },
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}
```

## 2. Raw WebSocket Connection

### Server Setup

The WebSocket server is set up in `apps/server/src/lib/websocket.ts`:

```typescript
import { WebSocketServer } from 'ws';

export function setupWebSocketServer(httpServer: ServerType) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
  });

  wss.on('connection', (ws, request) => {
    ws.on('message', (message) => {
      // Handle incoming messages
    });
  });
}
```

The WebSocket server is attached to the HTTP server in `apps/server/src/index.ts`:

```typescript
const server = serve({ fetch: app.fetch, port: 3001 });
setupWebSocketServer(server);
```

### Client Usage

Connect to WebSocket from the client:

```typescript
import { createWebSocketConnection } from '@/lib/api-client';
import { getSharedEnv } from '@template/env/shared';

function Component() {
  const env = getSharedEnv();
  const wsUrl = env.SERVER_URL.replace('http', 'ws') + '/ws';
  const ws = createWebSocketConnection(wsUrl);

  ws?.addEventListener('message', (event) => {
    console.log('Received:', event.data);
  });

  ws?.send('Hello server!');
}
```

## 3. Integration with TanStack Query

ORPC subscriptions work seamlessly with TanStack Query for reactive data management:

```typescript
import { orpc } from '@/lib/api-client';
import { useState } from 'react';

function useRealtimeCounter(interval: number = 1000) {
  const [data, setData] = useState<{ count: number; timestamp: string }>();

  useEffect(() => {
    const subscription = orpc.subscriptions.counter.subscribe(
      { interval },
      {
        onData: (newData) => {
          setData(newData);
        },
      }
    );

    return () => subscription.unsubscribe();
  }, [interval]);

  return data;
}
```

## Demo

Visit `/subscriptions-demo` in your app to see working examples of:

1. Counter subscription - Real-time incrementing counter
2. Chat subscription - Multi-room chat messages
3. Raw WebSocket - Custom WebSocket protocol

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

const chat = base.subscriptions.chat.handler(
  async function* ({ input }) {
    const { roomId } = input;

    await subClient.subscribe(roomId, (message) => {
      // This won't work directly - use async iteration
    });

    // Better approach: Use async iterator
    for await (const message of subscribeToRoom(roomId)) {
      yield message;
    }
  }
);
```

### Handling Disconnections

ORPC automatically handles reconnections for subscriptions:

```typescript
const subscription = orpc.subscriptions.counter.subscribe(
  { interval: 1000 },
  {
    onData: (data) => console.log(data),
    onError: (error) => {
      console.error('Connection error:', error);
      // Subscription will automatically retry
    },
  }
);
```

## Best Practices

1. **Clean up subscriptions** - Always unsubscribe in cleanup functions
2. **Limit data rate** - Use throttling/debouncing on the server
3. **Handle errors** - Implement proper error handling and reconnection logic
4. **Type safety** - Use contracts for type-safe subscriptions
5. **Authentication** - Always validate user permissions for subscriptions
6. **Resource limits** - Set max clients and message size limits
7. **Monitoring** - Log subscription events for debugging

## Performance Considerations

- ORPC subscriptions use HTTP streaming (Server-Sent Events style)
- WebSocket provides full-duplex communication with lower overhead
- Consider using Redis pub/sub for horizontal scaling
- Implement backpressure handling for high-throughput scenarios
- Monitor memory usage for long-lived subscriptions

## Troubleshooting

### Subscriptions not receiving data

1. Check server logs for errors
2. Verify the subscription handler is properly registered
3. Check network tab for connection status
4. Ensure cleanup is not called prematurely

### WebSocket connection fails

1. Verify WebSocket server is running on the correct port
2. Check for proxy/firewall blocking WebSocket connections
3. Ensure URL uses `ws://` or `wss://` protocol
4. Check CORS settings for cross-origin WebSocket connections

### Type errors

1. Rebuild the contract package after changes
2. Ensure client and server use the same contract version
3. Restart TypeScript server in your editor

## Resources

- [ORPC Documentation](https://orpc.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
