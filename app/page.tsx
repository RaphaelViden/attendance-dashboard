"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Edit3,
  IdCard,
  LayoutDashboard,
  Lock,
  MonitorCheck,
  RefreshCw,
  ShieldCheck,
  Users,
  Wifi
} from "lucide-react";
import { attendanceLogs as initialLogs, deviceStatus, employees } from "@/lib/demo-data";
import { formatDateID, getMonthKey, getWeekRange, isBetween, toISODate } from "@/lib/date-utils";
import type { AttendanceLog, AttendanceStatus, Employee, Role } from "@/lib/types";

const statusLabel: Record<AttendanceStatus, string> = {
  present: "Hadir",
  late: "Terlambat",
  absent: "Belum Hadir",
  leave: "Cuti",
  sick: "Sakit",
  wfh: "WFH"
};

const statusOptions: AttendanceStatus[] = ["present", "late", "absent", "leave", "sick", "wfh"];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function findEmployee(employeeId: string) {
  return employees.find((employee) => employee.id === employeeId);
}

function sortLogs(logs: AttendanceLog[]) {
  return [...logs].sort((a, b) => {
    if (a.date === b.date) {
      return (a.checkIn ?? "99:99").localeCompare(b.checkIn ?? "99:99");
    }
    return b.date.localeCompare(a.date);
  });
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`badge ${status}`}>
      <span className="status-dot" />
      {statusLabel[status]}
    </span>
  );
}

function KpiCard({
  icon,
  label,
  value,
  note
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className="card kpi">
      <div className="label">
        <span>{label}</span>
        {icon}
      </div>
      <div className="value">{value}</div>
      <div className="note">{note}</div>
    </div>
  );
}

function RoleSwitch({ role, setRole }: { role: Role; setRole: (role: Role) => void }) {
  return (
    <div className="role-panel" aria-label="Role switcher">
      <button
        className={`role-button ${role === "employee" ? "active" : ""}`}
        onClick={() => setRole("employee")}
      >
        <Users size={16} /> Karyawan
      </button>
      <button
        className={`role-button ${role === "admin" ? "active" : ""}`}
        onClick={() => setRole("admin")}
      >
        <ShieldCheck size={16} /> Admin
      </button>
    </div>
  );
}

