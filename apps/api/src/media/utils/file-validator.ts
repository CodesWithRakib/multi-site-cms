export interface FileValidationResult {
  isValid: boolean;
  detectedMimeType: string | null;
  sanitizedBuffer?: Buffer;
  width?: number | null;
  height?: number | null;
  error?: string;
}

export function validateAndInspectFile(
  buffer: Buffer,
  declaredMimeType: string,
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, detectedMimeType: null, error: 'File is empty.' };
  }

  // 1. Check Magic Bytes
  const mime = declaredMimeType.toLowerCase().trim();

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    let width: number | null = null;
    let height: number | null = null;
    if (buffer.length >= 24) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    }
    return {
      isValid: mime === 'image/png' || mime === 'application/octet-stream',
      detectedMimeType: 'image/png',
      width,
      height,
    };
  }

  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    const dimensions = extractJpegDimensions(buffer);
    return {
      isValid: mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'application/octet-stream',
      detectedMimeType: 'image/jpeg',
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    return {
      isValid: mime === 'image/gif' || mime === 'application/octet-stream',
      detectedMimeType: 'image/gif',
      width,
      height,
    };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    const dimensions = extractWebpDimensions(buffer);
    return {
      isValid: mime === 'image/webp' || mime === 'application/octet-stream',
      detectedMimeType: 'image/webp',
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  // PDF: %PDF
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return {
      isValid: mime === 'application/pdf' || mime === 'application/octet-stream',
      detectedMimeType: 'application/pdf',
      width: null,
      height: null,
    };
  }

  // MP4 / AVIF: offset 4-7 'ftyp'
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.toString('ascii', 8, 12);
    if (brand.includes('avif') || brand.includes('avis')) {
      return {
        isValid: mime === 'image/avif' || mime === 'application/octet-stream',
        detectedMimeType: 'image/avif',
        width: null,
        height: null,
      };
    }
    return {
      isValid: mime === 'video/mp4' || mime === 'application/octet-stream',
      detectedMimeType: 'video/mp4',
      width: null,
      height: null,
    };
  }

  // SVG: Check for SVG tags and sanitize
  if (mime === 'image/svg+xml' || mime === 'image/svg') {
    const text = buffer.toString('utf-8');
    if (text.includes('<svg') && !text.includes('<?php')) {
      const sanitized = sanitizeSvg(text);
      return {
        isValid: true,
        detectedMimeType: 'image/svg+xml',
        sanitizedBuffer: Buffer.from(sanitized, 'utf-8'),
        width: null,
        height: null,
      };
    }
  }

  return {
    isValid: false,
    detectedMimeType: null,
    error: `File signature does not match declared MIME type (${declaredMimeType}).`,
  };
}

function extractJpegDimensions(buffer: Buffer): { width: number | null; height: number | null } {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      break;
    }
    const marker = buffer[offset + 1];
    // Baseline SOF0 or Progressive SOF2
    if (marker === 0xc0 || marker === 0xc2) {
      if (offset + 8 < buffer.length) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      break;
    }
    // Skip variable-length marker
    if (offset + 3 >= buffer.length) break;
    const length = buffer.readUInt16BE(offset + 2);
    offset += 2 + length;
  }
  return { width: null, height: null };
}

function extractWebpDimensions(buffer: Buffer): { width: number | null; height: number | null } {
  if (buffer.length < 30) return { width: null, height: null };
  const chunkHeader = buffer.toString('ascii', 12, 16);

  if (chunkHeader === 'VP8X' && buffer.length >= 30) {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }

  if (chunkHeader === 'VP8 ' && buffer.length >= 30) {
    const startCode = buffer.readUIntLE(23, 3);
    if (startCode === 0x2a019d) {
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      return { width, height };
    }
  }

  if (chunkHeader === 'VP8L' && buffer.length >= 25) {
    const b0 = buffer[21] ?? 0;
    const b1 = buffer[22] ?? 0;
    const b2 = buffer[23] ?? 0;
    const b3 = buffer[24] ?? 0;
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }

  return { width: null, height: null };
}

export function sanitizeSvg(svgContent: string): string {
  // Strip dangerous elements and script handlers
  return svgContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\bon\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"')
    .replace(/xlink:href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'xlink:href="#"');
}
