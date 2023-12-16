import { EditFormProvider } from "@/components/context/editFormContext";
import Summary from "@/components/Summary";
import NavBar from "@/app/NavBar";

export default function ContributeLayout({ children }) {
  // SideBar layout
  return (
    <>
      <NavBar title="Edition" />
      <div className="bg-gray-100 flex-1">
        <EditFormProvider>
          <div className="flex h-full">
            <aside className="bg-slate-100 w-80 p-10 border-r-4 border-slate-200">
              <Summary />
            </aside>
            <main className="flex-1 bg-slate-100 p-10">{children}</main>
          </div>
        </EditFormProvider>
      </div>
    </>
  );
}
