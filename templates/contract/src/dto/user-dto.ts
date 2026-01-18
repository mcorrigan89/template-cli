import { z } from 'zod';

export const userDto = z.object({
  id: z.uuid(),
  name: z.string().nullable(),
  email: z.email(),
  emailVerified: z.boolean(),
  imageUrl: z.url().nullish(),
});

export const currentUserDto = userDto.extend({
  session: z.object({
    id: z.string(),
    createdAt: z.date(),
    expiresAt: z.date(),
    userAgent: z.string().nullable(),
    ipAddress: z.string().nullable(),
  }),
});

export type UserDTO = z.infer<typeof userDto>;
export type CurrentUserDTO = z.infer<typeof currentUserDto>;
