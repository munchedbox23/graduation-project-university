export function getItemFromLocalStorage<T = any>(key: string): T | undefined {
  const itemFromLocalStorage = localStorage.getItem(key);

  if (!itemFromLocalStorage) return undefined;

  try {
    return JSON.parse(itemFromLocalStorage) as T;
  } catch {
    return itemFromLocalStorage as unknown as T;
  }
}
