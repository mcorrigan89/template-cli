import { AppDomain } from '@/domain/domain.ts';
import { Logger } from '@template/logger';
import { Session } from './auth.ts';

export interface Context {
  headers: Headers;
  domain: AppDomain;
  logger: Logger;
  session?: Session['session'];
  user?: Session['user'];
}

export interface UserContext {
  logger: Logger;
  currentUserId: string | null;
}

export function createUserContext(params: Context): UserContext {
  return {
    logger: params.logger,
    currentUserId: params.user?.id ?? null,
  };
}
