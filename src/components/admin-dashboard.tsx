"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { AdminStaffTab } from "./admin-staff-tab";
import { AdminScheduleTab } from "./admin-schedule-tab";
import { AdminGroupsTab } from "./admin-groups-tab";
import { AdminServicesTab } from "./admin-services-tab";

interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  createdAt: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
}

interface Stats {
  today: { count: number; bookings: any[] };
  tomorrow: { count: number; bookings: any[] };
  totals: { confirmed: number; completed: number; revenue: number };
}

type ViewMode = "today" | "week";
type AdminTab = "reservas" | "staff" | "horarios" | "grupos" | "servicios";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("reservas");
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weekStart, setWeekStart] = useState(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.status === 401) { router.push("/admin/login"); return; }
    setStats(await res.json());
  }, [router]);

  const fetchBookings = useCallback(async (from: string, to: string) => {
    const res = await fetch(`/api/admin/bookings?from=${from}&to=${to}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    setBookings(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (viewMode === "today") {
      fetchBookings(selectedDate, selectedDate);
    } else {
      const end = format(addDays(new Date(weekStart + "T12:00:00"), 6), "yyyy-MM-dd");
      fetchBookings(weekStart, end);
    }
  }, [viewMode, selectedDate, weekStart, fetchBookings]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    // Refresh
    fetchStats();
    if (viewMode === "today") {
      fetchBookings(selectedDate, selectedDate);
    } else {
      const end = format(addDays(new Date(weekStart + "T12:00:00"), 6), "yyyy-MM-dd");
      fetchBookings(weekStart, end);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  // Time blocks for the schedule grid (9:00 - 18:00)
  const timeSlots = Array.from({ length: 19 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const min = (i % 2) * 30;
    return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
  });

  // Week days for week view
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(new Date(weekStart + "T12:00:00"), i), "yyyy-MM-dd")
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-semibold text-foreground">Caiena</span>
            <span className="text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">Ver sitio</a>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1">
          {(["reservas", "staff", "horarios", "grupos", "servicios"] as AdminTab[]).map((tab) => {
            const labels: Record<AdminTab, string> = { reservas: "Reservas", staff: "Empleadas", horarios: "Horarios", grupos: "Grupos", servicios: "Servicios" };
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-accent text-accent-dark" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Non-reservas tabs */}
        {activeTab === "servicios" && <AdminServicesTab />}
        {activeTab === "staff" && <AdminStaffTab />}
        {activeTab === "horarios" && <AdminScheduleTab />}
        {activeTab === "grupos" && <AdminGroupsTab />}

        {activeTab !== "reservas" ? null : <>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Hoy"
              value={stats.today.count}
              sub="citas"
              accent
            />
            <StatCard
              label="Manana"
              value={stats.tomorrow.count}
              sub="citas"
            />
            <StatCard
              label="Pendientes"
              value={stats.totals.confirmed}
              sub="confirmadas"
            />
            <StatCard
              label="Ingresos"
              value={`$${stats.totals.revenue}`}
              sub="completadas"
            />
          </div>
        )}

        {/* View Toggle + Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("today")}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                viewMode === "today"
                  ? "bg-accent text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                viewMode === "week"
                  ? "bg-accent text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Semana
            </button>
          </div>

          {viewMode === "today" ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedDate(format(subDays(new Date(selectedDate + "T12:00:00"), 1), "yyyy-MM-dd"))}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              >
                <ChevronLeft />
              </button>
              <div className="text-center min-w-[180px]">
                <span className="text-sm font-medium text-foreground capitalize">
                  {format(new Date(selectedDate + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
                </span>
                {selectedDate === todayStr && (
                  <span className="ml-2 text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full">Hoy</span>
                )}
              </div>
              <button
                onClick={() => setSelectedDate(format(addDays(new Date(selectedDate + "T12:00:00"), 1), "yyyy-MM-dd"))}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              >
                <ChevronRight />
              </button>
              {selectedDate !== todayStr && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-xs text-accent-dark hover:text-foreground"
                >
                  Hoy
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWeekStart(format(subWeeks(new Date(weekStart + "T12:00:00"), 1), "yyyy-MM-dd"))}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              >
                <ChevronLeft />
              </button>
              <span className="text-sm font-medium text-foreground min-w-[200px] text-center">
                {format(new Date(weekStart + "T12:00:00"), "d MMM", { locale: es })} -{" "}
                {format(addDays(new Date(weekStart + "T12:00:00"), 6), "d MMM yyyy", { locale: es })}
              </span>
              <button
                onClick={() => setWeekStart(format(addWeeks(new Date(weekStart + "T12:00:00"), 1), "yyyy-MM-dd"))}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              >
                <ChevronRight />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : viewMode === "today" ? (
          <DayView
            date={selectedDate}
            bookings={bookings.filter((b) => b.date === selectedDate)}
            timeSlots={timeSlots}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <WeekView
            weekDays={weekDays}
            bookings={bookings}
            timeSlots={timeSlots}
            todayStr={todayStr}
          />
        )}
        </>}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? "bg-accent/5 border-accent/20" : "bg-white border-gray-200"}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-serif font-semibold ${accent ? "text-accent-dark" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function DayView({
  date,
  bookings,
  timeSlots,
  onStatusChange,
}: {
  date: string;
  bookings: Booking[];
  timeSlots: string[];
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {bookings.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-sm">No hay citas para este dia</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {/* Time grid */}
          {timeSlots.map((time) => {
            const slotBookings = bookings.filter(
              (b) => b.startTime <= time && b.endTime > time && b.status !== "cancelled"
            );

            return (
              <div key={time} className="flex">
                <div className="w-16 sm:w-20 shrink-0 py-3 px-3 text-xs text-gray-400 text-right border-r border-gray-100 bg-gray-50/50">
                  {time}
                </div>
                <div className="flex-1 min-h-[48px] relative">
                  {slotBookings.map((booking) => {
                    // Only render at start time
                    if (booking.startTime !== time) return null;

                    return (
                      <BookingBlock
                        key={booking.id}
                        booking={booking}
                        onStatusChange={onStatusChange}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BookingBlock({
  booking,
  onStatusChange,
}: {
  booking: Booking;
  onStatusChange: (id: string, status: string) => void;
}) {
  const statusColors = {
    confirmed: "bg-accent/10 border-accent/30 text-accent-dark",
    completed: "bg-green-50 border-green-200 text-green-800",
    cancelled: "bg-gray-50 border-gray-200 text-gray-400 line-through",
  };

  const colors = statusColors[booking.status as keyof typeof statusColors] || statusColors.confirmed;

  return (
    <div className={`m-1 p-3 rounded-lg border ${colors}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{booking.clientName}</p>
          <p className="text-xs opacity-70">
            {booking.serviceName} &middot; {booking.startTime}-{booking.endTime}
          </p>
          <p className="text-xs opacity-60 mt-0.5">{booking.clientPhone}</p>
          {booking.notes && (
            <p className="text-xs opacity-50 mt-1 italic truncate">{booking.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {booking.status === "confirmed" && (
            <>
              <button
                onClick={() => onStatusChange(booking.id, "completed")}
                title="Marcar completada"
                className="p-1.5 rounded-md hover:bg-green-100 text-green-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => onStatusChange(booking.id, "cancelled")}
                title="Cancelar"
                className="p-1.5 rounded-md hover:bg-red-100 text-red-500"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          <span className="text-xs font-medium ml-1">${booking.servicePrice}</span>
        </div>
      </div>
    </div>
  );
}

function WeekView({
  weekDays,
  bookings,
  timeSlots,
  todayStr,
}: {
  weekDays: string[];
  bookings: Booking[];
  timeSlots: string[];
  todayStr: string;
}) {
  const dayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="w-16 sm:w-20 p-2 text-xs text-gray-400" />
            {weekDays.map((day, i) => {
              const isToday = day === todayStr;
              const dayNum = format(new Date(day + "T12:00:00"), "d");
              const dayBookings = bookings.filter((b) => b.date === day && b.status === "confirmed");

              return (
                <th
                  key={day}
                  className={`p-2 text-center border-l border-gray-100 ${isToday ? "bg-accent/5" : ""}`}
                >
                  <span className="text-xs text-gray-400">{dayLabels[i]}</span>
                  <br />
                  <span className={`text-sm font-medium ${isToday ? "text-accent-dark" : "text-foreground"}`}>
                    {dayNum}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="ml-1 text-[10px] bg-accent/20 text-accent-dark px-1.5 py-0.5 rounded-full">
                      {dayBookings.length}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {timeSlots.filter((_, i) => i % 2 === 0).map((time) => (
            <tr key={time} className="border-b border-gray-50">
              <td className="p-2 text-xs text-gray-400 text-right border-r border-gray-100 bg-gray-50/50">
                {time}
              </td>
              {weekDays.map((day) => {
                const isToday = day === todayStr;
                const cellBookings = bookings.filter(
                  (b) =>
                    b.date === day &&
                    b.startTime <= time &&
                    b.endTime > time &&
                    b.status !== "cancelled"
                );

                return (
                  <td
                    key={day}
                    className={`border-l border-gray-100 p-0.5 align-top h-12 ${isToday ? "bg-accent/[0.02]" : ""}`}
                  >
                    {cellBookings
                      .filter((b) => b.startTime === time)
                      .map((b) => (
                        <div
                          key={b.id}
                          className="text-[10px] bg-accent/10 border border-accent/20 rounded px-1.5 py-1 truncate text-accent-dark"
                          title={`${b.clientName} - ${b.serviceName} (${b.startTime}-${b.endTime})`}
                        >
                          <span className="font-medium">{b.clientName.split(" ")[0]}</span>
                          <br />
                          <span className="opacity-60">{b.serviceName}</span>
                        </div>
                      ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
