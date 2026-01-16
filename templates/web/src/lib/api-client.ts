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
export const orpc = createTanstackQueryUtils(client);
