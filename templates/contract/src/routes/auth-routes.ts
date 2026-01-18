import { oc } from '@orpc/contract';
import { currentUserDto } from '../dto/user-dto.ts';

export const currentUser = oc.output(currentUserDto.nullable());
