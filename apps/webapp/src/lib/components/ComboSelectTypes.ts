export type SelectionType = {
  value: string;
  label: string;
  disabled?: boolean;
};
export type OptionFunction<T extends IDRecord> = (data: T) => SelectionType;
export type DisplayFunction<T extends IDRecord> = (data: T) => {
  group?: string;
  title: string;
};
export type IDRecord = {
  id: string;
};
