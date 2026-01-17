import { z } from 'zod';

export const userDto = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable(),
});

export type UserDTO = z.infer<typeof userDto>;
