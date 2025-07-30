/// <reference types="vite-plugin-pwa/info" />
import "unplugin-icons/types/svelte";

declare global {
  namespace App {
    interface Locals {
      session: import("@totallator/database").SessionDBType | undefined;
      user: import("@totallator/database").UserDBType | undefined;
      db: import("@totallator/database").DBType;
    }
  }
}

// THIS IS IMPORTANT!!!
export {};
