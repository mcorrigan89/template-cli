import sharp from 'sharp';

const MAX_DIMENSION = 1920;

export async function resizeImageForSaving(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  console.log(metadata);
}
