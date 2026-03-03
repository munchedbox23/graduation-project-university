import type { Nullable } from "../types";

export function setItemToLocalStorage<T>(key: string, value?: Nullable<T>): void {
  if (value === undefined) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
