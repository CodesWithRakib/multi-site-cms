/**
 * Category Hierarchy Cycle Validator.
 *
 * Prevents circular references in parent-child category hierarchies.
 */

export interface CategoryLookupItem {
  id: string;
  parentId: string | null;
}

export function validateCategoryHierarchy(
  categoryId: string,
  proposedParentId: string | null,
  allCategories: CategoryLookupItem[],
): { isValid: boolean; error?: string } {
  if (!proposedParentId) {
    return { isValid: true };
  }

  if (proposedParentId === categoryId) {
    return {
      isValid: false,
      error: 'A category cannot have itself as its parent',
    };
  }

  const categoryMap = new Map<string, string | null>();
  for (const cat of allCategories) {
    categoryMap.set(cat.id, cat.parentId);
  }

  // Walk up the ancestry tree from proposedParentId
  let currentId: string | null | undefined = proposedParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === categoryId) {
      return {
        isValid: false,
        error: 'Circular category hierarchy detected: the proposed parent is already a descendant',
      };
    }

    if (visited.has(currentId)) {
      return {
        isValid: false,
        error: 'Existing circular loop detected in category hierarchy',
      };
    }

    visited.add(currentId);
    currentId = categoryMap.get(currentId);
  }

  return { isValid: true };
}
