import { FeedFormProvider } from "@/context/feedFormContext";
import FeedFormShell from "@/features/feed/FeedFormShell";
import ResetAllForms from "@/features/feed/ResetAllForms";
import React, { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function FeedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <FeedFormProvider>
      <FeedFormShell
        title="Feeding the database"
        asideExtra={<ResetAllForms />}
      >
        {children}
      </FeedFormShell>
    </FeedFormProvider>
  );
}
