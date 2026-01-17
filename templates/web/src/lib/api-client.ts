import { RPCLink } from '@orpc/client/fetch';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { createORPCClient } from '@orpc/client';
import { ContractRouterClient } from '@orpc/contract';
import { contract } from '@template/contract';
import { getSharedEnv } from '@template/env/shared';

const getClientLink = createIsomorphicFn()
  .client(() => {
    const env = getSharedEnv();
    return new RPCLink({
      url: `${env.SERVER_URL}/rpc`,
      fetch: (request, init) => {
        return globalThis.fetch(request, {
          ...init,
          credentials: 'include', // Include cookies for cross-origin requests
        });
      },
    });
  })
  .server(() => {
    const env = getSharedEnv();
    return new RPCLink({
      url: `${env.SERVER_URL}/rpc`,
      headers: () => getRequestHeaders(),
      fetch: (request, init) => {
        return globalThis.fetch(request, {
          ...init,
          credentials: 'include', // Include cookies for cross-origin requests
        });
      },
    });
  });

const link = getClientLink();
const client: ContractRouterClient<typeof contract> = createORPCClient(link);

// Create TanStack Query utilities with subscription support
export const orpc = createTanstackQueryUtils(client);

// WebSocket client for real-time subscriptions
// Note: ORPC subscriptions work over HTTP streaming by default
// For a custom WebSocket implementation, you would create a custom link
export function createWebSocketConnection(url: string) {
  if (typeof window === 'undefined') {
    // Skip WebSocket on server-side
    return null;
  }

  const ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    console.log('WebSocket connected');
  });

  ws.addEventListener('message', (event) => {
    console.log('WebSocket message:', event.data);
  });

  ws.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.addEventListener('close', () => {
    console.log('WebSocket disconnected');
  });

  return ws;
}
