import NavBar from "@/ui/NavBar";
import React from "react";
import ReviewHelpDrawer from "@/features/review/components/ReviewHelpDrawer";

export const dynamic = "force-dynamic";

export default function FeedLayout({ children }) {
  return (
    <div className="drawer drawer-end min-h-full flex flex-col">
      <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content min-h-full">
        {/* Page content here */}
        <div className="min-h-full flex flex-col">
          <NavBar title="MM Source Review" hasHelpSection />
          <div className="bg-zinc-50 dark:bg-zinc-800 flex-1 flex items-stretch">
            <main className="flex-1 bg-base-100 p-10">{children}</main>
          </div>
        </div>
      </div>
      <ReviewHelpDrawer />
    </div>
  );
}
