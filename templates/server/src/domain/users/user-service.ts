import { UserContext } from '@/lib/context.ts';
import { inject, injectable } from 'inversify';
import { UserEntity } from './user-entity.ts';
import { UserRepository } from './user-repository.ts';

@injectable()
export class UserService {
  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  public async getUserById(ctx: UserContext, { id }: { id: string }) {
    ctx.logger.info(`Fetching user with id: ${id}`);
    return this.userRepository.userById(ctx, { id });
  }

  public async currentUser(ctx: UserContext) {
    ctx.logger.info('Fetching current user');
    if (ctx.currentUserId) {
      const [userEntity, sessionEntity] = await Promise.all([
        this.userRepository.userById(ctx, { id: ctx.currentUserId }),
        this.userRepository.sessionByUserId(ctx, { id: ctx.currentUserId }),
      ]);
      return { userEntity, sessionEntity };
    }
    return { userEntity: null, sessionEntity: null };
  }

  public async save(ctx: UserContext, user: UserEntity) {
    ctx.logger.info(`Saving user with id: ${user.id}`);
    return this.userRepository.save(ctx, user);
  }
}
