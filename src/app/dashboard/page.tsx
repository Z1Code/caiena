import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { UserDashboard } from "@/components/user-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = session.user.role

  if (role === "superadmin" || role === "admin") {
    redirect("/dashboard/bookings")
  }

  return <UserDashboard session={session} />
}
