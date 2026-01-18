import { createUserContext } from '@/lib/context.ts';
import { authenticatedRoute, base, publicRoute } from './base.ts';
import { subscriptionRoutes } from './subscriptions.ts';

const helloworld = publicRoute.helloworld.handler(async ({ input: { name } }) => {
  return name ? `Hello, ${name}!` : 'Hello, World!';
});

const currentUser = authenticatedRoute.currentUser.me.handler(async ({ context }) => {
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

const uploadAvatarImage = authenticatedRoute.currentUser.uploadAvatar.handler(
  async ({ input, context }) => {
    const { userId, imageBuffer } = input;
    const imageUrl = await context.domain.mediaService.uploadAvatarImage(
      createUserContext(context),
      userId,
      imageBuffer
    );
    return { imageUrl };
  }
);

export const routerImplementation = base.router({
  helloworld,
  currentUser: {
    me: currentUser,
    uploadAvatar: uploadAvatarImage,
  },
  subscriptions: subscriptionRoutes,
});
