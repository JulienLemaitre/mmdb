import { toastNotificationAction } from "./toastNotificationAction";
import {
  ToastNotificationAction,
  ToastNotificationState,
} from "@/types/toastNotificationTypes";

export const TOAST_NOTIFICATION_INITIAL_STATE = {
  notifications: [],
};

export const toastNotificationReducer = (
  state: ToastNotificationState,
  action: ToastNotificationAction,
) => {
  const { type, payload } = action;

  switch (type) {
    case toastNotificationAction.ADD:
      return { notifications: [...state.notifications, payload.notification] };
    case toastNotificationAction.DELETE: {
      const deleteNotifcation = state.notifications?.filter(
        (notification) => notification.id !== payload.id,
      );
      return { notifications: [...deleteNotifcation] };
    }
    case toastNotificationAction.INACTIVE: {
      const notifications = state.notifications?.map((notification) => {
        if (notification.id === payload.id) {
          return {
            ...notification,
            active: false,
          };
        }
        return notification;
      });
      return { notifications: [...notifications] };
    }
    default:
      return state;
  }
};
