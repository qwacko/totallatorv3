export function filterNullUndefinedAndDuplicates<T>(
  arr: (T | null | undefined)[],
): T[] {
  const seen = new Set<T>();
  return arr.filter((item): item is T => {
    if (item !== null && item !== undefined && !seen.has(item)) {
      seen.add(item);
      return true;
    }
    return false;
  });
}
