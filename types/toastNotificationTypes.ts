import { toastNotificationAction } from "@/context/toastNotification";

export type ToastNotificationAction = {
  type: keyof typeof toastNotificationAction;
  payload: any;
};
export type ToastNotificationState = {
  notifications: any[];
};
export type Dispatch = (action: ToastNotificationAction) => void;
