import { createUserContext } from '@/lib/context.ts';
import { authenticatedRoute, base, publicRoute } from './base.ts';
import { subscriptionRoutes } from './subscriptions.ts';

const helloworld = publicRoute.helloworld.handler(async ({ input: { name } }) => {
  return name ? `Hello, ${name}!` : 'Hello, World!';
});

const currentUser = authenticatedRoute.auth.currentUser.handler(async ({ context }) => {
  const { userEntity, sessionEntity } = await context.domain.userService.currentUser(
    createUserContext(context)
  );
  if (!userEntity || !sessionEntity) {
    return null;
  }
  return {
    id: userEntity.id,
    name: userEntity.name,
    email: userEntity.email,
    emailVerified: userEntity.emailVerified,
    session: {
      id: sessionEntity.id,
      createdAt: sessionEntity.createdAt,
      expiresAt: sessionEntity.expiresAt,
      userAgent: sessionEntity.userAgent,
      ipAddress: sessionEntity.ipAddress,
    },
  };
});

export const routerImplementation = base.router({
  helloworld,
  auth: {
    currentUser,
  },
  subscriptions: subscriptionRoutes,
});
