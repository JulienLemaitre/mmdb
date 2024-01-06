import { EditFormProvider } from "@/components/context/editFormContext";
import Summary from "@/components/Summary";
import NavBar from "@/app/NavBar";

export default function ContributeLayout({ children }) {
  // SideBar layout
  return (
    <>
      <NavBar title="Edition" />
      <div className="bg-zinc-50 dark:bg-zinc-800 flex-1">
        <EditFormProvider>
          <div className="flex h-full">
            <aside className="bg-zinc-100 dark:bg-zinc-900 w-1/2 max-w-md p-10 border-r-4 border-zinc-300 dark:border-zinc-800 overflow-auto">
              <Summary />
            </aside>
            <main className="flex-1 bg-zinc-100 dark:bg-zinc-900 p-10">
              {children}
            </main>
          </div>
        </EditFormProvider>
      </div>
    </>
  );
}
