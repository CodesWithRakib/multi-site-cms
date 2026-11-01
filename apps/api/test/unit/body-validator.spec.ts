import { describe, expect, it } from '@jest/globals';
import { validateStructuredBody } from '../../src/posts/utils/body-validator';

describe('validateStructuredBody', () => {
  it('accepts a valid rich-text editor document with paragraphs and headings', () => {
    const validDoc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome to Multi-Site CMS' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is a ' },
            {
              type: 'text',
              text: 'secure platform',
              marks: [{ type: 'bold' }],
            },
            {
              type: 'text',
              text: ' with safe links.',
              marks: [
                {
                  type: 'link',
                  attrs: { href: 'https://example.com/destinations' },
                },
              ],
            },
          ],
        },
      ],
    };

    const result = validateStructuredBody(validDoc);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects non-object body inputs', () => {
    expect(validateStructuredBody(null).isValid).toBe(false);
    expect(validateStructuredBody('raw text string').isValid).toBe(false);
    expect(validateStructuredBody([1, 2, 3]).isValid).toBe(false);
  });

  it('rejects documents without a type property', () => {
    const invalidDoc = {
      content: [{ type: 'text', text: 'Hello' }],
    };
    const result = validateStructuredBody(invalidDoc);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('non-empty string "type"');
  });

  it('rejects dangerous javascript: schemes in node attributes', () => {
    const maliciousDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { href: 'javascript:alert(document.cookie)' },
          content: [{ type: 'text', text: 'Click me' }],
        },
      ],
    };

    const result = validateStructuredBody(maliciousDoc);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsafe URL scheme');
  });

  it('rejects dangerous data: schemes in image attributes', () => {
    const maliciousDoc = {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: 'data:text/html,<script>alert(1)</script>' },
        },
      ],
    };

    const result = validateStructuredBody(maliciousDoc);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsafe URL scheme in image source');
  });

  it('rejects dangerous vbscript: schemes in mark attributes', () => {
    const maliciousDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Injected mark',
              marks: [{ type: 'link', attrs: { href: 'vbscript:msgbox(1)' } }],
            },
          ],
        },
      ],
    };

    const result = validateStructuredBody(maliciousDoc);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsafe URL scheme in mark href');
  });

  it('rejects documents that exceed maximum recursion depth', () => {
    // Generate a deeply nested structure (35 levels)
    let nested: Record<string, unknown> = { type: 'leaf', text: 'deep' };
    for (let i = 0; i < 35; i++) {
      nested = { type: 'wrapper', content: [nested] };
    }

    const result = validateStructuredBody(nested);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('maximum allowed nesting depth');
  });
});
