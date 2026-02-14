import { UserContext } from '@/lib/context.ts';
import { inject, injectable } from 'inversify';
import { UserService } from '../users/user-service.ts';
import { ImageRepository } from './image-repository.ts';
import { ImageStorageService } from './image-storage-service.ts';

@injectable()
export class MediaService {
  constructor(
    @inject(ImageStorageService) private imageStorageService: ImageStorageService,
    @inject(ImageRepository) private imageRepository: ImageRepository,
    @inject(UserService) private userService: UserService
  ) {}

  public getImageBlob(filename: string): Promise<Buffer> {
    return this.imageStorageService.getImageBlob(filename);
  }

  public async uploadAvatarImage(
    ctx: UserContext,
    userId: string,
    imageBuffer: Buffer
  ): Promise<string> {
    ctx.logger.trace(`Uploading avatar image for user id: ${userId}`);

    const user = await this.userService.getUserById(ctx, { id: userId });
    if (!user) {
      throw new Error(`User with id ${userId} not found.`);
    }

    const assetId = `avatar_${userId}_${crypto.randomUUID()}.webp`;

    const { height, width } = await this.imageStorageService.saveImage({
      buffer: imageBuffer,
      filename: assetId,
    });

    const imageEntity = await this.imageRepository.saveImage({
      id: crypto.randomUUID(),
      assetId: assetId,
      ownerId: userId,
      width: width,
      height: height,
    });

    user.setAvatar(imageEntity);
    await this.userService.save(ctx, user);

    return this.imageStorageService.getImageUrl(assetId);
  }
}
