import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { AdminNavBar } from "@/components/admin-nav-bar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "admin" && role !== "superadmin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavBar canManageUsers={role === "superadmin"} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
