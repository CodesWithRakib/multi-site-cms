import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { env } from '../../config/env';
import type { StorageProvider, StorageUploadResult } from './storage-provider.interface';

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  readonly name = 'cloudinary';
  private readonly logger = new Logger(CloudinaryStorageProvider.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (process.env.API_BASE_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, '');

    // Configure Cloudinary with environment variables
    const cloudName = env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'cdikzkfd';
    const apiKey = env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || '956222911712727';
    const apiSecret =
      env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || 'B_zamtWcgoVw-CYtm17ssQZH1tw';

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.logger.log(`CloudinaryStorageProvider initialized for cloud: ${cloudName}`);
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<StorageUploadResult> {
    // Format public_id without file extension
    const cleanKey = key.replace(/\.[^/.]+$/, '').replace(/^[\\/]+/, '');
    const publicId = cleanKey.startsWith('multi-site-cms/') ? cleanKey : `multi-site-cms/${cleanKey}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'auto',
          overwrite: true,
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error(`Cloudinary upload failed for ${publicId}: ${error?.message}`);
            return reject(error || new Error('Cloudinary upload returned empty response'));
          }

          const checksum =
            result.etag || crypto.createHash('sha256').update(buffer).digest('hex');

          resolve({
            key: result.public_id,
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

  async delete(key: string): Promise<void> {
    try {
      const res = await cloudinary.uploader.destroy(key, { resource_type: 'image' });
      if (res.result === 'not found') {
        const rawRes = await cloudinary.uploader.destroy(key, { resource_type: 'raw' });
        if (rawRes.result === 'not found') {
          await cloudinary.uploader.destroy(key, { resource_type: 'video' });
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to destroy Cloudinary asset ${key}: ${(error as Error).message}`);
    }
  }

  async getStream(key: string): Promise<Readable> {
    const url = this.getUrl(key);
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch media stream from Cloudinary: ${url} (status: ${response.status})`);
    }

    return Readable.fromWeb(response.body as unknown as import('node:stream/web').ReadableStream);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await cloudinary.api.resource(key);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }

    // If it's a Cloudinary public ID
    if (key.startsWith('multi-site-cms/')) {
      return cloudinary.url(key, {
        secure: true,
        resource_type: 'auto',
      });
    }

    // Fallback for existing local storage keys
    const sanitizedKey = encodeURIComponent(key).replace(/%2F/g, '/');
    return `${this.baseUrl}/media/assets/${sanitizedKey}`;
  }
}
