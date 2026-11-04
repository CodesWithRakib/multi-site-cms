import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { env, resolveCloudinaryCredentials } from '../../config/env';
import type { StorageProvider, StorageUploadResult } from './storage-provider.interface';

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  readonly name = 'cloudinary';
  private readonly logger = new Logger(CloudinaryStorageProvider.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = env.API_BASE_URL;

    // The module instantiates this provider even when local storage is selected,
    // so missing credentials leave it unconfigured instead of failing boot.
    // `parseEnv` already rejects STORAGE_PROVIDER=cloudinary without credentials.
    const credentials = resolveCloudinaryCredentials(env);
    if (!credentials) {
      return;
    }

    cloudinary.config({
      cloud_name: credentials.cloudName,
      api_key: credentials.apiKey,
      api_secret: credentials.apiSecret,
      secure: true,
    });

    this.logger.log(`CloudinaryStorageProvider initialized for cloud: ${credentials.cloudName}`);
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    const cleanKey = key.replace(/\.[^/.]+$/, '').replace(/^[\\/]+/, '');
    const publicId = cleanKey.startsWith('multi-site-cms/')
      ? cleanKey
      : `multi-site-cms/${cleanKey}`;
    const isVideo = mimeType.startsWith('video/') || mimeType.startsWith('audio/');
    const isImage = mimeType.startsWith('image/') && mimeType !== 'image/svg+xml';
    const resourceType = isVideo ? 'video' : isImage ? 'image' : 'auto';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          overwrite: true,
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error(`Cloudinary upload failed for ${publicId}: ${error?.message}`);
            return reject(error || new Error('Cloudinary upload returned empty response'));
          }

          const checksum = result.etag || crypto.createHash('sha256').update(buffer).digest('hex');

          resolve({
            key: result.secure_url || result.public_id,
            byteSize: result.bytes,
            checksum,
          });
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  private extractPublicId(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      const parts = key.split('/upload/');
      if (parts[1]) {
        const afterUpload = parts[1].replace(/^v\d+\//, '');
        return afterUpload.replace(/\.[^/.]+$/, '');
      }
    }
    return key.replace(/\.[^/.]+$/, '');
  }

  async delete(key: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(key);
      const res = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      if (res.result === 'not found') {
        const rawRes = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        if (rawRes.result === 'not found') {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to destroy Cloudinary asset ${key}: ${(error as Error).message}`);
    }
  }

  async getStream(key: string): Promise<Readable> {
    if (
      key.startsWith('multi-site-cms/') ||
      key.startsWith('http://') ||
      key.startsWith('https://')
    ) {
      const url = this.getUrl(key);
      const response = await fetch(url);
      if (!response.ok || !response.body) {
        throw new Error(
          `Failed to fetch media stream from Cloudinary: ${url} (status: ${response.status})`,
        );
      }

      return Readable.fromWeb(response.body as unknown as import('node:stream/web').ReadableStream);
    }

    // Local file fallback
    const resolvedPath = path.resolve(process.cwd(), 'uploads', key);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Local media file not found: ${resolvedPath}`);
    }
    return fs.createReadStream(resolvedPath);
  }

  async exists(key: string): Promise<boolean> {
    if (
      key.startsWith('multi-site-cms/') ||
      key.startsWith('http://') ||
      key.startsWith('https://')
    ) {
      const publicId = this.extractPublicId(key);
      try {
        await cloudinary.api.resource(publicId);
        return true;
      } catch {
        return false;
      }
    }
    const resolvedPath = path.resolve(process.cwd(), 'uploads', key);
    return fs.existsSync(resolvedPath);
  }

  getUrl(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }

    if (key.startsWith('multi-site-cms/')) {
      return cloudinary.url(key, {
        secure: true,
      });
    }

    // Fallback for existing local storage keys
    const sanitizedKey = encodeURIComponent(key).replace(/%2F/g, '/');
    return `${this.baseUrl}/media/assets/${sanitizedKey}`;
  }
}
