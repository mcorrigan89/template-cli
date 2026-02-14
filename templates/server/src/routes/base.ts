import { AuthService, authSymbol } from '@/lib/auth.ts';
import { UserContext } from '@/lib/context.ts';
import { di } from '@/lib/di.ts';
import { implement, ORPCError } from '@orpc/server';
import { contract } from '@template/contract';

const os = implement(contract);
export const base = os.$context<UserContext>();

const servicesMiddleware = base.middleware(async ({ next }) => {
  return next({
    context: {},
  });
});

const authenticatedMiddleware = base.middleware(async ({ context, next }) => {
  const auth = di.get<AuthService>(authSymbol);
  const sessionData = await auth.api.getSession({
    headers: context.headers,
  });

  context.logger.setUserContext({
    ...context,
    session: sessionData?.session,
    user: sessionData?.user,
    currentUserId: sessionData?.user?.id ?? null,
  });

  return next({
    context: {
      session: sessionData?.session,
      user: sessionData?.user,
      currentUserId: sessionData?.user?.id ?? null,
    },
  });
});

const authorizedMiddleware = base.middleware(async ({ context, next }) => {
  if (!context.user) {
    throw new ORPCError('FORBIDDEN');
  }

  return next();
});

export const publicRoute = base.use(servicesMiddleware);
export const authenticatedRoute = publicRoute.use(authenticatedMiddleware);
export const authorizedRoute = authenticatedRoute.use(authorizedMiddleware);
