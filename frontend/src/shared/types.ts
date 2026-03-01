export type Nullable<T> = T | null;
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type OptionalRecord<K extends keyof any, T> = Partial<{
  [P in K]: T;
}>;
