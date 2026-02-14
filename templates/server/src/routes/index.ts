import { createUserContext } from '@/lib/context.ts';
import { dbSymbol, di } from '@/lib/di.ts';
import { Database } from '@template/database';
import { authenticatedRoute, base, publicRoute } from './base.ts';
import { subscriptionRoutes } from './subscriptions.ts';

const helloworld = publicRoute.helloworld.handler(async ({ input: { name } }) => {
  return name ? `Hello, ${name}!` : 'Hello, World!';
});

const healthy = publicRoute.healthy.handler(async () => {
  const db = di.get<Database>(dbSymbol);
  try {
    await db.execute('SELECT 1'); // Simple query to check database connectivity
    return 'OK';
  } catch (error) {
    return 'Database connection failed';
  }
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
    initials: userEntity.initials,
    email: userEntity.email,
    emailVerified: userEntity.emailVerified,
    avatarUrl: userEntity.avatarUrl,
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
    const { userId, image } = input;
    // Convert File to Buffer
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageUrl = await context.domain.mediaService.uploadAvatarImage(
      createUserContext(context),
      userId,
      imageBuffer
    );
    return { imageUrl };
  }
);

const organizationById = publicRoute.organization.byId.handler(async ({ input, context }) => {
  const organization = await context.domain.organizationService.getOrganizationById(
    createUserContext(context),
    { id: input.id }
  );
  if (!organization) {
    return null;
  }
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo,
    createdAt: organization.createdAt,
  };
});

const listOrganizations = authenticatedRoute.organization.list.handler(async ({ context }) => {
  const organizations = await context.domain.organizationService.listUserOrganizations(
    createUserContext(context),
    context.headers
  );
  return organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo ?? null,
    createdAt: org.createdAt,
  }));
});

const createOrganization = authenticatedRoute.organization.create.handler(
  async ({ input, context }) => {
    const organization = await context.domain.organizationService.createOrganization(
      createUserContext(context),
      {
        name: input.name,
        slug: input.slug,
        logo: input.logo,
      },
      context.headers
    );
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo ?? null,
      createdAt: organization.createdAt,
    };
  }
);

const setActiveOrganization = authenticatedRoute.organization.setActive.handler(
  async ({ input, context }) => {
    const result = await context.domain.organizationService.setActiveOrganization(
      createUserContext(context),
      { organizationId: input.organizationId },
      context.headers
    );
    if (!result) {
      return null;
    }
    return {
      id: result.id,
      name: result.name,
      slug: result.slug,
      logo: result.logo ?? null,
      createdAt: result.createdAt,
    };
  }
);

const getActiveOrganization = authenticatedRoute.organization.getActive.handler(
  async ({ context }) => {
    const result = await context.domain.organizationService.getActiveOrganization(
      createUserContext(context),
      context.headers
    );
    if (!result) {
      return null;
    }
    return {
      id: result.id,
      name: result.name,
      slug: result.slug,
      logo: result.logo ?? null,
      createdAt: result.createdAt,
    };
  }
);

const checkSlug = authenticatedRoute.organization.checkSlug.handler(async ({ input, context }) => {
  const result = await context.domain.organizationService.checkSlug(
    createUserContext(context),
    input.slug,
    context.headers
  );
  return { available: result.status };
});

export const routerImplementation = base.router({
  helloworld,
  healthy,
  currentUser: {
    me: currentUser,
    uploadAvatar: uploadAvatarImage,
  },
  organization: {
    byId: organizationById,
    list: listOrganizations,
    create: createOrganization,
    setActive: setActiveOrganization,
    getActive: getActiveOrganization,
    checkSlug: checkSlug,
  },
  subscriptions: subscriptionRoutes,
});
