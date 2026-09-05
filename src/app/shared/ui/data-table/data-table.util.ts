export type SortDirection = 'asc' | 'desc' | null;

/**
 * Filter an array of objects by search query across specified keys.
 */
export function filterTableData<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchKeys?: (keyof T | string)[]
): T[] {
  if (!items || items.length === 0) return [];
  const cleanQuery = (query || '').trim().toLowerCase();
  if (!cleanQuery) return [...items];

  return items.filter(item => {
    const keysToSearch = searchKeys && searchKeys.length > 0
      ? searchKeys
      : Object.keys(item);

    return keysToSearch.some(key => {
      const val = item[key as string];
      if (val == null) return false;
      return String(val).toLowerCase().includes(cleanQuery);
    });
  });
}

/**
 * Sort an array of objects by column key and direction (immutably).
 */
export function sortTableData<T extends Record<string, any>>(
  items: T[],
  sortKey: string | null,
  direction: SortDirection
): T[] {
  if (!items || items.length === 0 || !sortKey || !direction) {
    return [...items];
  }

  return [...items].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];

    if (valA == null && valB == null) return 0;
    if (valA == null) return direction === 'asc' ? -1 : 1;
    if (valB == null) return direction === 'asc' ? 1 : -1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return direction === 'asc' ? valA - valB : valB - valA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();

    if (strA < strB) return direction === 'asc' ? -1 : 1;
    if (strA > strB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Paginate an array of items for the active 1-indexed page.
 */
export function paginateTableData<T>(items: T[], page: number, pageSize: number): T[] {
  if (!items || items.length === 0) return [];
  const safePageSize = Math.max(1, pageSize || 10);
  const totalPages = Math.ceil(items.length / safePageSize);
  const safePage = Math.max(1, Math.min(page || 1, totalPages));

  const startIndex = (safePage - 1) * safePageSize;
  return items.slice(startIndex, startIndex + safePageSize);
}
