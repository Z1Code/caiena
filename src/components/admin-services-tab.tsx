"use client";

import { useState, useEffect } from "react";
import { useAdminT } from "@/components/admin-locale-context";

interface Service {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: string;
  active: boolean;
  images: string[] | null;
  sortOrder: number | null;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  durationMinutes: 60,
  price: 0,
  category: "manicure",
};

export function AdminServicesTab() {
  const t = useAdminT();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadServices() {
    const res = await fetch("/api/admin/services");
    const data = await res.json();
    setServices(data);
    setLoading(false);
  }

  useEffect(() => { loadServices(); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/admin/services/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setEditing(null);
      setCreating(false);
      setForm(EMPTY_FORM);
      await loadServices();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(svc: Service) {
    await fetch(`/api/admin/services/${svc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !svc.active }),
    });
    await loadServices();
  }

  async function handleDelete(id: number) {
    if (!confirm(t.services.deactivateConfirm)) return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    await loadServices();
  }

  async function handleImageUpload(svc: Service, file: File) {
    const fd = new FormData();
    fd.append("image", file);
    await fetch(`/api/admin/services/${svc.id}/images`, { method: "POST", body: fd });
    await loadServices();
  }

  async function handleImageDelete(svc: Service, filename: string) {
    await fetch(`/api/admin/services/${svc.id}/images/${filename}`, { method: "DELETE" });
    await loadServices();
  }

  function startEdit(svc: Service) {
    setEditing(svc);
    setCreating(false);
    setForm({
      name: svc.name,
      description: svc.description,
      durationMinutes: svc.durationMinutes,
      price: svc.price,
      category: svc.category,
    });
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  if (loading) return <div className="text-sm text-muted py-8 text-center">{t.services.loading}</div>;

  const showForm = editing !== null || creating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">{t.services.title}</h3>
        <button
          onClick={startCreate}
          className="text-xs bg-accent/20 hover:bg-accent/30 text-accent-light border border-accent/30 rounded-lg px-4 py-2 transition-colors"
        >
          + {t.services.addNew}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-medium text-white">{editing ? t.services.editTitle : t.services.newTitle}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-white/40 tracking-wider uppercase block mb-1">{t.services.name}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-wider uppercase block mb-1">{t.services.category}</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
              >
                <option value="manicure">Manicure</option>
                <option value="pedicure">Pedicure</option>
                <option value="extras">Extras</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-white/40 tracking-wider uppercase block mb-1">{t.services.description}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-wider uppercase block mb-1">{t.services.duration}</label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 60 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-wider uppercase block mb-1">{t.services.price}</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { setEditing(null); setCreating(false); }}
              className="text-xs text-white/40 hover:text-white/70 px-4 py-2 transition-colors"
            >
              {t.services.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs bg-accent text-white rounded-lg px-5 py-2 hover:bg-accent-dark transition-colors disabled:opacity-60"
            >
              {saving ? t.services.saving : t.services.save}
            </button>
          </div>
        </div>
      )}

      {/* Services list */}
      <div className="space-y-3">
        {services.map((svc) => (
          <div key={svc.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{svc.name}</span>
                  <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">{svc.category}</span>
                  {!svc.active && (
                    <span className="text-[10px] text-red-400/70 bg-red-400/10 px-2 py-0.5 rounded">{t.services.inactive}</span>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-1">{svc.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-white/30">
                  <span>{svc.durationMinutes} min</span>
                  <span className="text-accent-light/70">${svc.price}</span>
                  <span>{(svc.images ?? []).length}/6 {t.services.photos}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(svc)}
                  className="text-[10px] text-white/40 hover:text-white/70 border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {t.services.edit}
                </button>
                <button
                  onClick={() => handleToggleActive(svc)}
                  className={`text-[10px] border rounded-lg px-3 py-1.5 transition-colors ${
                    svc.active
                      ? "text-green-400/70 border-green-400/20 hover:border-green-400/40"
                      : "text-white/30 border-white/10 hover:border-white/20"
                  }`}
                >
                  {svc.active ? t.services.active : t.services.inactive}
                </button>
              </div>
            </div>

            {/* Image management */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 flex-wrap">
                {(svc.images ?? []).map((img) => {
                  const filename = img.split("/").pop() ?? "";
                  return (
                    <div key={img} className="relative group">
                      <img src={img} alt="" className="w-12 h-12 object-cover rounded-lg" />
                      <button
                        onClick={() => handleImageDelete(svc, filename)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {(svc.images ?? []).length < 6 && (
                  <label className="w-12 h-12 border border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors">
                    <span className="text-white/30 text-lg">+</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(svc, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
