import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { getLocale } from "@/i18n/locale";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminLocaleProvider } from "@/components/admin-locale-context";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "admin" && role !== "superadmin") redirect("/dashboard");

  const locale = await getLocale();

  return (
    <AdminLocaleProvider initialLocale={locale}>
      <div className="min-h-screen bg-gray-50 lg:flex">
        <AdminSidebar canManageUsers={role === "superadmin"} />
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </AdminLocaleProvider>
  );
}
