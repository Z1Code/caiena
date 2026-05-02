"use client";

import { useState, useEffect, useCallback } from "react";

interface SlotGroup {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  active: boolean;
}

const PRESET_ICONS = ["🌅", "☀️", "🌤️", "🌙", "⭐", "💅", "✨"];

export function AdminGroupsTab() {
  const [groups, setGroups] = useState<SlotGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SlotGroup | null>(null);
  const [form, setForm] = useState({ name: "", startTime: "09:00", endTime: "12:00", color: "", icon: "🌅", sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchGroups = useCallback(async () => {
    const res = await fetch("/api/admin/slot-groups");
    setGroups(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", startTime: "09:00", endTime: "12:00", color: "", icon: "🌅", sortOrder: groups.length });
    setError("");
    setShowForm(true);
  }

  function openEdit(g: SlotGroup) {
    setEditing(g);
    setForm({ name: g.name, startTime: g.startTime, endTime: g.endTime, color: g.color ?? "", icon: g.icon ?? "🌅", sortOrder: g.sortOrder });
    setError("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.startTime || !form.endTime) { setError("Nombre y horarios requeridos"); return; }
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/admin/slot-groups/${editing.id}` : "/api/admin/slot-groups";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error guardando");
      setShowForm(false);
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(g: SlotGroup) {
    await fetch(`/api/admin/slot-groups/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !g.active }),
    });
    fetchGroups();
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este grupo?")) return;
    await fetch(`/api/admin/slot-groups/${id}`, { method: "DELETE" });
    fetchGroups();
  }

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Grupos de horario</h2>
          <p className="text-xs text-gray-500 mt-0.5">Define las franjas (Mañana, Tarde, Noche) que ven las clientas al reservar.</p>
        </div>
        <button onClick={openCreate} className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-dark transition-colors">
          + Nuevo grupo
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-foreground mb-4">{editing ? "Editar grupo" : "Nuevo grupo"}</h3>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Mañana"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Inicio</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fin</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Ícono</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_ICONS.map((icon) => (
                    <button key={icon} onClick={() => setForm((f) => ({ ...f, icon }))}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === icon ? "bg-accent/20 ring-2 ring-accent/40 scale-110" : "bg-gray-100 hover:bg-gray-200"}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Orden</label>
                <input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm mb-2">No hay grupos configurados.</p>
          <p className="text-xs">Las clientas verán todos los horarios en una lista plana.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.id} className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-4 ${g.active ? "border-gray-200" : "border-gray-100 opacity-50"}`}>
              <div className="flex items-center gap-3">
                {g.icon && <span className="text-xl">{g.icon}</span>}
                <div>
                  <span className="font-medium text-foreground text-sm">{g.name}</span>
                  <p className="text-xs text-gray-400">{g.startTime} – {g.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(g)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${g.active ? "border-green-200 text-green-700 hover:bg-green-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {g.active ? "Activo" : "Inactivo"}
                </button>
                <button onClick={() => openEdit(g)} className="text-xs text-accent-dark border border-accent-light/40 px-3 py-1.5 rounded-lg hover:bg-cream/50 transition-colors">
                  Editar
                </button>
                <button onClick={() => handleDelete(g.id)} className="text-xs text-red-500 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
