import NavBar from "@/ui/NavBar";
import React from "react";
// import FeedFormHelpDrawer from "@/features/feed/FeedFormHelpDrawer";

export const dynamic = "force-dynamic";

export default function FeedLayout({ children }) {
  return (
    <div className="min-h-full flex flex-col">
      <NavBar title="MM Source Review" />
      <div className="bg-zinc-50 dark:bg-zinc-800 flex-1 flex items-stretch">
        <main className="flex-1 bg-base-100 p-10">{children}</main>
      </div>
    </div>
  );
}
