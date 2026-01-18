import { getSharedEnv } from '@template/env/shared';
import fs from 'fs/promises';
import path from 'path';

interface ImageStorage {
  saveImage(buffer: Buffer, filename: string): Promise<string>;
  getImageUrl(filename: string): string;
}

export class LocalImageStorage implements ImageStorage {
  private basePath: string;
  private baseUrl: string;

  constructor(basePath: string = 'uploads') {
    const env = getSharedEnv();
    this.basePath = basePath;
    this.baseUrl = env.SERVER_URL;
  }

  async saveImage(buffer: Buffer, filename: string): Promise<string> {
    const filePath = path.join(this.basePath, filename);
    await fs.writeFile(filePath, buffer);
    return this.getImageUrl(filename);
  }

  getImageUrl(filename: string): string {
    return `${this.baseUrl}/${filename}`;
  }
}
