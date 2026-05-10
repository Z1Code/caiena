"use client";

import { useState, useEffect, useCallback } from "react";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6];

interface StaffMember { id: number; name: string; active: boolean; }
interface ScheduleWindow { id: number; daysOfWeek: number[] | null; startTime: string; endTime: string; specificDate: string | null; }
interface Exception { id: number; date: string; type: string; customStart: string | null; customEnd: string | null; note: string | null; }
interface TimeBlock { id: number; date: string | null; daysOfWeek: number[] | null; startTime: string; endTime: string; type: string; label: string | null; }

interface ScheduleData {
  windows: ScheduleWindow[];
  exceptions: Exception[];
  blocks: TimeBlock[];
}

export function AdminScheduleTab() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(false);

  // Weekly schedule editor
  const [weeklyHours, setWeeklyHours] = useState<Record<number, { enabled: boolean; start: string; end: string }>>({
    0: { enabled: false, start: "09:00", end: "17:00" },
    1: { enabled: true, start: "09:00", end: "18:00" },
    2: { enabled: true, start: "09:00", end: "18:00" },
    3: { enabled: true, start: "09:00", end: "18:00" },
    4: { enabled: true, start: "09:00", end: "18:00" },
    5: { enabled: true, start: "09:00", end: "18:00" },
    6: { enabled: true, start: "10:00", end: "16:00" },
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Exception form
  const [exForm, setExForm] = useState({ date: "", type: "VACATION", customStart: "09:00", customEnd: "18:00", note: "" });
  const [savingEx, setSavingEx] = useState(false);

  // Time block form
  const [blockForm, setBlockForm] = useState({ startTime: "13:00", endTime: "14:00", type: "LUNCH", label: "Almuerzo", recurring: true, date: "", daysOfWeek: [1, 2, 3, 4, 5] as number[] });
  const [savingBlock, setSavingBlock] = useState(false);

  useEffect(() => {
    fetch("/api/admin/staff")
      .then((r) => r.json())
      .then((data: StaffMember[]) => {
        setStaffList(data.filter((s) => s.active));
        if (data.length > 0) setSelectedStaff(data[0].id);
      });
  }, []);

  const fetchSchedule = useCallback(async (staffId: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/staff/${staffId}/schedule`);
    const data = await res.json();
    setScheduleData(data);

    // Populate weekly hours from active schedule windows
    if (data.windows?.length > 0) {
      const newHours = { ...weeklyHours };
      // Reset all to disabled
      DAY_INDICES.forEach((d) => { newHours[d] = { ...newHours[d], enabled: false }; });
      data.windows.forEach((w: ScheduleWindow) => {
        if (w.daysOfWeek && !w.specificDate) {
          w.daysOfWeek.forEach((d: number) => {
            newHours[d] = { enabled: true, start: w.startTime, end: w.endTime };
          });
        }
      });
      setWeeklyHours(newHours);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedStaff) fetchSchedule(selectedStaff);
  }, [selectedStaff, fetchSchedule]);

  async function saveSchedule() {
    if (!selectedStaff) return;
    setSavingSchedule(true);
    // Group days with same hours into single windows
    const hoursMap = new Map<string, number[]>();
    DAY_INDICES.forEach((d) => {
      const h = weeklyHours[d];
      if (!h.enabled) return;
      const key = `${h.start}-${h.end}`;
      if (!hoursMap.has(key)) hoursMap.set(key, []);
      hoursMap.get(key)!.push(d);
    });
    const windows = Array.from(hoursMap.entries()).map(([key, days]) => {
      const [startTime, endTime] = key.split("-");
      return { daysOfWeek: days, startTime, endTime };
    });
    await fetch(`/api/admin/staff/${selectedStaff}/schedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Horario principal", windows }),
    });
    setSavingSchedule(false);
    fetchSchedule(selectedStaff);
  }

  async function addException() {
    if (!selectedStaff || !exForm.date) return;
    setSavingEx(true);
    await fetch(`/api/admin/staff/${selectedStaff}/exceptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exForm),
    });
    setSavingEx(false);
    setExForm((f) => ({ ...f, date: "" }));
    fetchSchedule(selectedStaff);
  }

  async function removeException(date: string) {
    if (!selectedStaff) return;
    await fetch(`/api/admin/staff/${selectedStaff}/exceptions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    fetchSchedule(selectedStaff);
  }

  async function addBlock() {
    if (!selectedStaff) return;
    setSavingBlock(true);
    const payload = blockForm.recurring
      ? { daysOfWeek: blockForm.daysOfWeek, startTime: blockForm.startTime, endTime: blockForm.endTime, type: blockForm.type, label: blockForm.label }
      : { date: blockForm.date, startTime: blockForm.startTime, endTime: blockForm.endTime, type: blockForm.type, label: blockForm.label };
    await fetch(`/api/admin/staff/${selectedStaff}/time-blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSavingBlock(false);
    fetchSchedule(selectedStaff);
  }

  async function removeBlock(blockId: number) {
    if (!selectedStaff) return;
    await fetch(`/api/admin/staff/${selectedStaff}/time-blocks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockId }),
    });
    fetchSchedule(selectedStaff);
  }

  function toggleBlockDay(d: number) {
    setBlockForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter((x) => x !== d) : [...f.daysOfWeek, d],
    }));
  }

  const exTypeLabels: Record<string, string> = { VACATION: "Vacación", SICK: "Enfermedad", CUSTOM_HOURS: "Horario especial", CLOSED: "Día cerrado" };
  const blockTypeLabels: Record<string, string> = { LUNCH: "Almuerzo", BREAK: "Descanso", ADMIN: "Admin", PERSONAL: "Personal" };

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Horarios de empleadas</h2>

      {/* Staff selector */}
      {staffList.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Primero agrega empleadas en la pestaña &ldquo;Empleadas&rdquo;.</p>
      ) : (
        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            {staffList.map((s) => (
              <button key={s.id} onClick={() => setSelectedStaff(s.id)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${selectedStaff === s.id ? "bg-accent text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {s.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-8">
              {/* Weekly hours */}
              <section className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-medium text-foreground mb-4 text-sm">Horario semanal</h3>
                <div className="space-y-2">
                  {DAY_INDICES.map((d) => (
                    <div key={d} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 w-28 cursor-pointer">
                        <input type="checkbox" checked={weeklyHours[d].enabled}
                          onChange={(e) => setWeeklyHours((h) => ({ ...h, [d]: { ...h[d], enabled: e.target.checked } }))}
                          className="rounded accent-accent" />
                        <span className="text-sm text-foreground">{DAYS[d]}</span>
                      </label>
                      {weeklyHours[d].enabled ? (
                        <div className="flex items-center gap-2">
                          <input type="time" value={weeklyHours[d].start}
                            onChange={(e) => setWeeklyHours((h) => ({ ...h, [d]: { ...h[d], start: e.target.value } }))}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
                          <span className="text-gray-400 text-sm">–</span>
                          <input type="time" value={weeklyHours[d].end}
                            onChange={(e) => setWeeklyHours((h) => ({ ...h, [d]: { ...h[d], end: e.target.value } }))}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Cerrado</span>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={saveSchedule} disabled={savingSchedule}
                  className="mt-4 bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center gap-2">
                  {savingSchedule && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {savingSchedule ? "Guardando..." : "Guardar horario"}
                </button>
              </section>

              {/* Exceptions */}
              <section className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-medium text-foreground mb-4 text-sm">Excepciones (vacaciones, días especiales)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
                    <input type="date" value={exForm.date} onChange={(e) => setExForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                    <select value={exForm.type} onChange={(e) => setExForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60">
                      {Object.entries(exTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  {exForm.type === "CUSTOM_HOURS" && (
                    <>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Inicio</label>
                        <input type="time" value={exForm.customStart} onChange={(e) => setExForm((f) => ({ ...f, customStart: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Fin</label>
                        <input type="time" value={exForm.customEnd} onChange={(e) => setExForm((f) => ({ ...f, customEnd: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">Nota (opcional)</label>
                    <input value={exForm.note} onChange={(e) => setExForm((f) => ({ ...f, note: e.target.value }))}
                      placeholder="ej: Vacaciones de verano"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
                  </div>
                </div>
                <button onClick={addException} disabled={savingEx || !exForm.date}
                  className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-dark transition-colors disabled:opacity-50">
                  {savingEx ? "Guardando..." : "+ Agregar excepción"}
                </button>

                {scheduleData?.exceptions && scheduleData.exceptions.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {scheduleData.exceptions.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <span className="font-medium text-foreground">{ex.date}</span>
                        <span className="text-gray-500 mx-2">{exTypeLabels[ex.type] ?? ex.type}</span>
                        {ex.note && <span className="text-gray-400 italic flex-1 truncate">{ex.note}</span>}
                        <button onClick={() => removeException(ex.date)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Time blocks */}
              <section className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-medium text-foreground mb-4 text-sm">Bloqueos de tiempo (almuerzo, descansos)</h3>
                <div className="space-y-3 mb-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" checked={blockForm.recurring} onChange={() => setBlockForm((f) => ({ ...f, recurring: true }))} />
                      Recurrente
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" checked={!blockForm.recurring} onChange={() => setBlockForm((f) => ({ ...f, recurring: false }))} />
                      Fecha específica
                    </label>
                  </div>

                  {blockForm.recurring ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {DAY_INDICES.map((d) => (
                        <button key={d} onClick={() => toggleBlockDay(d)}
                          className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${blockForm.daysOfWeek.includes(d) ? "bg-accent text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                          {DAYS[d]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input type="date" value={blockForm.date} onChange={(e) => setBlockForm((f) => ({ ...f, date: e.target.value }))}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent/60" />
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Inicio</label>
                      <input type="time" value={blockForm.startTime} onChange={(e) => setBlockForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Fin</label>
                      <input type="time" value={blockForm.endTime} onChange={(e) => setBlockForm((f) => ({ ...f, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                      <select value={blockForm.type} onChange={(e) => setBlockForm((f) => ({ ...f, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                        {Object.entries(blockTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Etiqueta</label>
                      <input value={blockForm.label} onChange={(e) => setBlockForm((f) => ({ ...f, label: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
                <button onClick={addBlock} disabled={savingBlock}
                  className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-dark transition-colors disabled:opacity-50">
                  {savingBlock ? "Guardando..." : "+ Agregar bloqueo"}
                </button>

                {scheduleData?.blocks && scheduleData.blocks.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {scheduleData.blocks.map((b) => (
                      <div key={b.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <span className="font-medium text-foreground">{b.label ?? blockTypeLabels[b.type] ?? b.type}</span>
                        <span className="text-gray-500 mx-2">{b.startTime}–{b.endTime}</span>
                        {b.daysOfWeek ? (
                          <span className="text-gray-400">{b.daysOfWeek.map((d) => DAYS[d]).join(", ")}</span>
                        ) : (
                          <span className="text-gray-400">{b.date}</span>
                        )}
                        <button onClick={() => removeBlock(b.id)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
