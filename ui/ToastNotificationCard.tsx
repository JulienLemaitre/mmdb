import React, { useMemo } from "react";
import { toastNotificationAction } from "@/context/toastNotification";

function ToastNotificationCard({ type, message }) {
  const bgColor = useMemo(() => {
    switch (type) {
      case toastNotificationAction.ALERT:
        return "bg-info";
      case toastNotificationAction.ERROR:
        return "bg-error";
      case toastNotificationAction.SUCCESS:
        return "bg-success";
      case toastNotificationAction.WARNING:
        return "bg-warning";
      default:
        return "bg-gray-300";
    }
  }, [type]);

  return (
    <div className={`card w-96 ${bgColor} text-primary-content`}>
      <div className="card-body">
        <h2 className="card-title">Notification</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default ToastNotificationCard;
