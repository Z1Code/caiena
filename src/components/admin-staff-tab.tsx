"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminT } from "@/components/admin-locale-context";

interface Service {
  id: number;
  name: string;
  category: string;
}

interface StaffMember {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  googleCalendarId: string | null;
  active: boolean;
  role: string | null;
  services: Array<{ serviceId: number; serviceName: string | null }>;
}

export function AdminStaffTab() {
  const t = useAdminT();
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "", phone: "", email: "", googleCalendarId: "", role: "staff", serviceIds: [] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    const [staffRes, svcRes] = await Promise.all([
      fetch("/api/admin/staff"),
      fetch("/api/services"),
    ]);
    setMembers(await staffRes.json());
    setAllServices(await svcRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", googleCalendarId: "", role: "staff", serviceIds: [] });
    setError("");
    setShowForm(true);
  }

  function openEdit(m: StaffMember) {
    setEditing(m);
    setForm({
      name: m.name,
      phone: m.phone ?? "",
      email: m.email ?? "",
      googleCalendarId: m.googleCalendarId ?? "",
      role: m.role ?? "staff",
      serviceIds: m.services.map((s) => s.serviceId),
    });
    setError("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError(t.staff.nameRequired); return; }
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/admin/staff/${editing.id}` : "/api/admin/staff";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error guardando");
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: number) {
    if (!confirm(t.staff.deactivateConfirm)) return;
    await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    fetchAll();
  }

  function toggleService(id: number) {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter((s) => s !== id)
        : [...f.serviceIds, id],
    }));
  }

  const roleLabels: Record<string, string> = {
    super_admin: t.staff.roleSuperAdmin, manager: t.staff.roleManager, staff: t.staff.roleEmployee,
  };
  const roleBadge: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700",
    manager: "bg-blue-100 text-blue-700",
    staff: "bg-gray-100 text-gray-600",
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">{t.staff.title}</h2>
        <button onClick={openCreate} className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-dark transition-colors">
          + {t.staff.addNew}
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-foreground mb-4">{editing ? t.staff.edit : t.staff.addNew}</h3>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t.staff.phone}</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t.staff.email}</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t.staff.googleCalendarId}</label>
                <input value={form.googleCalendarId} onChange={(e) => setForm((f) => ({ ...f, googleCalendarId: e.target.value }))}
                  placeholder="email@gmail.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t.staff.role}</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60">
                  <option value="staff">{t.staff.roleEmployee}</option>
                  <option value="manager">{t.staff.roleManager}</option>
                  <option value="super_admin">{t.staff.roleSuperAdmin}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">{t.staff.services}</label>
                <div className="space-y-1.5">
                  {allServices.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.serviceIds.includes(s.id)}
                        onChange={() => toggleService(s.id)} className="rounded accent-accent" />
                      <span className="text-sm text-foreground">{s.name}</span>
                      <span className="text-xs text-gray-400">{s.category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                {t.services.cancel}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? t.staff.saving : t.staff.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff list */}
      {members.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">{t.staff.noData}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className={`bg-white border rounded-xl p-4 flex items-start justify-between gap-4 ${m.active ? "border-gray-200" : "border-gray-100 opacity-50"}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-foreground">{m.name}</span>
                  {m.role && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge[m.role] ?? roleBadge.staff}`}>
                      {roleLabels[m.role] ?? m.role}
                    </span>
                  )}
                  {!m.active && <span className="text-xs text-gray-400">{t.staff.inactive}</span>}
                </div>
                {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
                {m.email && <p className="text-xs text-gray-500">{m.email}</p>}
                {m.services.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {m.services.map((s) => s.serviceName).filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(m)} className="text-xs text-accent-dark hover:text-foreground border border-accent-light/40 px-3 py-1.5 rounded-lg hover:bg-cream/50 transition-colors">
                  {t.staff.editAction}
                </button>
                {m.active && (
                  <button onClick={() => handleDeactivate(m.id)} className="text-xs text-red-500 hover:text-red-700 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    {t.staff.deactivate}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
