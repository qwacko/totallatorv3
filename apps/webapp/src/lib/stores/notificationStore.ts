// src/stores/notificationStore.ts
import { nanoid } from "nanoid";
import { get, writable } from "svelte/store";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number;
  dismissable?: boolean;
  creationTime: Date;
  targetClosing?: Date | undefined;
  // Add more properties if needed (e.g., actions)
}

interface NotificationStore {
  subscribe: (
    this: void,
    run: import("svelte/store").Subscriber<Notification[]>,
    invalidate?: (value?: Notification[]) => void,
  ) => import("svelte/store").Unsubscriber;
  send: (
    notification: Omit<Notification, "id" | "creationTime" | "targetClosing">,
  ) => void;
  dismiss: (id: string) => void;
  clear: () => void;
  listAll: () => Notification[];
}

function createNotificationStore(): NotificationStore {
  const { subscribe, update } = writable<Notification[]>([]);

  return {
    subscribe,

    send: (notification) => {
      const id = nanoid(); // Simple unique ID generator
      const creationTime = new Date();
      //If lduration is set, then adds this to the creation time, otherwise is undefined
      const targetClosing = notification.duration
        ? new Date(creationTime.getTime() + notification.duration)
        : undefined;
      update((notifications) => [
        ...notifications,
        { ...notification, id, creationTime, targetClosing },
      ]);

      // Automatically dismiss the notification if timeout is set
      if (notification.duration) {
        setTimeout(() => {
          update((notifications) => notifications.filter((n) => n.id !== id));
        }, notification.duration);
      }

      return id;
    },

    dismiss: (id) => {
      update((notifications) => notifications.filter((n) => n.id !== id));
    },

    clear: () => {
      update(() => []);
    },
    listAll: () => get({ subscribe }),
  };
}

export const notificationStore = createNotificationStore();
