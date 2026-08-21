"use client";

import React, { ReactNode } from "react";
import NavBar from "@/ui/NavBar";
import Steps from "@/features/feed/multiStepMMSourceForm/Steps";
import FeedFormHelpDrawer from "@/features/feed/FeedFormHelpDrawer";

export type FeedFormShellProps = {
  children: ReactNode;
  title?: string;
  asideExtra?: ReactNode;
  banner?: ReactNode;
};

export default function FeedFormShell({
  children,
  title,
  asideExtra,
  banner,
}: FeedFormShellProps) {
  return (
    <div className="drawer drawer-end flex-1">
      <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content min-h-full">
        {/* Page content here */}
        <div className="min-h-full flex flex-col">
          <NavBar title={title} hasHelpSection />
          <div className="bg-zinc-50 dark:bg-zinc-800 flex-1 flex items-stretch">
            <aside className="bg-base-100 w-1/2 max-w-sm p-10 overflow-auto border-r-base-200 border-r-4">
              <Steps />
              {asideExtra}
            </aside>
            <main className="flex-1 bg-base-100 p-10">
              {banner}
              {children}
            </main>
          </div>
        </div>
      </div>
      <FeedFormHelpDrawer />
    </div>
  );
}
