import { z } from 'zod';

export const organizationDto = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable(),
  createdAt: z.date(),
});

export type OrganizationDTO = z.infer<typeof organizationDto>;
