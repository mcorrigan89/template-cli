import { auth } from '@/lib/auth.ts';
import { Context, createUserContext } from '@/lib/context.ts';
import { implement, ORPCError } from '@orpc/server';
import { contract } from '@template/contract';

const os = implement(contract);
export const base = os.$context<Context>();

const servicesMiddleware = base.middleware(async ({ next }) => {
  return next({
    context: {},
  });
});

const authMiddleware = base.middleware(async ({ context, next }) => {
  const sessionData = await auth.api.getSession({
    headers: context.headers,
  });

  if (!sessionData?.session || !sessionData?.user) {
    throw new ORPCError('UNAUTHORIZED');
  }

  return next({
    context: {
      session: sessionData.session,
      user: sessionData.user,
    },
  });
});

const publicRoute = base.use(servicesMiddleware);
const authorizedRoute = publicRoute.use(authMiddleware);

const helloworld = publicRoute.helloworld.handler(async ({ context, input: { name } }) => {
  context.domain.userService.getUserById(createUserContext(context), { id: 'test' }); // Example usage of the user service
  return name ? `Hello, ${name}!` : 'Hello, World!';
});

const helloworldAuth = authorizedRoute.helloworld.handler(async ({ context, input: { name } }) => {
  context.domain.userService.getUserById(createUserContext(context), { id: 'test' }); // Example usage of the user service
  return name ? `Hello, ${name}!` : 'Hello, World!';
});

export const routerImplementation = base.router({
  helloworld,
  helloworldAuth,
});
