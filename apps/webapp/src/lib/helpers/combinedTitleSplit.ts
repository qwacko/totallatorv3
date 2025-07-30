export const combinedTitleSplitRequired = <Data extends { title: string }>({
  title,
}: Data) => {
  const [group, single] = title.split(":");
  if (group && single) {
    return { title, group, single };
  }

  return { title, group: "", single: group };
};

export const combinedTitleSplit = <Data extends { title?: string }>({
  title,
}: Data):
  | { title: string; group: string; single: string }
  | Record<string, never> => {
  if (title) {
    return combinedTitleSplitRequired({ title });
  }
  return {};
};
