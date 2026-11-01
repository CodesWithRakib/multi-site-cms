import { describe, expect, it } from '@jest/globals';
import type { SiteNavigationItem } from '@multi-site-cms/types';

import { ApiException } from '../../src/common/exceptions/api.exception';
import { validateNavigationItems } from '../../src/sites/utils/navigation-validator';

describe('validateNavigationItems', () => {
  it('accepts valid flat navigation items with relative and https URLs', () => {
    const items: SiteNavigationItem[] = [
      {
        id: 'home',
        label: 'Home',
        localeLabels: { en: 'Home', bn: 'হোম' },
        url: '/',
        order: 1,
        parentId: null,
        visibility: 'public',
      },
      {
        id: 'about',
        label: 'About',
        url: '/about',
        order: 2,
        parentId: null,
        visibility: 'public',
      },
      {
        id: 'external',
        label: 'External',
        url: 'https://example.com/docs',
        order: 3,
        parentId: null,
        visibility: 'public',
      },
    ];

    expect(() => validateNavigationItems(items)).not.toThrow();
  });

  it('accepts valid nested hierarchy', () => {
    const items: SiteNavigationItem[] = [
      {
        id: 'parent-1',
        label: 'Parent',
        url: '/parent',
        order: 1,
        parentId: null,
        visibility: 'public',
      },
      {
        id: 'child-1',
        parentId: 'parent-1',
        label: 'Child 1',
        url: '/parent/child-1',
        order: 1,
        visibility: 'public',
      },
      {
        id: 'grandchild-1',
        parentId: 'child-1',
        label: 'Grandchild',
        url: '/parent/child-1/grand',
        order: 1,
        visibility: 'public',
      },
    ];

    expect(() => validateNavigationItems(items)).not.toThrow();
  });

  it('rejects javascript: URLs', () => {
    const items: SiteNavigationItem[] = [
      {
        id: 'bad-1',
        label: 'Evil',
        url: 'javascript:alert(1)',
        order: 1,
        parentId: null,
        visibility: 'public',
      },
    ];

    expect(() => validateNavigationItems(items)).toThrow(ApiException);
    try {
      validateNavigationItems(items);
    } catch (err) {
      expect((err as ApiException).messageKey).toBe('settings.invalidUrl');
    }
  });

  it('rejects data: and vbscript: URLs', () => {
    const itemsData: SiteNavigationItem[] = [
      {
        id: 'bad-2',
        label: 'Data',
        url: 'data:text/html;base64,PHNjcmlwdD4=',
        order: 1,
        parentId: null,
        visibility: 'public',
      },
    ];
    expect(() => validateNavigationItems(itemsData)).toThrow(ApiException);
    try {
      validateNavigationItems(itemsData);
    } catch (err) {
      expect((err as ApiException).messageKey).toBe('settings.invalidUrl');
    }

    const itemsVb: SiteNavigationItem[] = [
      {
        id: 'bad-3',
        label: 'VBScript',
        url: 'vbscript:msgbox("hello")',
        order: 1,
        parentId: null,
        visibility: 'public',
      },
    ];
    expect(() => validateNavigationItems(itemsVb)).toThrow(ApiException);
  });

  it('rejects self-referential parentId', () => {
    const items: SiteNavigationItem[] = [
      {
        id: 'self-loop',
        parentId: 'self-loop',
        label: 'Loop',
        url: '/loop',
        order: 1,
        visibility: 'public',
      },
    ];

    expect(() => validateNavigationItems(items)).toThrow(ApiException);
    try {
      validateNavigationItems(items);
    } catch (err) {
      expect((err as ApiException).messageKey).toBe('settings.cycleDetected');
    }
  });

  it('rejects circular parentId references (A -> B -> A)', () => {
    const items: SiteNavigationItem[] = [
      { id: 'node-a', parentId: 'node-b', label: 'A', url: '/a', order: 1, visibility: 'public' },
      { id: 'node-b', parentId: 'node-a', label: 'B', url: '/b', order: 2, visibility: 'public' },
    ];

    expect(() => validateNavigationItems(items)).toThrow(ApiException);
    try {
      validateNavigationItems(items);
    } catch (err) {
      expect((err as ApiException).messageKey).toBe('settings.cycleDetected');
    }
  });

  it('rejects non-existent parentId', () => {
    const items: SiteNavigationItem[] = [
      {
        id: 'orphan',
        parentId: 'does-not-exist',
        label: 'Orphan',
        url: '/orphan',
        order: 1,
        visibility: 'public',
      },
    ];

    expect(() => validateNavigationItems(items)).toThrow(ApiException);
  });
});
