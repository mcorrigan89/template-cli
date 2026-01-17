import { createAuthClient } from 'better-auth/react';
import { organizationClient, adminClient, magicLinkClient } from 'better-auth/client/plugins';

import { getSharedEnv } from '@template/env/shared';

export const authClient = createAuthClient({
  baseURL: getSharedEnv().SERVER_URL,
  plugins: [organizationClient(), adminClient(), magicLinkClient()],
});

export const { signOut, useSession, organization, admin } = authClient;

export const signIn = authClient.signIn;
