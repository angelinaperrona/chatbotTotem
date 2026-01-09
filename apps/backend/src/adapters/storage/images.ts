import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export interface ImageStorage {
  store(buffer: Buffer): Promise<string>;
  getUrl(imageId: string): string;
  delete(imageId: string): Promise<void>;
  exists(imageId: string): Promise<boolean>;
}

const IMAGES_DIR = path.join(process.cwd(), "data", "uploads", "images");
const MAX_SIZE = 1024;
const JPEG_QUALITY = 85;

async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(MAX_SIZE, MAX_SIZE, { fit: "inside" })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export const LocalImageStorage: ImageStorage = {
  async store(buffer: Buffer): Promise<string> {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });

    const optimized = await optimizeImage(buffer);
    const id = generateId();
    const filePath = path.join(IMAGES_DIR, `${id}.jpg`);

    await Bun.write(filePath, optimized);
    return id;
  },

  getUrl(imageId: string): string {
    return `/static/images/${imageId}.jpg`;
  },

  async delete(imageId: string): Promise<void> {
    const filePath = path.join(IMAGES_DIR, `${imageId}.jpg`);
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File might not exist, ignore
    }
  },

  async exists(imageId: string): Promise<boolean> {
    const filePath = path.join(IMAGES_DIR, `${imageId}.jpg`);
    return fs.existsSync(filePath);
  },
};

export const imageStorage = LocalImageStorage;
