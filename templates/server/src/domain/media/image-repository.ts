import { dbSymbol } from '@/lib/di.ts';
import { Database } from '@template/database';
import { image } from '@template/database/schema';
import { eq } from 'drizzle-orm';
import { inject } from 'inversify';

export class ImageRepository {
  constructor(@inject(dbSymbol) private db: Database) {}

  public async getImageById(id: string) {
    const imageModel = await this.db.select().from(image).where(eq(image.id, id));

    if (imageModel.length === 0) {
      return null;
    }

    return imageModel[0];
  }

  public async saveImage(imageData: {
    id: string;
    assetId: string;
    ownerId: string;
    width: number;
    height: number;
  }) {
    const result = await this.db
      .insert(image)
      .values({
        id: imageData.id,
        assetId: imageData.assetId,
        ownerId: imageData.ownerId,
        width: imageData.width,
        height: imageData.height,
      })
      .onConflictDoUpdate({
        target: image.id,
        set: {
          assetId: imageData.assetId,
          ownerId: imageData.ownerId,
          width: imageData.width,
          height: imageData.height,
        },
      })
      .returning();

    return result[0];
  }
}
