import { UserContext } from '@/lib/context.ts';
import { dbSymbol } from '@/lib/di.ts';
import { Database } from '@template/database';
import { image, session, user } from '@template/database/schema';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { UserEntity, UserSessionEntity } from './user-entity.ts';

@injectable()
export class UserRepository {
  constructor(@inject(dbSymbol) private db: Database) {}

  public async userById(ctx: UserContext, { id }: { id: string }): Promise<UserEntity | null> {
    const userModel = await this.db
      .select()
      .from(user)
      .leftJoin(image, eq(user.imageId, image.id))
      .where(eq(user.id, id));
    if (userModel.length === 0) {
      ctx.logger.warn(`User with id ${id} not found.`);
      return null;
    }
    return UserEntity.fromModel(userModel[0].user, userModel[0].image ?? undefined);
  }

  public async sessionByUserId(ctx: UserContext, { id }: { id: string }) {
    const sessionModel = await this.db.select().from(session).where(eq(session.userId, id));
    if (sessionModel.length === 0) {
      ctx.logger.warn(`Session with id ${id} not found.`);
      return null;
    }
    return UserSessionEntity.fromModel(sessionModel[0]);
  }

  public async save(ctx: UserContext, userEntity: UserEntity): Promise<UserEntity> {
    ctx.logger.info(`Saving user with id: ${userEntity.id}`);
    const userModel = await this.db
      .insert(user)
      .values({
        id: userEntity.id,
        name: userEntity.name,
        email: userEntity.email,
        emailVerified: userEntity.emailVerified,
        imageId: userEntity.avatarId,
      })
      .onConflictDoUpdate({
        target: user.id,
        set: {
          name: userEntity.name,
          email: userEntity.email,
          emailVerified: userEntity.emailVerified,
          imageId: userEntity.avatarId,
        },
      })
      .returning();
    return UserEntity.fromModel(userModel[0]);
  }
}
