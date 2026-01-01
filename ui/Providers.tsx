"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ToastNotificationProvider } from "@/context/toastNotification/toastNotificationContext";

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <SessionProvider>
      <ToastNotificationProvider>{children}</ToastNotificationProvider>
    </SessionProvider>
  );
};

export default Providers;
