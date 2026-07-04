"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import AttendanceLast30Days from "@/src/components/charts/AttendanceLast30Days";
import {
  Activity,
  BadgeCheck,
  Bell,
  CalendarDays,
  Clock3,
  CreditCard,
  Database,
  Download,
  FileDown,
  FileSpreadsheet,
  Fingerprint,
  LayoutDashboard,
  Moon,
  PanelLeft,
  Plus,
  Radio,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserX,
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

function LoginView({ onLogin, transition }: { onLogin: (user: SessionUser) => void; transition: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [signupNotice, setSignupNotice] = useState(false);

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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || email.split("@")[0] || "User");
    const supabase = getSupabaseBrowser();

    if (!supabase) {
      if (mode === "signup") {
        setSignupNotice(true);
        setMode("signin");
        formElement.reset();
        return;
      }
      onLogin({ name: fullName || "Admin Kantor", email: email || "admin@kantor.local", role: "admin", provider: "demo" });
      return;
    }

    setBusy(true);
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin } });
    setBusy(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup") {
      await supabase.auth.signOut();
      setMessage("");
      setSignupNotice(true);
      setMode("signin");
      formElement.reset();
      return;
    }

    const user = result.data.user;
    let profileName = user?.user_metadata?.full_name || "";
    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      profileName = profile?.full_name || profileName;
    }
    onLogin({
      name: profileName || user?.email?.split("@")[0] || email.split("@")[0] || "User",
      email: user?.email || email,
      role: "employee",
      provider: "supabase"
    });
  }

  return (
    <main className={`auth-shell ${transition === "to-app" ? "auth-exit" : ""}`}>
      <section className="auth-hero" aria-label="Bakmi Nikmat Rasa HRIS">
        <div className="restaurant-brand">
          <img src="/logo-bakmi.png" alt="Bakmi Nikmat Rasa" />
          <div>
            <b>BAKMI NIKMAT RASA</b>
            <span>Human Resource Information System</span>
          </div>
        </div>

        <div className="restaurant-copy">
          <h1>Smart Attendance Management with RFID Systems</h1>
          <p>"Rasanya otentik dijaga selama 3 generasi, kalau udah cobain sekali, kamu bakal balik lagi tanpa disuruh."</p>
        </div>

        <div className="restaurant-info-grid">
          <div><span>Location</span><b>DEMANGAN YOGYA</b></div>
          <div><span>Contact Info</span><b>0813-2981-2575</b></div>
          <div><span>Develop by</span><b>RAFAEL VIDENTIO S</b></div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
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
                <input name="fullName" required />
              </label>
            ) : null}
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" required />
            </label>
            <button className="primary-btn" disabled={busy} type="submit">
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="divider"><span>OR</span></div>
          <button className="outline-btn" disabled={busy} onClick={handleGoogle}>
            <span className="google-dot" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.24-.18-1.78H12v3.24h5.53c-.11.8-.72 2.01-2.07 2.82l-.02.11 3 2.26.21.02c1.93-1.74 2.95-4.3 2.95-6.67z" />
                <path fill="#34A853" d="M12 21.75c2.76 0 5.07-.88 6.76-2.4l-3.22-2.48c-.86.58-2.02.99-3.54.99-2.7 0-4.99-1.74-5.8-4.15l-.12.01-3.12 2.35-.04.11c1.68 3.25 5.12 5.57 9.08 5.57z" />
                <path fill="#FBBC05" d="M6.2 13.71a5.89 5.89 0 0 1-.31-1.86c0-.65.11-1.28.3-1.86l-.01-.13-3.16-2.39-.1.05A9.53 9.53 0 0 0 1.9 11.85c0 1.55.38 3.02 1.02 4.32l3.28-2.46z" />
                <path fill="#EB4335" d="M12 5.84c1.92 0 3.21.8 3.95 1.47l2.88-2.74C17.06 2.97 14.76 2 12 2 8.04 2 4.6 4.32 2.92 7.52l3.27 2.47c.82-2.41 3.11-4.15 5.81-4.15z" />
              </svg>
            </span>
            Continue with Google
          </button>
          <button className="ghost-btn auth-demo" onClick={() => onLogin({ name: "Admin Kantor", email: "admin@kantor.local", role: "admin", provider: "demo" })}>
            Demo Admin Lokal
          </button>
          {message ? <p className="auth-message">{message}</p> : null}
        </div>
        {signupNotice ? (
          <div className="auth-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-email-title">
            <div className="auth-confirm-modal">
              <span className="confirm-icon">✓</span>
              <h3 id="confirm-email-title">Konfirmasi Email Diperlukan</h3>
              <p>
                Akun berhasil dibuat. Silakan buka email Anda dan klik tautan konfirmasi dari Supabase sebelum masuk ke dashboard.
              </p>
              <p className="confirm-note">
                Setelah email terkonfirmasi, kembali ke halaman ini lalu masuk melalui tab <b>Sign in</b> menggunakan email dan password yang sama.
              </p>
              <button type="button" className="primary-btn" onClick={() => setSignupNotice(false)}>Saya mengerti</button>
            </div>
          </div>
        ) : null}
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
  const cards = [
    { label: "Total Employees", value: data.employees.length, hint: "Active headcount", tone: "tone-primary", accent: "#2563eb", icon: Users },
    { label: "Present Today", value: present, hint: `${absent} belum tap masuk`, tone: "tone-success", accent: "#16a34a", icon: BadgeCheck },
    { label: "Late Today", value: late, hint: "berdasarkan shift", tone: "tone-warning", accent: "#d97706", icon: Clock3 },
    { label: "Absent", value: absent, hint: "belum tercatat", tone: "tone-danger", accent: "#dc2626", icon: UserX },
    { label: "RFID Tap Today", value: tapCount, hint: `${completed} sudah pulang`, tone: "tone-info", accent: "#2563eb", icon: CreditCard },
    { label: "Device Status", value: data.device.online ? "Online" : "Offline", hint: "ESP32 fleet", tone: "tone-success", accent: "#16a34a", icon: Radio }
  ];

  return (
    <section className="summary-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className={`summary-card glow-card ${card.tone}`} key={card.label} style={{ "--card-accent": card.accent } as CSSProperties}>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.hint}</small>
            </div>
            <i className="summary-icon"><Icon size={22} /></i>
          </article>
        );
      })}
    </section>
  );
}

