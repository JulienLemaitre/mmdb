import { FeedFormProvider } from "@/context/feedFormContext";
import NavBar from "@/ui/NavBar";
import React from "react";
import HelpDrawer from "@/ui/HelpDrawer";
import Steps from "@/features/feed/multiStepMMSourceForm/Steps";
import ResetAllForms from "@/features/feed/ResetAllForms";
import ReviewEditBanner from "@/features/review/ReviewEditBanner";

export const dynamic = "force-dynamic";

export default function FeedLayout({ children }) {
  return (
    <div className="drawer drawer-end flex-1">
      <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
      <FeedFormProvider>
        <div className="drawer-content min-h-full">
          {/* Page content here */}
          <div className="min-h-full flex flex-col">
            <NavBar title="Feeding the database" isFeedForm />
            <div className="bg-zinc-50 dark:bg-zinc-800 flex-1 flex items-stretch">
              <aside className="bg-base-100 w-1/2 max-w-sm p-10 overflow-auto border-r-base-200 border-r-4">
                <Steps />
                <ResetAllForms />
              </aside>
              <main className="flex-1 bg-base-100 p-10">
                {/* Review edit-mode banner (only visible when feed form is opened from review) */}
                <ReviewEditBanner />
                {children}
              </main>
            </div>
          </div>
        </div>
        <HelpDrawer />
      </FeedFormProvider>
    </div>
  );
}
