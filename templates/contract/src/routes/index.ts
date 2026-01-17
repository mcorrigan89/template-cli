import {
  oc,
  type InferContractRouterInputs,
  type InferContractRouterOutputs,
} from '@orpc/contract';
import { z } from 'zod';

const helloworld = oc.input(z.object({ name: z.string().optional() })).output(z.string());

export const contract = {
  helloworld,
  helloworldAuth: helloworld,
};

export type Inputs = InferContractRouterInputs<typeof contract>;
export type Outputs = InferContractRouterOutputs<typeof contract>;
