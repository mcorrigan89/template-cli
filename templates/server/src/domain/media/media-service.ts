import { UserContext } from '@/lib/context.ts';
import { inject, injectable } from 'inversify';
import { UserService } from '../users/user-service.ts';
import { ImageRepository } from './image-repository.ts';

@injectable()
export class MediaService {
  constructor(
    @inject(ImageRepository) private imageRepository: ImageRepository,
    @inject(UserService) private userService: UserService
  ) {}

  public async uploadAvatarImage(
    ctx: UserContext,
    userId: string,
    imageBuffer: Buffer
  ): Promise<string> {
    ctx.logger.info(`Uploading avatar image for user id: ${userId}`);

    const user = await this.userService.getUserById(ctx, { id: userId });
    if (!user) {
      throw new Error(`User with id ${userId} not found.`);
    }
    const uploadedImageUrl = await this.imageRepository.saveImage(
      imageBuffer,
      `avatar_${userId}.webp`
    );
    await this.userService.save(ctx, user);

    return uploadedImageUrl;
  }
}
