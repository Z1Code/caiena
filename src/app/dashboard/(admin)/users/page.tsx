import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { AdminUsersTab } from "@/components/admin-users-tab";

export default async function UsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") redirect("/dashboard/bookings");
  return <AdminUsersTab />;
}
