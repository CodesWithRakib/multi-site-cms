import { describe, expect, it } from '@jest/globals';
import { validateCategoryHierarchy } from '../../src/taxonomy/utils/category-validator';

describe('validateCategoryHierarchy', () => {
  const existingCategories = [
    { id: 'cat-root', parentId: null },
    { id: 'cat-sub1', parentId: 'cat-root' },
    { id: 'cat-sub2', parentId: 'cat-sub1' },
    { id: 'cat-other', parentId: null },
  ];

  it('allows setting parent to null (root level)', () => {
    const result = validateCategoryHierarchy('cat-sub2', null, existingCategories);
    expect(result.isValid).toBe(true);
  });

  it('allows valid acyclic parent assignment', () => {
    const result = validateCategoryHierarchy('cat-sub2', 'cat-other', existingCategories);
    expect(result.isValid).toBe(true);
  });

  it('rejects self-referential parent (cat-sub1 as parent of cat-sub1)', () => {
    const result = validateCategoryHierarchy('cat-sub1', 'cat-sub1', existingCategories);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cannot have itself as its parent');
  });

  it('rejects circular hierarchy (cat-root -> cat-sub1 -> cat-sub2 -> cat-root)', () => {
    // Attempting to make cat-sub2 the parent of cat-root
    const result = validateCategoryHierarchy('cat-root', 'cat-sub2', existingCategories);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Circular category hierarchy detected');
  });
});
