import { image } from '@template/database/schema';
import { getSharedEnv } from '@template/env/shared';

const env = getSharedEnv();

export type ImageModel = typeof image.$inferSelect;

export class ImageEntity {
  public readonly id: string;
  public readonly assetId: string;
  public readonly ownerId: string;
  public readonly width: number;
  public readonly height: number;

  private constructor(imageModel: ImageModel) {
    this.id = imageModel.id;
    this.assetId = imageModel.assetId;
    this.ownerId = imageModel.ownerId;
    this.width = imageModel.width;
    this.height = imageModel.height;
  }

  get url() {
    return `${env.SERVER_URL}/media/${this.assetId}`;
  }

  static fromModel(imageModel: ImageModel) {
    return new ImageEntity(imageModel);
  }
}
