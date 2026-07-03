"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Download,
  Fingerprint,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  Wifi
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { attendanceStatus, shiftRules, workDuration } from "@/lib/time";
import type { AttendanceDay, BootstrapData, Employee } from "@/lib/types";

type SessionUser = {
  name: string;
  email: string;
  role: "admin" | "employee";
  provider: "demo" | "supabase";
};

const emptyData: BootstrapData = {
  employees: [],
  attendance: [],
  device: {
    id: "-",
    name: "-",
    location: "-",
    online: false,
    lastSeen: "-",
    battery: 0,
    pendingQueue: 0
  }
};

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "attendance", label: "Attendance", icon: CalendarDays },
  { key: "rfid", label: "RFID Card", icon: CreditCard },
  { key: "employees", label: "Employee", icon: Users },
  { key: "device", label: "Device", icon: Activity },
  { key: "settings", label: "Settings", icon: Settings }
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function LoginView({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleGoogle() {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setMessage("Supabase belum disetting. Untuk demo lokal, pakai tombol Demo Admin.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) setMessage(error.message);
    setBusy(false);
  }

  async function handleEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || email.split("@")[0] || "User");
    const supabase = getSupabaseBrowser();

    if (!supabase) {
      onLogin({ name: fullName || "Admin Kantor", email: email || "admin@kantor.local", role: "admin", provider: "demo" });
      return;
    }

    setBusy(true);
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin } });
    setBusy(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    onLogin({ name: fullName, email, role: "employee", provider: "supabase" });
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="brand-mark">
          <Fingerprint size={22} />
          <span>Attendify HRIS</span>
        </div>
        <div>
          <p className="eyebrow">Enterprise Attendance Portal</p>
          <h1>Modern attendance management for ESP32 + RFID.</h1>
          <p className="hero-copy">
            Real-time tap events, powerful reporting, and role-based access. Built in Next.js with Supabase Auth and four-tap workday logic.
          </p>
        </div>
        <div className="hero-grid">
          <div><b>4 Tap</b><span>Masuk, istirahat, kembali, pulang</span></div>
          <div><b>Supabase</b><span>Google OAuth and realtime database</span></div>
          <div><b>RFID</b><span>ESP32 endpoint ready</span></div>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-heading">
          <h2>Welcome</h2>
          <p>Sign in or create your HRIS account.</p>
        </div>
        <div className="auth-tabs">
          <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button>
        </div>

        <form onSubmit={handleEmail} className="form-stack">
          {mode === "signup" ? (
            <label>
              Nama lengkap
              <input name="fullName" placeholder="Nama karyawan" required />
            </label>
          ) : null}
          <label>
            Email
            <input name="email" type="email" placeholder="nama@kantor.com" required />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder="Minimal 8 karakter" required />
          </label>
          <button className="primary-btn" disabled={busy} type="submit">
            <LogIn size={18} /> {mode === "signin" ? "Login" : "Create Account"}
          </button>
        </form>

        <div className="divider"><span>atau</span></div>
        <button className="outline-btn" disabled={busy} onClick={handleGoogle}>
          <span className="google-dot">G</span> Continue with Google
        </button>
        <button className="ghost-btn" onClick={() => onLogin({ name: "Admin Kantor", email: "admin@kantor.local", role: "admin", provider: "demo" })}>
          Demo Admin Lokal
        </button>
        {message ? <p className="auth-message">{message}</p> : null}
      </section>
    </main>
  );
}

function SummaryCards({ data }: { data: BootstrapData }) {
  const today = todayISO();
  const rows = data.attendance.filter((item) => item.date === today);
  const late = rows.filter((item) => {
    const employee = data.employees.find((emp) => emp.id === item.employeeId);
    return employee && attendanceStatus(item, employee.shift) === "Terlambat";
  }).length;
  const present = rows.filter((item) => item.masuk).length;
  const completed = rows.filter((item) => item.pulang).length;
  const absent = Math.max(0, data.employees.length - present);
  const tapCount = rows.reduce((total, item) => total + [item.masuk, item.mulaiIstirahat, item.selesaiIstirahat, item.pulang].filter(Boolean).length, 0);

  return (
    <section className="summary-grid">
      <article className="summary-card tone-primary"><Users /><span>Total Employees</span><strong>{data.employees.length}</strong><small>Active headcount</small></article>
      <article className="summary-card tone-success"><BadgeCheck /><span>Present Today</span><strong>{present}</strong><small>{absent} belum tap masuk</small></article>
      <article className="summary-card tone-warning"><Activity /><span>Late Today</span><strong>{late}</strong><small>berdasarkan shift</small></article>
      <article className="summary-card tone-danger"><CalendarDays /><span>Absent</span><strong>{absent}</strong><small>belum tercatat</small></article>
      <article className="summary-card tone-info"><CreditCard /><span>RFID Tap Today</span><strong>{tapCount}</strong><small>{completed} sudah pulang</small></article>
      <article className="summary-card tone-muted"><Wifi /><span>Device Status</span><strong>{data.device.online ? "Online" : "Offline"}</strong><small>ESP32 fleet</small></article>
    </section>
  );
}

