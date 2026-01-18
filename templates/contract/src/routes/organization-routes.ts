import { organizationDto } from '@/dto/organization-dto.ts';
import { oc } from '@orpc/contract';
import { z } from 'zod';

export const organizationByIdRoute = oc
  .input(z.object({ id: z.string() }))
  .output(organizationDto.nullable());
