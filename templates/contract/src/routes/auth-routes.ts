import { oc } from '@orpc/contract';
import { userDto } from '../dto/user-dto.ts';

export const currentUser = oc.output(userDto.nullable());