function AttendanceTable({ logs }: { logs: AttendanceLog[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Karyawan</th>
            <th>Masuk</th>
            <th>Pulang</th>
            <th>Status</th>
            <th>Sumber</th>
          </tr>
        </thead>
        <tbody>
          {sortLogs(logs).map((log) => {
            const employee = findEmployee(log.employeeId);
            return (
              <tr key={log.id}>
                <td>{formatDateID(log.date)}</td>
                <td>
                  <div className="person-cell">
                    <span className="avatar">{initials(employee?.name ?? "?")}</span>
                    <div>
                      <strong>{employee?.name ?? "Unknown"}</strong>
                      <div className="muted">{employee?.division ?? "-"}</div>
                    </div>
                  </div>
                </td>
                <td>{log.checkIn ?? "-"}</td>
                <td>{log.checkOut ?? "-"}</td>
                <td>
                  <StatusBadge status={log.status} />
                </td>
                <td className="muted">{log.source.toUpperCase()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DevicePanel() {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Status Alat</h2>
          <p className="card-desc">Monitoring device RFID dan antrean sinkronisasi.</p>
        </div>
        <MonitorCheck size={20} />
      </div>
      <div className="card-body device-card">
        <div className="device-row">
          <span>Device</span>
          <strong>{deviceStatus.name}</strong>
        </div>
        <div className="device-row">
          <span>Lokasi</span>
          <strong>{deviceStatus.location}</strong>
        </div>
        <div className="device-row">
          <span>Status</span>
          <span className={`badge ${deviceStatus.online ? "present" : "absent"}`}>
            <span className="status-dot" />
            {deviceStatus.online ? "Online" : "Offline"}
          </span>
        </div>
        <div className="device-row">
          <span>Last Seen</span>
          <strong>{deviceStatus.lastSeen}</strong>
        </div>
        <div className="device-row">
          <span>Power</span>
          <strong>{deviceStatus.powerMode}</strong>
        </div>
        <div className="device-row">
          <span>Battery</span>
          <strong>{deviceStatus.battery}%</strong>
        </div>
        <div className="device-row">
          <span>Pending Queue</span>
          <strong>{deviceStatus.pendingQueue}</strong>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({
  logs,
  setLogs,
  onExport
}: {
  logs: AttendanceLog[];
  setLogs: (logs: AttendanceLog[]) => void;
  onExport: () => void;
}) {
  const today = toISODate(new Date());
  const [employeeId, setEmployeeId] = useState(employees[0].id);
  const [date, setDate] = useState(today);
  const [checkIn, setCheckIn] = useState("08:00");
  const [checkOut, setCheckOut] = useState("17:00");
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [note, setNote] = useState("");

  function addManualCorrection() {
    const newLog: AttendanceLog = {
      id: `manual-${Date.now()}`,
      employeeId,
      date,
      checkIn: status === "absent" || status === "leave" || status === "sick" ? null : checkIn,
      checkOut: status === "absent" || status === "leave" || status === "sick" ? null : checkOut,
      status,
      source: "manual",
      deviceId: "dashboard",
      note
    };
    setLogs([newLog, ...logs]);
    setNote("");
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Admin Control</h2>
          <p className="card-desc">Koreksi manual dan export rekap hanya tersedia untuk admin.</p>
        </div>
        <Lock size={20} />
      </div>
      <div className="card-body admin-form">
        <div className="form-grid">
          <select className="select" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <input className="input" type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
          <input className="input" type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
          <select
            className="select"
            value={status}
            onChange={(event) => setStatus(event.target.value as AttendanceStatus)}
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {statusLabel[item]}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Catatan opsional"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
        <button className="button" onClick={addManualCorrection}>
          <Edit3 size={16} /> Simpan Koreksi Manual
        </button>
        <button className="ghost-button" onClick={onExport}>
          <Download size={16} /> Download Rekap Bulanan .xlsx
        </button>
      </div>
    </div>
  );
}

function EmployeeAccessNotice() {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Akses Karyawan</h2>
          <p className="card-desc">Mode ini hanya untuk pemantauan presensi.</p>
        </div>
        <ShieldCheck size={20} />
      </div>
      <div className="card-body">
        <div className="readonly-message">
          Karyawan dapat melihat status presensi mingguan dan bulanan, tetapi tidak dapat mengubah data,
          checklist manual, atau mengunduh rekap bulanan.
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [role, setRole] = useState<Role>("employee");
  const [range, setRange] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date("2026-07-01T00:00:00")));
  const [logs, setLogs] = useState<AttendanceLog[]>(initialLogs);

  const week = useMemo(() => getWeekRange(new Date(`${selectedDate}T00:00:00`)), [selectedDate]);
  const monthKey = useMemo(() => getMonthKey(new Date(`${selectedDate}T00:00:00`)), [selectedDate]);

  const filteredLogs = useMemo(() => {
    if (range === "week") {
      return logs.filter((log) => isBetween(log.date, week.start, week.end));
    }
    return logs.filter((log) => log.date.startsWith(monthKey));
  }, [logs, monthKey, range, week.end, week.start]);

  const presentCount = filteredLogs.filter((log) => log.status === "present").length;
  const lateCount = filteredLogs.filter((log) => log.status === "late").length;
  const absentCount = filteredLogs.filter((log) => log.status === "absent").length;
  const activeEmployees = employees.filter((employee) => employee.isActive).length;

  function exportMonthly() {
    const monthLogs = logs.filter((log) => log.date.startsWith(monthKey));
    const rows = monthLogs.map((log) => {
      const employee = findEmployee(log.employeeId);
      return {
        Tanggal: log.date,
        Nama: employee?.name ?? "-",
        Divisi: employee?.division ?? "-",
        RFID: employee?.rfidUid ?? "-",
        Masuk: log.checkIn ?? "-",
        Pulang: log.checkOut ?? "-",
        Status: statusLabel[log.status],
        Sumber: log.source,
        Device: log.deviceId,
        Catatan: log.note ?? ""
      };
    });
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Rekap Presensi");
    XLSX.writeFile(workbook, `rekap-presensi-${monthKey}.xlsx`);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">K</div>
          <div>
            <div className="brand-title">Kantor Presence</div>
            <div className="brand-subtitle">RFID attendance system</div>
          </div>
        </div>
        <nav className="nav-list">
          <button className="nav-item active">
            <LayoutDashboard size={17} /> Dashboard
          </button>
          <button className="nav-item">
            <CalendarDays size={17} /> Presensi
          </button>
          <button className="nav-item">
            <IdCard size={17} /> RFID Cards
          </button>
          <button className="nav-item">
            <Activity size={17} /> Device
          </button>
        </nav>
        <div className="side-card">
          <strong>Mode demo aktif</strong>
          <p>
            Sambungkan Supabase untuk auth, database real-time, dan role production.
          </p>
        </div>
      </aside>

      <main className="main">
        <section className="topbar">
          <div>
            <div className="eyebrow">Dashboard Presensi Kantor</div>
            <h1>Monitoring kehadiran yang rapi, real-time, dan siap untuk admin.</h1>
            <p className="lead">
              Karyawan melihat rekap mingguan/bulanan secara read-only. Admin dapat melakukan koreksi
              manual, registrasi kartu, monitoring device, dan export rekap bulanan.
            </p>
          </div>
          <RoleSwitch role={role} setRole={setRole} />
        </section>

        <section className="grid kpi-grid">
          <KpiCard icon={<Users size={18} />} label="Karyawan Aktif" value={activeEmployees} note="Terhubung ke kartu RFID" />
          <KpiCard icon={<CheckCircle2 size={18} />} label="Hadir" value={presentCount} note={range === "week" ? "Pada minggu ini" : "Pada bulan ini"} />
          <KpiCard icon={<Clock3 size={18} />} label="Terlambat" value={lateCount} note="Berdasarkan jam masuk" />
          <KpiCard icon={<Wifi size={18} />} label="Queue Offline" value={deviceStatus.pendingQueue} note="Menunggu sinkronisasi" />
        </section>

        <section className="grid content-grid">
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Rekap Presensi</h2>
                <p className="card-desc">
                  {range === "week"
                    ? `Rentang Senin-Minggu: ${week.start} sampai ${week.end}`
                    : `Bulan aktif: ${monthKey}`}
                </p>
              </div>
              <RefreshCw size={20} />
            </div>
            <div className="card-body">
              <div className="toolbar">
                <select className="select" value={range} onChange={(event) => setRange(event.target.value as "week" | "month")}>
                  <option value="week">Minggu berjalan</option>
                  <option value="month">Sebulan</option>
                </select>
                <input className="input" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
                {role === "admin" ? (
                  <button className="button" onClick={exportMonthly}>
                    <Download size={16} /> Export .xlsx
                  </button>
                ) : (
                  <button className="ghost-button" disabled title="Hanya admin yang dapat download rekap">
                    <Lock size={16} /> Export Admin
                  </button>
                )}
              </div>
              <AttendanceTable logs={filteredLogs} />
              <p className="footer-note">
                Data demo menggunakan tanggal Juli 2026. Setelah Supabase aktif, tabel ini dapat membaca data asli dari alat RFID.
              </p>
            </div>
          </div>

          <div className="grid">
            <DevicePanel />
            {role === "admin" ? (
              <AdminPanel logs={logs} setLogs={setLogs} onExport={exportMonthly} />
            ) : (
              <EmployeeAccessNotice />
            )}

            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Ringkasan Status</h2>
                  <p className="card-desc">Komposisi data pada filter aktif.</p>
                </div>
                <CalendarDays size={20} />
              </div>
              <div className="card-body">
                <div className="summary-row">
                  <span>Hadir</span>
                  <strong>{presentCount}</strong>
                </div>
                <div className="summary-row">
                  <span>Terlambat</span>
                  <strong>{lateCount}</strong>
                </div>
                <div className="summary-row">
                  <span>Belum hadir</span>
                  <strong>{absentCount}</strong>
                </div>
                <div className="summary-row">
                  <span>Total log</span>
                  <strong>{filteredLogs.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
