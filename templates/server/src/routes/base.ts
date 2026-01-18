import { auth } from '@/lib/auth.ts';
import { Context } from '@/lib/context.ts';
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

export const publicRoute = base.use(servicesMiddleware);
export const authorizedRoute = publicRoute.use(authMiddleware);
