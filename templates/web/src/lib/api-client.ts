import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { BatchLinkPlugin } from '@orpc/client/plugins';
import { ContractRouterClient } from '@orpc/contract';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
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
      plugins: [
        new BatchLinkPlugin({
          groups: [
            {
              condition: () => true,
              context: {}, // Context used for the rest of the request lifecycle
            },
          ],
        }),
      ],
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
      plugins: [
        new BatchLinkPlugin({
          groups: [
            {
              condition: () => true,
              context: {}, // Context used for the rest of the request lifecycle
            },
          ],
        }),
      ],
    });
  });

const link = getClientLink();
const client: ContractRouterClient<typeof contract> = createORPCClient(link);

// Create TanStack Query utilities for ORPC
// Subscriptions use Server-Sent Events (SSE) via event iterators
export const orpc = createTanstackQueryUtils(client);
