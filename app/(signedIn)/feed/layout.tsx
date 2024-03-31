import { FeedFormProvider } from "@/components/context/feedFormContext";
import NavBar from "@/app/NavBar";
import React from "react";
import HelpDrawer from "@/components/HelpDrawer";
import Steps from "@/components/multiStepForm/Steps";

export const dynamic = "force-dynamic";

export default function ContributeLayout({ children }) {
  return (
    <div className="drawer drawer-end flex-1">
      <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content min-h-full">
        {/* Page content here */}
        <div className="min-h-full flex flex-col">
          <NavBar title="Feeding the database" isFeedForm />
          <FeedFormProvider>
            <div className="bg-zinc-50 dark:bg-zinc-800 flex-1 flex items-stretch">
              <aside className="bg-base-100 w-1/2 max-w-sm p-10 overflow-auto">
                <Steps />
              </aside>
              <main className="flex-1 bg-zinc-100 dark:bg-zinc-900 p-10">
                {children}
              </main>
            </div>
          </FeedFormProvider>
        </div>
      </div>
      <HelpDrawer />
    </div>
  );
}
