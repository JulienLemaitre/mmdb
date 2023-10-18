import { EditFormProvider } from "@/components/context/editFormContext";
import Summary from "@/components/Summary";

export default function ContributeLayout({ children }) {
  // SideBar layout
  return (
    <EditFormProvider>
      <div className="flex h-full">
        <aside className="bg-base-100 w-80 p-10">
          <Summary />
        </aside>
        <main className="flex-1 bg-base-200 p-10">{children}</main>
      </div>
    </EditFormProvider>
  );
}
