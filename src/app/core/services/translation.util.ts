export function resolveTranslation(
  key: string,
  dictionary: Record<string, string> | null,
  fallbackDictionary: Record<string, string> | null
): string {
  if (dictionary && dictionary[key]) {
    return dictionary[key];
  }
  if (fallbackDictionary && fallbackDictionary[key]) {
    return fallbackDictionary[key];
  }
  return key;
}
