import { z } from 'zod';

export const organizationDto = z.object({
  id: z.uuid(),
  name: z.string().nullable(),
  slug: z.string().min(1).max(3),
});

export type OrganizationDTO = z.infer<typeof organizationDto>;
