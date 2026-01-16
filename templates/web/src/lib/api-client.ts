import { RPCLink } from '@orpc/client/fetch'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createORPCClient } from '@orpc/client'
import { ContractRouterClient } from '@orpc/contract'
import { contract } from '@template/orpc-contract'

const getClientLink = createIsomorphicFn()
  .client(
    () =>
      new RPCLink({
        url: `http://localhost:3001/rpc`,
        fetch: (request, init) => {
          return globalThis.fetch(request, {
            ...init,
            credentials: 'include', // Include cookies for cross-origin requests
          })
        },
      }),
  )
  .server(
    () =>
      new RPCLink({
        url: 'http://localhost:3001/rpc',
        headers: () => getRequestHeaders(),
        fetch: (request, init) => {
          return globalThis.fetch(request, {
            ...init,
            credentials: 'include', // Include cookies for cross-origin requests
          })
        },
      }),
  )

const link = getClientLink()
const client: ContractRouterClient<typeof contract> = createORPCClient(link)
export const orpc = createTanstackQueryUtils(client)
