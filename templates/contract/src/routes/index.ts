import {
  oc,
  type InferContractRouterInputs,
  type InferContractRouterOutputs,
} from '@orpc/contract';
import { z } from 'zod';
import { currentUser } from './auth-routes.ts';
import { uploadAvatarImage } from './media-routes.ts';
import { notificationSubscription } from './subscription-routes.ts';

const helloworld = oc.input(z.object({ name: z.string().optional() })).output(z.string());

export const contract = {
  helloworld,
  currentUser: {
    me: currentUser,
    uploadAvatar: uploadAvatarImage,
  },
  subscriptions: {
    notifications: notificationSubscription,
  },
};

export type Inputs = InferContractRouterInputs<typeof contract>;
export type Outputs = InferContractRouterOutputs<typeof contract>;
