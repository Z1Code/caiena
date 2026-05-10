import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"
import { UserDashboard } from "@/components/user-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = session.user.role

  if (role === "superadmin" || role === "admin") {
    return <AdminDashboard canManageUsers={role === "superadmin"} />
  }

  return <UserDashboard session={session} />
}
