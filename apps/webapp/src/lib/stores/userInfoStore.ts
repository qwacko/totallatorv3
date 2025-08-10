import { derived, writable } from "svelte/store";

import type { UserDBType } from "@totallator/database";

export const userInfoUpdateStore = writable<UserDBType | undefined>();

export const userInfoStore = derived(userInfoUpdateStore, ($userInfoStore) => {
  if (!$userInfoStore) {
    const returnData: UserDBType = {
      id: "",
      admin: false,
      currencyFormat: "USD",
      dateFormat: "YYYY-MM-DD",
      name: "",
      username: "",
    };

    return returnData;
  }
  return $userInfoStore;
});

export const currencyFormat = derived(userInfoStore, ($userInfoStore) => {
  return $userInfoStore.currencyFormat;
});

export const userDateFormat = derived(userInfoStore, ($userInfoStore) => {
  return $userInfoStore.dateFormat;
});
