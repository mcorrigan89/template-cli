import { UserContext } from '@/lib/context.ts';
import { inject, injectable } from 'inversify';
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
      return this.userRepository.userById(ctx, { id: ctx.currentUserId });
    }
    return null;
  }
}
