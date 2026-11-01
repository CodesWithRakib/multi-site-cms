import { Readable } from 'node:stream';

export interface UploadedFilePayload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StorageUploadResult {
  key: string;
  byteSize: number;
  checksum: string;
}

export interface StorageProvider {
  readonly name: string;

  upload(key: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult>;

  delete(key: string): Promise<void>;

  getStream(key: string): Promise<Readable>;

  exists(key: string): Promise<boolean>;

  getUrl(key: string): string;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