function VisualCards({ data }: { data: BootstrapData }) {
  const present = data.attendance.filter((item) => item.masuk).length;
  const late = data.attendance.filter((item) => {
    const employee = data.employees.find((emp) => emp.id === item.employeeId);
    return employee && attendanceStatus(item, employee.shift) === "Terlambat";
  }).length;
  const absent = Math.max(0, data.employees.length - present);
  const max = Math.max(1, present, late, absent);

  return (
    <div className="visual-grid">
      <section className="panel">
        <div className="panel-head"><div><h2>Attendance - Last 30 Days</h2><p className="muted-copy">Unique employees who tapped per day.</p></div></div>
        <div className="line-chart" aria-label="Attendance trend">
          {Array.from({ length: 18 }).map((_, index) => <i key={index} style={{ height: `${28 + ((index * 19) % 58)}%` }} />)}
        </div>
      </section>
      <section className="panel">
        <div className="panel-head"><div><h2>Attendance Breakdown</h2><p className="muted-copy">Today's distribution.</p></div></div>
        <div className="breakdown">
          {[
            { label: "Present", value: present, className: "bar-success" },
            { label: "Late", value: late, className: "bar-warning" },
            { label: "Absent", value: absent, className: "bar-danger" }
          ].map((bar) => (
            <div key={bar.label}>
              <span>{bar.label}</span>
              <b>{bar.value}</b>
              <em><i className={bar.className} style={{ width: `${(bar.value / max) * 100}%` }} /></em>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AttendanceTable({ data }: { data: BootstrapData }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Karyawan</th>
            <th>Divisi</th>
            <th>Shift</th>
            <th>Masuk</th>
            <th>Mulai Istirahat</th>
            <th>Selesai Istirahat</th>
            <th>Pulang</th>
            <th>Jam Kerja</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.attendance.map((row) => {
            const employee = data.employees.find((item) => item.id === row.employeeId);
            if (!employee) return null;
            const status = attendanceStatus(row, employee.shift);
            return (
              <tr key={row.id}>
                <td>
                  <div className="person-cell"><span>{initials(employee.name)}</span><div><b>{employee.name}</b><small>{employee.email}</small></div></div>
                </td>
                <td>{employee.division}</td>
                <td><b>{employee.shift}</b><small className="block-muted">{shiftRules[employee.shift].start}-{shiftRules[employee.shift].end}</small></td>
                <td>{row.masuk || "-"}</td>
                <td>{row.mulaiIstirahat || "-"}</td>
                <td>{row.selesaiIstirahat || "-"}</td>
                <td>{row.pulang || "-"}</td>
                <td><span className="pill green">{workDuration(row)}</span></td>
                <td><span className={`pill ${status === "Terlambat" ? "yellow" : status === "Belum Hadir" ? "red" : "blue"}`}>{status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmployeesPanel({ data }: { data: BootstrapData }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div><p className="eyebrow">Employee Directory</p><h2>Karyawan & RFID Cards</h2></div>
        <button className="outline-btn small"><Plus size={16} /> Tambah</button>
      </div>
      <div className="employee-grid">
        {data.employees.map((employee) => (
          <article className="employee-card" key={employee.id}>
            <div className="person-cell"><span>{initials(employee.name)}</span><div><b>{employee.name}</b><small>{employee.email}</small></div></div>
            <div className="meta-row"><span>Divisi</span><b>{employee.division}</b></div>
            <div className="meta-row"><span>Shift</span><b>{employee.shift}</b></div>
            <div className="meta-row"><span>RFID UID</span><code>{employee.cardUid}</code></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DevicePanel({ data, refresh }: { data: BootstrapData; refresh: () => void }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div><p className="eyebrow">Device Monitor</p><h2>{data.device.name}</h2></div>
        <button className="icon-btn" onClick={refresh} aria-label="Refresh"><RefreshCcw size={18} /></button>
      </div>
      <div className="device-grid">
        <div><span>Device ID</span><b>{data.device.id}</b></div>
        <div><span>Lokasi</span><b>{data.device.location}</b></div>
        <div><span>Status</span><b className={data.device.online ? "ok" : "danger"}>{data.device.online ? "Online" : "Offline"}</b></div>
        <div><span>Battery</span><b>{data.device.battery}%</b></div>
        <div><span>Last Seen</span><b>{data.device.lastSeen}</b></div>
        <div><span>Pending Queue</span><b>{data.device.pendingQueue}</b></div>
      </div>
    </section>
  );
}

function RfidSimulator({ onTapped }: { onTapped: () => void }) {
  const [uid, setUid] = useState("B3:3D:1F:D3");
  const [result, setResult] = useState("");

  async function tap() {
    const res = await fetch("/api/device/tap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfid_uid: uid, device_id: "ESP32-ENTRANCE-01", device_secret: "DEV-SECRET-CHANGE-ME" })
    });
    const json = await res.json();
    setResult(json.ok ? `${json.employee.name}: ${json.event_type} ${json.time}` : json.message);
    onTapped();
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div><p className="eyebrow">RFID Tap Simulator</p><h2>Test Endpoint ESP32</h2></div>
      </div>
      <div className="inline-form">
        <input value={uid} onChange={(e) => setUid(e.target.value)} />
        <button className="primary-btn compact" onClick={tap}><Fingerprint size={16} /> Tap RFID</button>
      </div>
      {result ? <p className="notice">{result}</p> : null}
      <code className="api-box">POST /api/device/tap {"{ rfid_uid, device_id, device_secret }"}</code>
    </section>
  );
}

function ExportPanel() {
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState(todayISO());
  const href = `/api/export?start=${start}&end=${end}`;

  return (
    <section className="panel">
      <div className="panel-head"><div><p className="eyebrow">Spreadsheet</p><h2>Export Rekap</h2></div></div>
      <div className="date-grid">
        <label>Mulai<input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label>Sampai<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        <a className="primary-btn compact link-btn" href={href}><Download size={16} /> Download .xlsx</a>
      </div>
    </section>
  );
}

export default function App() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [data, setData] = useState<BootstrapData>(emptyData);
  const [active, setActive] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const [profiles, cards, taps, devices] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, department, division, shift, status").order("full_name"),
        supabase.from("rfid_cards").select("uid, employee_id, status"),
        supabase.from("attendance_taps").select("id, uid, employee_id, tapped_at, tap_type, device:devices(name)").order("tapped_at", { ascending: true }).limit(500),
        supabase.from("devices").select("id, name, location, status, last_seen_at").order("last_seen_at", { ascending: false }).limit(1)
      ]);

      if (!profiles.error && !cards.error && !taps.error) {
        const employees: Employee[] = (profiles.data ?? []).map((profile: any) => ({
          id: profile.id,
          userId: String(profile.id).slice(0, 8),
          name: profile.full_name || profile.email || "User",
          email: profile.email || "",
          division: profile.division || profile.department || "Produksi",
          shift: profile.shift || "Pagi",
          cardUid: (cards.data ?? []).find((card: any) => card.employee_id === profile.id)?.uid || "-",
          active: profile.status !== "inactive"
        }));

        const grouped = new Map<string, AttendanceDay>();
        (taps.data ?? []).forEach((tap: any) => {
          if (!tap.employee_id) return;
          const date = String(tap.tapped_at).slice(0, 10);
          const key = `${tap.employee_id}-${date}`;
          const time = new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          }).format(new Date(tap.tapped_at)).replace(".", ":");
          const row: AttendanceDay = grouped.get(key) || { id: key, employeeId: tap.employee_id, date, source: "RFID", deviceId: tap.device?.name };
          if (tap.tap_type === "MASUK" || tap.tap_type === "TIME_IN") row.masuk = time;
          if (tap.tap_type === "MULAI_ISTIRAHAT") row.mulaiIstirahat = time;
          if (tap.tap_type === "SELESAI_ISTIRAHAT") row.selesaiIstirahat = time;
          if (tap.tap_type === "PULANG" || tap.tap_type === "TIME_OUT") row.pulang = time;
          grouped.set(key, row);
        });

        const latestDevice: any = devices.data?.[0];
        setData({
          employees,
          attendance: Array.from(grouped.values()).reverse(),
          device: {
            id: latestDevice?.id || "-",
            name: latestDevice?.name || "ESP32 RFID Reader",
            location: latestDevice?.location || "Kantor Utama",
            online: latestDevice?.status === "online",
            lastSeen: latestDevice?.last_seen_at || "-",
            battery: 0,
            pendingQueue: 0
          }
        });
        return;
      }
    }

    const res = await fetch("/api/bootstrap", { cache: "no-store" });
    setData(await res.json());
  }

  useEffect(() => {
    load();
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: auth }) => {
      const user = auth.session?.user;
      if (user) setSession({ name: user.user_metadata?.full_name || user.email || "User", email: user.email || "", role: "employee", provider: "supabase" });
    });
  }, []);

  const filteredData = useMemo<BootstrapData>(() => {
    if (!query.trim()) return data;
    const needle = query.toLowerCase();
    const employees = data.employees.filter((employee) =>
      [employee.name, employee.email, employee.division, employee.shift, employee.cardUid].some((item) => item.toLowerCase().includes(needle))
    );
    return {
      ...data,
      employees,
      attendance: data.attendance.filter((row) => employees.some((employee) => employee.id === row.employeeId))
    };
  }, [data, query]);

  if (!session) return <LoginView onLogin={setSession} />;

  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="side-brand"><span><Fingerprint size={19} /></span><div><b>Attendify HRIS</b><small>Attendance System</small></div></div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={active === item.key ? "active" : ""} onClick={() => { setActive(item.key); setMenuOpen(false); }}>
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="side-user"><ShieldCheck size={17} /><div><b>{session.name}</b><small>{session.role}</small></div></div>
      </aside>
      {menuOpen ? <button className="scrim" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} /> : null}

      <main className="main">
        <header className="topbar">
          <button className="icon-btn" aria-label="Buka menu" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
          <div className="company-id"><b>PT Attendify Nusantara</b><small>Employee Attendance Portal</small></div>
          <div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employee, card, or device..." /></div>
          <span className="connection-dot"><Wifi size={14} /> ESP32 <i className={data.device.online ? "online" : "offline"} /></span>
          <span className="connection-dot"><ShieldCheck size={14} /> DB <i className="online" /></span>
          <button className="icon-btn" aria-label="Theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="logout-btn" onClick={() => setSession(null)}><LogOut size={16} /> Logout</button>
        </header>

        <div className="content">
          <div className="page-title">
            <p className="eyebrow">Overview</p>
            <h1>{active === "dashboard" ? "Dashboard" : navItems.find((item) => item.key === active)?.label}</h1>
            <p className="muted-copy">{active === "dashboard" ? "Real-time attendance and device overview." : "RFID attendance management portal."}</p>
          </div>

          {active === "dashboard" ? (
            <>
              <SummaryCards data={filteredData} />
              <VisualCards data={filteredData} />
              <div className="dashboard-grid">
                <section className="panel wide">
                  <div className="panel-head"><div><p className="eyebrow">Recent RFID Activity</p><h2>Presensi 4 Tap</h2></div><button className="icon-btn" onClick={load}><RefreshCcw size={18} /></button></div>
                  <AttendanceTable data={filteredData} />
                </section>
                <div className="stack">
                  <DevicePanel data={data} refresh={load} />
                  <ExportPanel />
                </div>
              </div>
            </>
          ) : null}

          {active === "attendance" ? <section className="panel"><div className="panel-head"><div><p className="eyebrow">Attendance Log</p><h2>Record Jam Tapping</h2></div></div><AttendanceTable data={filteredData} /></section> : null}
          {active === "employees" || active === "rfid" ? <EmployeesPanel data={filteredData} /> : null}
          {active === "device" ? <><DevicePanel data={data} refresh={load} /><RfidSimulator onTapped={load} /></> : null}
          {active === "settings" ? (
            <section className="panel">
              <div className="panel-head"><div><p className="eyebrow">Office Rules</p><h2>Shift & Integrasi</h2></div></div>
              <div className="settings-grid">
                {Object.entries(shiftRules).map(([name, rule]) => <div key={name} className="meta-row"><span>{name}</span><b>{rule.start}-{rule.end}</b></div>)}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
