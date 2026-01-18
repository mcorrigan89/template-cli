import { getSharedEnv } from '@template/env/shared';
import fs from 'fs/promises';
import { injectable } from 'inversify';
import path from 'path';
import sharp from 'sharp';

const MAX_DIMENSION = 1920;

interface ImageStorage {
  saveImage(buffer: Buffer, filename: string): Promise<string>;
  getImageUrl(filename: string): string;
}

@injectable()
export class ImageRepository implements ImageStorage {
  private basePath: string;
  private baseUrl: string;

  constructor(basePath: string = 'uploads') {
    const env = getSharedEnv();
    this.basePath = basePath;
    this.baseUrl = env.SERVER_URL;
  }

  public async saveImage(buffer: Buffer, filename: string): Promise<string> {
    const filePath = path.join(this.basePath, filename);
    const resizedBuffer = await this.resizeImageForSaving(buffer);
    await fs.writeFile(filePath, resizedBuffer);
    return this.getImageUrl(filename);
  }

  public getImageUrl(filename: string): string {
    return `${this.baseUrl}/${filename}`;
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

        return sharp(buffer).resize(newWidth, newHeight).toFormat('webp').toBuffer();
      }
    }
    return sharp(buffer).toFormat('webp').toBuffer();
  }
}
