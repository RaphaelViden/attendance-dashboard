"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  Cpu,
  DatabaseBackup,
  Download,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCheck,
  Users,
  Wifi
} from "lucide-react";
import { DIVISIONS, SHIFT_NAMES, SHIFT_RULES, TAP_FLOW } from "@/lib/constants";
import { dateRange, formatIDDate, minutesToDuration, workMinutes } from "@/lib/time";
import type { AdminUser, AttendanceRecord, BootstrapPayload, Employee, EmployeeDivision, ShiftName, TapField } from "@/lib/types";

type TabKey = "dashboard" | "attendance" | "employees" | "simulator" | "backups";

type EmployeeForm = {
  id?: string;
  name: string;
  division: EmployeeDivision;
  shift: ShiftName;
  rfidUid: string;
  email: string;
  phone: string;
  isActive: boolean;
};

const emptyEmployeeForm: EmployeeForm = {
  name: "",
  division: "Casier",
  shift: "Pagi",
  rfidUid: "",
  email: "",
  phone: "",
  isActive: true
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function statusBadge(status: AttendanceRecord["status"]) {
  const map: Record<string, string> = {
    present: "bg-emerald-50 text-emerald-700 border-emerald-100",
    late: "bg-amber-50 text-amber-700 border-amber-100",
    incomplete: "bg-sky-50 text-sky-700 border-sky-100",
    absent: "bg-rose-50 text-rose-700 border-rose-100",
    leave: "bg-violet-50 text-violet-700 border-violet-100",
    sick: "bg-blue-50 text-blue-700 border-blue-100",
    wfh: "bg-slate-50 text-slate-700 border-slate-100"
  };
  return map[status] || map.incomplete;
}

function statusLabel(status: AttendanceRecord["status"]) {
  const map: Record<string, string> = {
    present: "Lengkap",
    late: "Terlambat",
    incomplete: "Belum lengkap",
    absent: "Belum Hadir",
    leave: "Cuti/Izin",
    sick: "Sakit",
    wfh: "WFH"
  };
  return map[status] || status;
}

function recTime(record: AttendanceRecord | undefined, field: TapField) {
  return record?.[field] || "-";
}

function cardInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [exportStart, setExportStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [exportEnd, setExportEnd] = useState(new Date().toISOString().slice(0, 10));

  const loadData = async (activeToken = token) => {
    if (!activeToken) return;
    setDataLoading(true);
    try {
      const res = await fetch("/api/bootstrap", { headers: authHeaders(activeToken), cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Gagal membaca dashboard.");
      setData(payload);
    } catch (error: any) {
      setToast(error.message || "Gagal memuat data.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("tappresensi_token");
    const savedUser = localStorage.getItem("tappresensi_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setAdminUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    loadData(token);
    const timer = setInterval(() => loadData(token), 5000);
    return () => clearInterval(timer);
  }, [isAuthenticated, token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Autentikasi gagal.");
      localStorage.setItem("tappresensi_token", result.token);
      localStorage.setItem("tappresensi_user", JSON.stringify(result.user));
      setToken(result.token);
      setAdminUser(result.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      setAuthError(error.message || "Login gagal.");
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("tappresensi_token");
    localStorage.removeItem("tappresensi_user");
    setIsAuthenticated(false);
    setToken(null);
    setAdminUser(null);
    setData(null);
  };

  const downloadXlsx = async () => {
    if (!token) return;
    const res = await fetch(`/api/export?start=${exportStart}&end=${exportEnd}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      setToast("Export XLSX gagal.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-presensi-${exportStart}-sd-${exportEnd}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBackup = async () => {
    if (!token) return;
    const res = await fetch("/api/system/backup/download", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      setToast("Download backup gagal.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tappresensi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return <LoginView username={username} password={password} setUsername={setUsername} setPassword={setPassword} authError={authError} loading={loginLoading} onSubmit={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-gray-800">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-4 max-w-7xl mx-auto py-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl"><Cpu size={18} /></div>
            <div>
              <span className="font-black text-gray-950 text-sm tracking-tight block">TAPPRESENSI RFID</span>
              <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> FULLSTACK ADMIN</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
            <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={14} />} label="Dashboard" />
            <TabButton active={activeTab === "attendance"} onClick={() => setActiveTab("attendance")} icon={<CalendarCheck size={14} />} label="Presensi 4 Tap" />
            <TabButton active={activeTab === "employees"} onClick={() => setActiveTab("employees")} icon={<Users size={14} />} label="RFID Cards" />
            <TabButton active={activeTab === "simulator"} onClick={() => setActiveTab("simulator")} icon={<Smartphone size={14} />} label="ESP32" />
            <TabButton active={activeTab === "backups"} onClick={() => setActiveTab("backups")} icon={<DatabaseBackup size={14} />} label="Log & Backup" />
          </nav>

          <div className="flex items-center gap-2.5">
            <button onClick={() => loadData()} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all cursor-pointer" title="Refresh"><RefreshCw size={16} /></button>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-gray-900">{adminUser?.name || "Administrator"}</span>
              <span className="text-[10px] text-gray-400 font-medium">Mode: {data?.mode || "loading"}</span>
            </div>
            <button onClick={logout} className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-all cursor-pointer" title="Keluar"><LogOut size={16} /></button>
          </div>
        </div>
      </header>

      <div className="lg:hidden sticky top-16 z-20 bg-white border-b border-gray-100 p-2 flex overflow-x-auto gap-1 no-scrollbar">
        <MobileTab active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} label="Dashboard" />
        <MobileTab active={activeTab === "attendance"} onClick={() => setActiveTab("attendance")} label="Presensi" />
        <MobileTab active={activeTab === "employees"} onClick={() => setActiveTab("employees")} label="RFID Cards" />
        <MobileTab active={activeTab === "simulator"} onClick={() => setActiveTab("simulator")} label="ESP32" />
        <MobileTab active={activeTab === "backups"} onClick={() => setActiveTab("backups")} label="Backup" />
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white text-xs rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
          <ShieldAlert size={15} /> {toast}
          <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white">×</button>
        </div>
      )}

      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {dataLoading && !data ? (
          <LoadingPanel />
        ) : data ? (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
            <section className="xl:col-span-3 space-y-6">
              {activeTab === "dashboard" && <DashboardView data={data} onNavigate={setActiveTab} />}
              {activeTab === "attendance" && <AttendanceView data={data} token={token || ""} exportStart={exportStart} exportEnd={exportEnd} setExportStart={setExportStart} setExportEnd={setExportEnd} onExport={downloadXlsx} onRefresh={() => loadData()} />}
              {activeTab === "employees" && <EmployeesView data={data} token={token || ""} onSaved={() => loadData()} setToast={setToast} />}
              {activeTab === "simulator" && <SimulatorView data={data} token={token || ""} onTap={() => loadData()} setToast={setToast} />}
              {activeTab === "backups" && <BackupsView data={data} token={token || ""} onBackup={downloadBackup} onRefresh={() => loadData()} setToast={setToast} />}
            </section>
            <aside className="space-y-6">
              <HardwareCard data={data} />
              <ShiftRuleCard />
            </aside>
          </div>
        ) : (
          <LoadingPanel />
        )}
      </main>
    </div>
  );
}

function LoginView(props: { username: string; password: string; setUsername: (v: string) => void; setPassword: (v: string) => void; authError: string | null; loading: boolean; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-indigo-600 mb-2"><Cpu size={32} className="animate-pulse" /></div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">TAPPRESENSI RFID</h2>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">Sistem administrasi presensi karyawan berbasis RFID, 4 kali tapping, shift kerja, dan sinkronisasi perangkat ESP32.</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-100 shadow-md rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={props.onSubmit}>
            <Field label="Username Admin"><input value={props.username} onChange={(e) => props.setUsername(e.target.value)} className="input" placeholder="admin" /></Field>
            <Field label="Password"><input value={props.password} onChange={(e) => props.setPassword(e.target.value)} type="password" className="input" placeholder="admin123" /></Field>
            {props.authError && <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-shake"><ShieldAlert size={15} className="mt-0.5 shrink-0" />{props.authError}</div>}
            <button disabled={props.loading} className="w-full flex justify-center py-3 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all disabled:bg-slate-400 cursor-pointer">{props.loading ? "Memverifikasi..." : "Masuk ke Dashboard Admin"}</button>
          </form>
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-3.5">
            <div className="p-3.5 bg-indigo-50/50 rounded-xl text-[11px] text-indigo-800 leading-relaxed border border-indigo-50">
              <p className="font-bold flex items-center gap-1 mb-1"><Lock size={12} /> Kredensial demo lokal:</p>
              <p>Username <b className="font-mono">admin</b> dan password <b className="font-mono">admin123</b>. Ubah di environment variable sebelum production.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ data, onNavigate }: { data: BootstrapPayload; onNavigate: (tab: TabKey) => void }) {
  const latest = data.attendance.slice(0, 6);
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
        <Stat title="Karyawan Aktif" value={data.stats.activeEmployees} sub={`${data.stats.totalEmployees} total karyawan`} icon={<Users size={18} />} />
        <Stat title="Hadir Hari Ini" value={data.stats.todayPresentCount} sub="Sudah tap masuk" icon={<UserCheck size={18} />} />
        <Stat title="Terlambat" value={data.stats.todayLateCount} sub="Berdasarkan shift" icon={<Activity size={18} />} />
        <Stat title="Belum Lengkap" value={data.stats.todayIncompleteCount} sub="Tap belum 4 kali" icon={<CalendarCheck size={18} />} />
      </div>
      <Panel title="Ringkasan Operasional" action={<button onClick={() => onNavigate("attendance")} className="btn-secondary">Lihat Presensi</button>}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">Divisi</h3>
            {data.stats.divisionStats.map((item) => (
              <ProgressLine key={item.name} label={item.name} value={item.present} total={item.total} />
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">Shift</h3>
            {data.stats.shiftStats.map((item) => (
              <ProgressLine key={item.name} label={`${item.name} (${SHIFT_RULES[item.name].label})`} value={item.present} total={item.total} />
            ))}
          </div>
        </div>
      </Panel>
      <Panel title="Presensi Terbaru" action={<button onClick={() => onNavigate("simulator")} className="btn-secondary">Simulasi Tap</button>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead><tr className="text-left text-gray-400 border-b border-gray-100"><th className="py-3">Karyawan</th><th>Tanggal</th><th>Shift</th><th>Masuk</th><th>Istirahat</th><th>Pulang</th><th>Status</th></tr></thead>
            <tbody>
              {latest.map((r) => <AttendanceRow key={r.id} record={r} />)}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function AttendanceView(props: { data: BootstrapPayload; token: string; exportStart: string; exportEnd: string; setExportStart: (v: string) => void; setExportEnd: (v: string) => void; onExport: () => void; onRefresh: () => void }) {
  const [manual, setManual] = useState({ employeeId: props.data.employees[0]?.id || "", date: new Date().toISOString().slice(0, 10), field: "checkIn" as TapField, time: new Date().toTimeString().slice(0, 5), note: "" });
  const days = useMemo(() => dateRange(props.exportStart, props.exportEnd), [props.exportStart, props.exportEnd]);
  const recMap = useMemo(() => new Map(props.data.attendance.map((r) => [`${r.employeeId}__${r.date}`, r])), [props.data.attendance]);

  const saveManual = async () => {
    await fetch("/api/attendance/manual", { method: "POST", headers: authHeaders(props.token), body: JSON.stringify(manual) });
    props.onRefresh();
  };

  return (
    <>
      <Panel title="Rekap Presensi 4 Tap" action={<button onClick={props.onExport} className="btn-primary"><Download size={14} /> Export XLSX</button>}>
        <div className="flex flex-wrap gap-3 mb-4">
          <Field compact label="Tanggal mulai"><input type="date" className="input" value={props.exportStart} onChange={(e) => props.setExportStart(e.target.value)} /></Field>
          <Field compact label="Tanggal akhir"><input type="date" className="input" value={props.exportEnd} onChange={(e) => props.setExportEnd(e.target.value)} /></Field>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-full text-[11px] bg-white">
            <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3 text-left sticky left-0 bg-gray-50 z-10 min-w-48">Karyawan</th>{days.map((d) => <th key={d} className="p-3 text-left min-w-48">{formatIDDate(d)}</th>)}</tr></thead>
            <tbody>
              {props.data.employees.map((emp) => (
                <tr key={emp.id} className="border-t border-gray-100 align-top">
                  <td className="p-3 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2"><Avatar name={emp.name} /><div><b>{emp.name}</b><p className="text-gray-400">{emp.division} · {emp.shift}</p></div></div>
                  </td>
                  {days.map((d) => {
                    const r = recMap.get(`${emp.id}__${d}`);
                    return <td key={d} className="p-3 whitespace-pre-line leading-relaxed">{r ? <DailyCell record={r} /> : <span className="text-gray-300">-</span>}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Koreksi Manual Admin">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <Field label="Karyawan"><select className="input" value={manual.employeeId} onChange={(e) => setManual({ ...manual, employeeId: e.target.value })}>{props.data.employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
          <Field label="Tanggal"><input type="date" className="input" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} /></Field>
          <Field label="Jenis Tap"><select className="input" value={manual.field} onChange={(e) => setManual({ ...manual, field: e.target.value as TapField })}>{TAP_FLOW.map((t) => <option key={t.field} value={t.field}>{t.label}</option>)}</select></Field>
          <Field label="Jam"><input type="time" className="input" value={manual.time} onChange={(e) => setManual({ ...manual, time: e.target.value })} /></Field>
          <button onClick={saveManual} className="btn-primary"><Save size={14} /> Simpan</button>
        </div>
      </Panel>
    </>
  );
}

function EmployeesView({ data, token, onSaved, setToast }: { data: BootstrapPayload; token: string; onSaved: () => void; setToast: (v: string) => void }) {
  const [form, setForm] = useState<EmployeeForm>(emptyEmployeeForm);
  const editing = Boolean(form.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/employees/${form.id}` : "/api/employees";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(form) });
    const result = await res.json();
    if (!res.ok) {
      setToast(result.error || "Gagal menyimpan RFID Card.");
      return;
    }
    setForm(emptyEmployeeForm);
    onSaved();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus karyawan dan data RFID terkait?")) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE", headers: authHeaders(token) });
    if (!res.ok) setToast("Gagal menghapus karyawan.");
    onSaved();
  };

  return (
    <>
      <Panel title={editing ? "Edit RFID Card & Profil Karyawan" : "Registrasi RFID Card"}>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <Field label="Nama"><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Divisi"><select className="input" value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value as EmployeeDivision })}>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Shift"><select className="input" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value as ShiftName })}>{SHIFT_NAMES.map((s) => <option key={s}>{s} ({SHIFT_RULES[s].label})</option>)}</select></Field>
          <Field label="UID RFID"><input required className="input font-mono" value={form.rfidUid} onChange={(e) => setForm({ ...form, rfidUid: e.target.value })} placeholder="B3:3D:1F:D3" /></Field>
          <Field label="Email"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Telepon"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <div className="flex gap-2 md:col-span-3"><button className="btn-primary"><Plus size={14} /> {editing ? "Simpan Perubahan" : "Tambah Karyawan"}</button>{editing && <button type="button" className="btn-secondary" onClick={() => setForm(emptyEmployeeForm)}>Batal</button>}</div>
        </form>
      </Panel>
      <Panel title="Data RFID Cards">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead><tr className="text-left text-gray-400 border-b border-gray-100"><th className="py-3">Karyawan</th><th>Divisi</th><th>Shift</th><th>UID RFID</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {data.employees.map((e) => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="py-3"><div className="flex items-center gap-2"><Avatar name={e.name} /><div><b>{e.name}</b><p className="text-gray-400">{e.email || "-"}</p></div></div></td>
                  <td>{e.division}</td><td>{e.shift}<p className="text-[10px] text-gray-400">{SHIFT_RULES[e.shift].label}</p></td><td className="font-mono">{e.rfidUid}</td>
                  <td><span className={`rounded-full border px-2 py-1 ${e.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>{e.isActive ? "Aktif" : "Nonaktif"}</span></td>
                  <td><div className="flex gap-2"><button className="btn-secondary" onClick={() => setForm({ id: e.id, name: e.name, division: e.division, shift: e.shift, rfidUid: e.rfidUid, email: e.email, phone: e.phone || "", isActive: e.isActive })}>Edit</button><button className="btn-danger" onClick={() => remove(e.id)}><Trash2 size={13} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function SimulatorView({ data, token, onTap, setToast }: { data: BootstrapPayload; token: string; onTap: () => void; setToast: (v: string) => void }) {
  const [uid, setUid] = useState(data.employees[0]?.rfidUid || "B3:3D:1F:D3");
  const [result, setResult] = useState<string | null>(null);
  const tap = async () => {
    const res = await fetch("/api/simulator/tap", { method: "POST", headers: authHeaders(token), body: JSON.stringify({ rfidUid: uid, deviceId: "dashboard-simulator" }) });
    const json = await res.json();
    if (!res.ok) setToast(json.error || "Tap gagal."); else setResult(json.message);
    onTap();
  };
  return (
    <Panel title="ESP32 / RFID Tap Simulator" action={<span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1"><Wifi size={13} /> Endpoint aktif</span>}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <Field label="Pilih UID"><select className="input font-mono" value={uid} onChange={(e) => setUid(e.target.value)}>{data.employees.map((e) => <option key={e.id} value={e.rfidUid}>{e.rfidUid} · {e.name}</option>)}<option value="00:UNKNOWN">00:UNKNOWN · kartu belum terdaftar</option></select></Field>
        <button onClick={tap} className="btn-primary"><Smartphone size={14} /> Tap RFID</button>
      </div>
      {result && <div className="mt-4 p-3 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-800 text-xs">{result}</div>}
      <div className="mt-5 p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto">
        <p>POST /api/device/tap</p>
        <p>{`headers: { "x-device-secret": "<DEVICE_SECRET>" }`}</p>
        <p>{`body: { "rfid_uid": "${uid}", "device_id": "attendance-esp32-001" }`}</p>
      </div>
    </Panel>
  );
}

function BackupsView({ data, token, onBackup, onRefresh, setToast }: { data: BootstrapPayload; token: string; onBackup: () => void; onRefresh: () => void; setToast: (v: string) => void }) {
  const trigger = async () => {
    const res = await fetch("/api/system/backup/trigger", { method: "POST", headers: authHeaders(token) });
    if (!res.ok) setToast("Backup gagal dibuat.");
    onRefresh();
  };
  return (
    <>
      <Panel title="Log Sistem" action={<button onClick={trigger} className="btn-secondary">Trigger Backup</button>}>
        <div className="space-y-3">
          {data.logs.slice(0, 12).map((log) => <div key={log.id} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/40 p-3 text-xs"><Activity size={15} className="mt-0.5 text-indigo-600" /><div><b>{log.action}</b><p className="text-gray-500">{log.details}</p><p className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString("id-ID")}</p></div></div>)}
        </div>
      </Panel>
      <Panel title="Backup Data" action={<button onClick={onBackup} className="btn-primary"><Download size={14} /> Download JSON</button>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.backups.map((b) => <div key={b.id} className="rounded-2xl border border-gray-100 bg-white p-4 text-xs"><b>{b.filename}</b><p className="text-gray-400 mt-1">{new Date(b.timestamp).toLocaleString("id-ID")}</p><p className="mt-3 text-gray-600">{b.recordCount.employees} karyawan · {b.recordCount.attendance} presensi</p></div>)}
        </div>
      </Panel>
    </>
  );
}

function HardwareCard({ data }: { data: BootstrapPayload }) {
  const device = data.devices[0];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500" /> Status Perangkat</h4>
      <p className="text-[11px] text-gray-500 leading-relaxed">Monitoring device RFID dan antrian sinkronisasi.</p>
      <InfoLine label="Device" value={device?.name || "-"} />
      <InfoLine label="Lokasi" value={device?.location || "-"} />
      <InfoLine label="Status" value={device?.online ? "Online" : "Offline"} />
      <InfoLine label="Power" value={device?.powerMode || "-"} />
      <InfoLine label="Battery" value={`${device?.battery ?? 0}%`} />
    </div>
  );
}

function ShiftRuleCard() {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3"><h4 className="text-xs font-bold text-gray-900">Aturan Shift</h4>{SHIFT_NAMES.map((s) => <InfoLine key={s} label={s} value={SHIFT_RULES[s].label} />)}</div>;
}

function DailyCell({ record }: { record: AttendanceRecord }) {
  return <div className="space-y-1"><p><b>Masuk</b>: {record.checkIn || "-"}</p><p><b>Mulai istirahat</b>: {record.breakStart || "-"}</p><p><b>Selesai istirahat</b>: {record.breakEnd || "-"}</p><p><b>Pulang</b>: {record.checkOut || "-"}</p><p className="font-bold text-gray-900">Kerja: {minutesToDuration(workMinutes(record))}</p></div>;
}

function AttendanceRow({ record }: { record: AttendanceRecord }) {
  return <tr className="border-b border-gray-50"><td className="py-3"><b>{record.employeeName || "Unknown"}</b><p className="text-gray-400">{record.division}</p></td><td>{formatIDDate(record.date)}</td><td>{record.shift}</td><td>{recTime(record, "checkIn")}</td><td>{recTime(record, "breakStart")} / {recTime(record, "breakEnd")}</td><td>{recTime(record, "checkOut")}</td><td><span className={`rounded-full border px-2 py-1 font-bold ${statusBadge(record.status)}`}>{statusLabel(record.status)}</span></td></tr>;
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"><h2 className="text-sm font-black text-gray-950 tracking-tight">{title}</h2>{action}</div>{children}</section>;
}

function Field({ label, compact, children }: { label: string; compact?: boolean; children: React.ReactNode }) {
  return <label className={`block ${compact ? "min-w-44" : ""}`}><span className="block text-[11px] font-bold text-gray-500 mb-1.5">{label}</span>{children}</label>;
}

function Stat({ title, value, sub, icon }: { title: string; value: number; sub: string; icon: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex items-center justify-between text-gray-400 mb-4"><span className="text-xs font-bold">{title}</span>{icon}</div><div className="text-3xl font-black text-gray-950">{value}</div><p className="text-xs text-gray-500 mt-1">{sub}</p></div>;
}

function ProgressLine({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return <div><div className="flex justify-between text-xs mb-1"><span className="font-bold text-gray-700">{label}</span><span className="text-gray-400">{value}/{total}</span></div><div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-slate-900 rounded-full" style={{ width: `${pct}%` }} /></div></div>;
}

function Avatar({ name }: { name: string }) {
  return <span className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-xs font-black shrink-0">{cardInitials(name)}</span>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs"><span className="text-gray-500">{label}</span><b className="text-gray-900 text-right">{value}</b></div>;
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={onClick} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${active ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>{icon}{label}</button>;
}

function MobileTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer ${active ? "bg-indigo-50 text-indigo-700" : "text-gray-500"}`}>{label}</button>;
}

function LoadingPanel() {
  return <div className="bg-white rounded-2xl border border-gray-100 p-24 text-center space-y-3"><span className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin inline-block" /><p className="text-xs text-gray-500">Menghubungkan dashboard...</p></div>;
}
