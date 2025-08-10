type IsArray<T> = T extends Array<infer U> ? U : never;

export type DeepPartialWithoutArray<T> =
  T extends Array<IsArray<T>>
    ? T // If T is an array, just return T
    : T extends object
      ? {
          // If T is an object, recurse] into its properties
          [P in keyof T]?: DeepPartialWithoutArray<T[P]>;
        }
      : T; // For all other types, just return T
