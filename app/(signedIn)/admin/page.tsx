import AdminDashboard from "@/features/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="w-full">
      <AdminDashboard />
    </div>
  );
}
