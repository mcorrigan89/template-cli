import { createUserContext } from '@/lib/context.ts';
import { authenticatedRoute, base, publicRoute } from './base.ts';
import { subscriptionRoutes } from './subscriptions.ts';

const helloworld = publicRoute.helloworld.handler(async ({ input: { name } }) => {
  return name ? `Hello, ${name}!` : 'Hello, World!';
});

const currentUser = authenticatedRoute.auth.currentUser.handler(async ({ context }) => {
  const userEntity = await context.domain.userService.currentUser(createUserContext(context));
  if (!userEntity) {
    return null;
  }
  return {
    id: userEntity.id,
    name: userEntity.name,
    email: userEntity.email,
  };
});

export const routerImplementation = base.router({
  helloworld,
  auth: {
    currentUser,
  },
  subscriptions: subscriptionRoutes,
});
