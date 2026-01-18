import { UserContext } from '@/lib/context.ts';
import { dbSymbol } from '@/lib/di.ts';
import { Database } from '@template/database';
import { session, user } from '@template/database/schema';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { UserEntity, UserSessionEntity } from './user-entity.ts';

@injectable()
export class UserRepository {
  constructor(@inject(dbSymbol) private db: Database) {}

  public async userById(ctx: UserContext, { id }: { id: string }): Promise<UserEntity | null> {
    const userModel = await this.db.select().from(user).where(eq(user.id, id));
    if (userModel.length === 0) {
      ctx.logger.warn(`User with id ${id} not found.`);
      return null;
    }
    return UserEntity.fromModel(userModel[0]);
  }

  public async sessionByUserId(ctx: UserContext, { id }: { id: string }) {
    const sessionModel = await this.db.select().from(session).where(eq(session.userId, id));
    if (sessionModel.length === 0) {
      ctx.logger.warn(`Session with id ${id} not found.`);
      return null;
    }
    return UserSessionEntity.fromModel(sessionModel[0]);
  }
}
