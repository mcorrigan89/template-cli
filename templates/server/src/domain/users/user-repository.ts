import { dbSymbol } from '@/lib/di.ts';
import { Database } from '@template/database';
import { user } from '@template/database/schema';
import { eq } from 'drizzle-orm';
import { inject } from 'inversify';
import { UserEntity } from './user-entity.ts';

export class UserRepository {
  constructor(@inject(dbSymbol) private db: Database) {}

  public async userById({ id }: { id: string }): Promise<UserEntity | null> {
    const userModel = await this.db.select().from(user).where(eq(user.id, id));
    if (userModel.length === 0) {
      return null;
    }
    return UserEntity.fromModel(userModel[0]);
  }
}
