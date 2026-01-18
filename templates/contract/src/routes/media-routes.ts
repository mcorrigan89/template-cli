import { oc } from '@orpc/contract';
import { z } from 'zod';

export const uploadAvatarImage = oc
  .input(
    z.object({
      userId: z.string(),
      imageBuffer: z.instanceof(Buffer),
    })
  )
  .output(z.object({ imageUrl: z.string() }));
