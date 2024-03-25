import { EditFormProvider } from "@/components/context/editFormContext";
import Summary from "@/components/Summary";
// import Glossary from "@/components/Glossary";
import NavBar from "@/app/NavBar";
import React from "react";
import HelpDrawer from "@/components/HelpDrawer";

export const dynamic = "force-dynamic";

export default function ContributeLayout({ children }) {
  // SideBar layout
  return (
    <div className="drawer drawer-end flex-1">
      <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content min-h-full">
        {/* Page content here */}
        <div className="min-h-full flex flex-col">
          <NavBar title="Edition" />
          <EditFormProvider>
            <div className="bg-zinc-50 dark:bg-zinc-800 flex-1 flex items-stretch">
              <aside className="bg-zinc-100 dark:bg-zinc-900 w-1/2 max-w-md p-10 border-r-4 border-zinc-300 dark:border-zinc-800 overflow-auto">
                <Summary />
              </aside>
              <main className="flex-1 bg-zinc-100 dark:bg-zinc-900 p-10">
                {children}
              </main>
            </div>
          </EditFormProvider>
        </div>
      </div>
      <HelpDrawer />
    </div>
  );
}
