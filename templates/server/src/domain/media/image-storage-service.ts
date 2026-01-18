import { getSharedEnv } from '@template/env/shared';
import fs from 'fs/promises';
import { injectable } from 'inversify';
import path from 'path';
import sharp from 'sharp';

const MAX_DIMENSION = 1920;

interface ImageStorage {
  saveImage({ buffer, filename }: { buffer: Buffer; filename: string }): Promise<{
    buffer: Buffer;
    width: number;
    height: number;
  }>;
  getImageUrl(filename: string): string;
}

@injectable()
export class ImageStorageService implements ImageStorage {
  private basePath: string;
  private baseUrl: string;

  constructor(basePath: string = 'uploads') {
    const env = getSharedEnv();
    this.basePath = path.resolve(process.cwd(), '../..', basePath);
    this.baseUrl = env.SERVER_URL;
  }

  public async saveImage({ buffer, filename }: { buffer: Buffer; filename: string }) {
    const filePath = path.join(this.basePath, filename);
    const { buffer: savedBuffer, height, width } = await this.resizeImageForSaving(buffer);
    await fs.writeFile(filePath, savedBuffer);
    return {
      buffer: savedBuffer,
      width: width,
      height: height,
    };
  }

  public async getImageBlob(filename: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, filename);
    const imageBuffer = await fs.readFile(filePath);
    return imageBuffer;
  }

  public getImageUrl(filename: string): string {
    return `${this.baseUrl}/media/${filename}`;
  }

  private async resizeImageForSaving(buffer: Buffer) {
    const metadata = await sharp(buffer).metadata();

    if (metadata.width && metadata.height) {
      if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
        const aspectRatio = metadata.width / metadata.height;
        let newWidth: number;
        let newHeight: number;

        if (aspectRatio > 1) {
          newWidth = MAX_DIMENSION;
          newHeight = Math.round(MAX_DIMENSION / aspectRatio);
        } else {
          newHeight = MAX_DIMENSION;
          newWidth = Math.round(MAX_DIMENSION * aspectRatio);
        }

        return {
          buffer: await sharp(buffer).resize(newWidth, newHeight).toFormat('webp').toBuffer(),
          width: newWidth,
          height: newHeight,
        };
      } else {
        return {
          buffer: await sharp(buffer).toFormat('webp').toBuffer(),
          width: metadata.width,
          height: metadata.height,
        };
      }
    } else {
      throw new Error('Unable to determine image dimensions.');
    }
  }
}
