import { loadConfigClient } from "$lib/routes";

export const init = async () => {
  await loadConfigClient();
};
