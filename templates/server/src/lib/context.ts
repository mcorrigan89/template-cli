import { AppDomain } from '@/domain/domain.ts';
import { Logger } from '@template/logger';
import { Session } from './auth.ts';

export interface Context {
  headers: Headers;
  domain: AppDomain;
  session?: Session['session'];
  user?: Session['user'];
}

export interface UserContext extends Context {
  logger: ContextLogger;
  currentUserId: string | null;
}

export class ContextLogger {
  private userContext?: UserContext;
  constructor(private baseLogger: Logger) {}

  public setUserContext(userContext: UserContext) {
    this.userContext = userContext;
  }

  public trace(message: string, ...args: any[]) {
    this.baseLogger.trace(
      {
        userId: this.userContext?.user?.id ?? null,
      },
      message,
      ...args
    );
  }

  public info(message: string, ...args: any[]) {
    this.baseLogger.info(
      {
        userId: this.userContext?.user?.id ?? null,
      },
      message,
      ...args
    );
  }

  public warn(message: string, ...args: any[]) {
    this.baseLogger.warn(
      {
        userId: this.userContext?.user?.id ?? null,
      },
      message,
      ...args
    );
  }

  public error(message: string, ...args: any[]) {
    this.baseLogger.error(
      {
        userId: this.userContext?.user?.id ?? null,
      },
      message,
      ...args
    );
  }
}

export function createUserContext(params: Context, logger: Logger): UserContext {
  return {
    ...params,
    logger: new ContextLogger(logger),
    currentUserId: params.user?.id ?? null,
  };
}
