/**
 * Structured Rich-Text Editor Body Validator.
 *
 * Validates node-based editor documents (e.g., ProseMirror / Tiptap schema)
 * and sanitizes against stored XSS, script injection, and unsafe URI schemes.
 */

const DANGEROUS_SCHEMES = /^(javascript|data|vbscript):/i;
const MAX_DOCUMENT_DEPTH = 32;

export interface BodyValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateStructuredBody(body: unknown, depth = 0): BodyValidationResult {
  if (depth > MAX_DOCUMENT_DEPTH) {
    return {
      isValid: false,
      error: 'Structured body exceeds maximum allowed nesting depth of 32',
    };
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      isValid: false,
      error: 'Structured body must be a JSON object',
    };
  }

  const record = body as Record<string, unknown>;

  // Root must have a type
  if (typeof record.type !== 'string' || record.type.trim().length === 0) {
    return {
      isValid: false,
      error: 'Every node in the structured body must contain a non-empty string "type"',
    };
  }

  // Check text content
  if (record.text !== undefined) {
    if (typeof record.text !== 'string') {
      return {
        isValid: false,
        error: 'Node "text" property must be a string',
      };
    }
  }

  // Check node attributes for dangerous link schemes
  if (record.attrs && typeof record.attrs === 'object' && !Array.isArray(record.attrs)) {
    const attrs = record.attrs as Record<string, unknown>;
    if (typeof attrs.href === 'string') {
      const href = attrs.href.trim();
      if (DANGEROUS_SCHEMES.test(href)) {
        return {
          isValid: false,
          error: `Unsafe URL scheme in link attribute: "${href}"`,
        };
      }
    }
    if (typeof attrs.src === 'string') {
      const src = attrs.src.trim();
      if (DANGEROUS_SCHEMES.test(src)) {
        return {
          isValid: false,
          error: `Unsafe URL scheme in image source attribute: "${src}"`,
        };
      }
    }
  }

  // Check marks
  if (record.marks !== undefined) {
    if (!Array.isArray(record.marks)) {
      return {
        isValid: false,
        error: 'Node "marks" property must be an array',
      };
    }
    for (const mark of record.marks) {
      if (!mark || typeof mark !== 'object' || Array.isArray(mark)) {
        return {
          isValid: false,
          error: 'Every mark must be a JSON object',
        };
      }
      const markObj = mark as Record<string, unknown>;
      if (typeof markObj.type !== 'string') {
        return {
          isValid: false,
          error: 'Mark must contain a string "type"',
        };
      }
      if (markObj.attrs && typeof markObj.attrs === 'object' && !Array.isArray(markObj.attrs)) {
        const markAttrs = markObj.attrs as Record<string, unknown>;
        if (typeof markAttrs.href === 'string' && DANGEROUS_SCHEMES.test(markAttrs.href.trim())) {
          return {
            isValid: false,
            error: `Unsafe URL scheme in mark href attribute: "${markAttrs.href}"`,
          };
        }
      }
    }
  }

  // Check content children recursively
  if (record.content !== undefined) {
    if (!Array.isArray(record.content)) {
      return {
        isValid: false,
        error: 'Node "content" property must be an array',
      };
    }

    for (const child of record.content) {
      const childResult = validateStructuredBody(child, depth + 1);
      if (!childResult.isValid) {
        return childResult;
      }
    }
  }

  return { isValid: true };
}

/**
 * Recursively extracts plain text from a structured Tiptap / ProseMirror JSON document AST.
 */
export function extractTextFromDoc(node: unknown): string {
  if (!node || typeof node !== 'object') {
    return '';
  }

  const record = node as Record<string, unknown>;
  let text = '';

  if (typeof record.text === 'string') {
    text += record.text + ' ';
  }

  if (Array.isArray(record.content)) {
    for (const child of record.content) {
      text += extractTextFromDoc(child) + ' ';
    }
  }

  return text.trim();
}

/**
 * Calculates estimated reading time in whole minutes based on word count.
 * Average reading speed: 200 words per minute. Minimum returned is 1 minute.
 */
export function calculateReadingTimeMinutes(textOrWords: string | number): number {
  const wordCount =
    typeof textOrWords === 'number'
      ? textOrWords
      : textOrWords.trim().split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 200));
}
