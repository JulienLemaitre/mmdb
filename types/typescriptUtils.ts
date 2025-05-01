export function getTypedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof typeof obj>;
}

export type MakeRequired<Type, Key extends keyof Type> = Omit<Type, Key> &
  Required<Pick<Type, Key>>;

export type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> &
  Partial<Pick<Type, Key>>;

export type WithRequiredId<T extends { id?: string }> = MakeRequired<T, "id">;
