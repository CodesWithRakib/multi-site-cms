import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Injectable, Logger } from '@nestjs/common';
import { env, resolveCloudinaryCredentials } from '../../config/env';
import type { StorageProvider, StorageUploadResult } from './storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly storageRoot: string;
  private readonly baseUrl: string;

  constructor() {
    this.storageRoot = path.resolve(
      process.env.MEDIA_STORAGE_DIR || path.join(process.cwd(), 'uploads'),
    );
    this.baseUrl = env.API_BASE_URL;

    if (!fs.existsSync(this.storageRoot)) {
      fs.mkdirSync(this.storageRoot, { recursive: true });
    }
  }

  private resolveSafePath(key: string): string {
    // Prevent directory traversal attacks
    const normalizedKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.resolve(this.storageRoot, normalizedKey);

    if (!fullPath.startsWith(this.storageRoot)) {
      throw new Error(`Invalid storage path traversal attempt: ${key}`);
    }

    return fullPath;
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<StorageUploadResult> {
    const fullPath = this.resolveSafePath(key);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, buffer);

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const byteSize = buffer.byteLength;

    return {
      key,
      byteSize,
      checksum,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      const fullPath = this.resolveSafePath(key);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete local media file ${key}: ${(error as Error).message}`);
    }
  }

  async getStream(key: string): Promise<Readable> {
    const fullPath = this.resolveSafePath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Media asset not found on disk: ${key}`);
    }

    return fs.createReadStream(fullPath);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(key);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }
    // Assets uploaded while Cloudinary was the active provider keep resolving
    // to Cloudinary, as long as the account is still configured.
    const cloudName = resolveCloudinaryCredentials(env)?.cloudName;
    if (key.startsWith('multi-site-cms/') && cloudName) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/${key}`;
    }
    const sanitizedKey = encodeURIComponent(key).replace(/%2F/g, '/');
    return `${this.baseUrl}/media/assets/${sanitizedKey}`;
  }
}
