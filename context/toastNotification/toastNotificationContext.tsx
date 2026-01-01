import { createContext, useCallback, useContext, useReducer } from "react";
import {
  TOAST_NOTIFICATION_INITIAL_STATE,
  toastNotificationReducer,
} from "@/context/toastNotification/toastNotificationReducer";
import { AnimatePresence, motion } from "framer-motion";
import { toastNotificationAction } from "@/context/toastNotification/toastNotificationAction";
import {
  Dispatch,
  ToastNotificationState,
} from "@/types/toastNotificationTypes";
import ToastNotificationCard from "@/ui/ToastNotificationCard";
import { getNewUuid } from "@/utils/getNewUuid";

export const ToastNotificationContext = createContext<
  | {
      state: ToastNotificationState;
      dispatch: Dispatch;
    }
  | undefined
>(undefined);

export function ToastNotificationProvider({ children }) {
  const [state, dispatch] = useReducer(
    toastNotificationReducer,
    TOAST_NOTIFICATION_INITIAL_STATE,
  );

  const showNotifications = useCallback(
    () => (
      <AnimatePresence mode="popLayout">
        {state.notifications.map(
          (notification) =>
            notification?.active && (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              >
                <ToastNotificationCard
                  type={notification?.type}
                  message={notification?.message}
                />
              </motion.div>
            ),
        )}
      </AnimatePresence>
    ),
    [state.notifications],
  );

  const value = {
    state,
    dispatch,
  };

  return (
    <>
      <ToastNotificationContext.Provider value={value}>
        <div className="w-full h-fit fixed left-0 top-0 pt-10 flex flex-col justify-center items-center gap-3 z-50">
          {showNotifications()}
        </div>
        {children}
      </ToastNotificationContext.Provider>
    </>
  );
}

const deleteNotifcation = (dispatch, id) => {
  dispatch({
    type: toastNotificationAction.DELETE,
    payload: { id },
  });
};

export const closeNotification = (dispatch, id) => {
  dispatch({
    type: toastNotificationAction.INACTIVE,
    payload: { id },
  });
  setTimeout(() => {
    deleteNotifcation(dispatch, id);
  }, 1000);
};

const notify = (dispatch, type, message) => {
  const notificationId = getNewUuid();
  dispatch({
    type: toastNotificationAction.ADD,
    payload: {
      notification: {
        id: notificationId,
        type: type,
        message: message,
        active: true,
      },
    },
  });
  setTimeout(() => {
    closeNotification(dispatch, notificationId);
  }, 6000);
  return notificationId;
};

export function useToastNotification() {
  const context = useContext(ToastNotificationContext);

  if (context === undefined) {
    throw new Error(
      "useNotification must be used within ToastNotificationContext",
    );
  }

  const { dispatch } = context;

  return {
    ...context,
    notify: (type, message) => notify(dispatch, type, message),
    closeNotification: (id) => closeNotification(dispatch, id),
  };
}
