import { oc } from '@orpc/contract';
import { z } from 'zod';
import { organizationDto } from '../dto/organization-dto.ts';

export const organizationByIdRoute = oc
  .input(z.object({ id: z.string() }))
  .output(organizationDto.nullable());

export const listOrganizationsRoute = oc.output(z.array(organizationDto));

export const createOrganizationRoute = oc
  .input(
    z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      logo: z.string().optional(),
    })
  )
  .output(organizationDto);

export const setActiveOrganizationRoute = oc
  .input(z.object({ organizationId: z.string().nullable() }))
  .output(organizationDto.nullable());

export const getActiveOrganizationRoute = oc.output(organizationDto.nullable());

export const checkSlugRoute = oc
  .input(z.object({ slug: z.string() }))
  .output(z.object({ available: z.boolean() }));
