import { implement } from '@orpc/server';
import { contract } from '@template/contract';

const os = implement(contract);
export const base = os.$context<{ headers: Headers }>();

const servicesMiddleware = base.middleware(async ({ next }) => {
  return next({
    context: {},
  });
});

const publicRoute = base.use(servicesMiddleware);

const helloworld = publicRoute.helloworld.handler(async ({ context, input: { name } }) => {
  return name ? `Hello, ${name}!` : 'Hello, World!';
});

export const routerImplementation = base.router({
  helloworld,
});