function VisualCards({ data }: { data: BootstrapData }) {
  const todayRows = data.attendance.filter((item) => item.date === todayISO());
  const present = todayRows.filter((item) => item.masuk).length;
  const late = todayRows.filter((item) => {
    const employee = data.employees.find((emp) => emp.id === item.employeeId);
    return employee && attendanceStatus(item, employee.shift) === "Terlambat";
  }).length;
  const absent = Math.max(0, data.employees.length - present);

  /* Build 30-day trend data for the Recharts chart */
  const trendData = useMemo(() => {
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - index));
      const iso = date.toISOString().slice(0, 10);
      const value = data.attendance.filter((item) => item.date === iso && item.masuk).length;
      return { date: iso, attendance: value };
    });
  }, [data.attendance]);

  const total = Math.max(1, present + late + absent);
  const presentDeg = (present / total) * 360;
  const lateDeg = (late / total) * 360;
  const donutStyle = {
    "--present-deg": `${presentDeg}deg`,
    "--late-deg": `${presentDeg + lateDeg}deg`
  } as CSSProperties;

  return (
    <div className="visual-grid">
      <section className="panel attendance-chart-panel">
        <AttendanceLast30Days rawData={trendData} />
      </section>
      <section className="panel">
        <div className="panel-head"><div><h2>Attendance Breakdown</h2><p className="muted-copy">Today's distribution.</p></div></div>
        <div className="donut-wrap">
          <div className="donut-chart" style={donutStyle}>
            <button className="donut-hotspot hotspot-present" type="button"><span>Present : {present}</span></button>
            <button className="donut-hotspot hotspot-late" type="button"><span>Late : {late}</span></button>
            <button className="donut-hotspot hotspot-absent" type="button"><span>Absent : {absent}</span></button>
          </div>
          <div className="donut-legend">
            <span><i className="legend-present" />Present</span>
            <span><i className="legend-late" />Late</span>
            <span><i className="legend-absent" />Absent</span>
          </div>
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [transition, setTransition] = useState<"idle" | "to-app" | "app-enter" | "to-login">("idle");

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
    supabase.auth.getSession().then(async ({ data: auth }) => {
      const user = auth.session?.user;
      if (user) {
        let profileName = user.user_metadata?.full_name || "";
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .maybeSingle();
        profileName = profile?.full_name || profileName;
        setSession({
          name: profileName || user.email?.split("@")[0] || "User",
          email: profile?.email || user.email || "",
          role: "employee",
          provider: "supabase"
        });
      }
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

  function handleLogin(user: SessionUser) {
    setTransition("to-app");
    window.setTimeout(() => {
      setSession(user);
      setTransition("app-enter");
      window.setTimeout(() => setTransition("idle"), 520);
    }, 420);
  }

  if (!session) return <LoginView onLogin={handleLogin} transition={transition} />;

  async function handleSignOut() {
    setTransition("to-login");
    setProfileOpen(false);
    const supabase = getSupabaseBrowser();
    await supabase?.auth.signOut();
    window.setTimeout(() => {
      setSession(null);
      setTransition("idle");
    }, 380);
  }

  return (
    <div className={`${dark ? "app dark" : "app"} ${menuOpen ? "nav-open" : "nav-closed"} ${transition === "app-enter" ? "app-enter" : ""} ${transition === "to-login" ? "app-exit" : ""}`}>
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
          <button className="topbar-menu" aria-label={menuOpen ? "Sembunyikan menu" : "Tampilkan menu"} onClick={() => setMenuOpen((value) => !value)}><PanelLeft size={18} /></button>
          <div className="company-id"><b>PT Attendify Nusantara</b><small>Employee Attendance Portal</small></div>
          <div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employees, RFID, devices..." /></div>
          <div className="topbar-right">
            <span className="connection-dot"><Radio size={14} /> ESP32 <i className={data.device.online ? "online" : "offline"} /></span>
            <span className="connection-dot"><Database size={14} /> DB <i className="online" /></span>
            <span className="connection-dot"><Wifi size={14} /> API <i className="online" /></span>
            <button className="icon-btn" aria-label="Theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="icon-btn bell-btn" aria-label="Notifications"><Bell size={18} /></button>
            <div className="profile-menu">
              <button className="avatar-btn" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen} aria-label="Buka menu profil">
                {initials(session.name || "User")}
              </button>
              {profileOpen ? (
                <div className="profile-popover">
                  <div className="profile-popover-head">
                    <b>{session.name}</b>
                    <small>{session.email || "No email connected"}</small>
                  </div>
                  <button type="button" onClick={() => { setActive("settings"); setProfileOpen(false); }}>Settings</button>
                  <button type="button" className="signout-item" onClick={handleSignOut}>Sign out</button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="content">
          <div className="dashboard-title-row">
            <div className="page-title">
              <h1>{active === "dashboard" ? "Dashboard" : navItems.find((item) => item.key === active)?.label}</h1>
              <p className="muted-copy">{active === "dashboard" ? "Real-time attendance and device overview." : "RFID attendance management portal."}</p>
            </div>
            {active === "dashboard" ? (
              <div className="dashboard-actions">
                <a className="action-btn" href={`/api/export?start=${todayISO()}&end=${todayISO()}`}><FileSpreadsheet size={16} />Export XLSX</a>
                <button className="action-btn" type="button"><FileDown size={16} />Export PDF</button>
                <button className="action-btn primary-action" onClick={load} type="button"><RefreshCcw size={16} />Refresh</button>
              </div>
            ) : null}
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
