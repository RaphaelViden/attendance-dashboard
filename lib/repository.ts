import { DIVISIONS, SHIFT_RULES, TAP_FLOW } from "./constants";
import { seedAttendance, seedBackups, seedDevices, seedEmployees, seedLogs } from "./demo-data";
import { createEmptyRecord, isLateForShift, nowTimeHHmm, normalizeCardUid, todayISO, workMinutes } from "./time";
import type { ActivityLog, AttendanceRecord, BackupHistory, BootstrapPayload, DashboardStats, DeviceStatus, Employee, EmployeeDivision, ShiftName, TapField } from "./types";

type Database = {
  employees: Employee[];
  attendance: AttendanceRecord[];
  logs: ActivityLog[];
  backups: BackupHistory[];
  devices: DeviceStatus[];
};

declare global {
  // eslint-disable-next-line no-var
  var __TAPP_DB__: Database | undefined;
}

function memoryDb(): Database {
  if (!globalThis.__TAPP_DB__) {
    globalThis.__TAPP_DB__ = {
      employees: [...seedEmployees],
      attendance: [...seedAttendance],
      logs: [...seedLogs],
      backups: [...seedBackups],
      devices: [...seedDevices]
    };
  }
  return globalThis.__TAPP_DB__;
}

function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseHeaders(prefer?: string): HeadersInit {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

async function sb<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const res = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: { ...supabaseHeaders(init.headers instanceof Headers ? undefined : undefined), ...(init.headers || {}) },
    cache: "no-store"
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function sortByDateDesc(a: AttendanceRecord, b: AttendanceRecord) {
  return `${b.date} ${b.checkIn || "99:99"}`.localeCompare(`${a.date} ${a.checkIn || "99:99"}`);
}

function mapEmployee(row: any, cards: any[] = []): Employee {
  const card = cards.find((c) => c.employee_id === row.id && c.is_active !== false);
  return {
    id: String(row.id),
    name: row.full_name || row.name,
    division: row.division,
    shift: row.shift || "Pagi",
    rfidUid: normalizeCardUid(card?.rfid_uid || row.rfid_uid || ""),
    email: row.email || "",
    phone: row.phone || "",
    isActive: row.is_active !== false,
    joinedDate: row.joined_date || row.created_at?.slice(0, 10) || todayISO()
  };
}

function mapAttendance(row: any, employees: Employee[]): AttendanceRecord {
  const employee = employees.find((e) => e.id === String(row.employee_id));
  return {
    id: String(row.id),
    employeeId: row.employee_id ? String(row.employee_id) : null,
    employeeName: employee?.name,
    division: employee?.division,
    shift: employee?.shift,
    rfidUid: row.rfid_uid || employee?.rfidUid,
    date: row.attendance_date || row.date,
    checkIn: normalizeTime(row.check_in || row.checkIn),
    breakStart: normalizeTime(row.break_start || row.breakStart),
    breakEnd: normalizeTime(row.break_end || row.breakEnd),
    checkOut: normalizeTime(row.check_out || row.checkOut),
    status: row.status || "present",
    source: row.source || "rfid",
    deviceId: row.device_id || row.deviceId || "dashboard",
    note: row.note || undefined,
    updatedAt: row.updated_at || row.updatedAt
  };
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  return String(value).slice(0, 5);
}

function mapDevice(row: any): DeviceStatus {
  return {
    deviceId: row.id || row.device_id || row.deviceId,
    name: row.name || "RFID Reader",
    location: row.location || "Kantor",
    online: row.is_active !== false,
    lastSeen: row.last_seen || row.lastSeen || new Date().toISOString(),
    powerMode: row.power_mode || row.powerMode || "AC",
    battery: row.battery_percent ?? row.battery ?? 100,
    pendingQueue: row.pending_queue ?? row.pendingQueue ?? 0
  };
}

async function listEmployees(): Promise<Employee[]> {
  if (!supabaseConfigured()) return [...memoryDb().employees];
  const [rows, cards] = await Promise.all([
    sb<any[]>("employees?select=*&order=full_name.asc"),
    sb<any[]>("rfid_cards?select=*")
  ]);
  return rows.map((row) => mapEmployee(row, cards));
}

async function listAttendance(employeesArg?: Employee[]): Promise<AttendanceRecord[]> {
  const employees = employeesArg || await listEmployees();
  if (!supabaseConfigured()) {
    return memoryDb().attendance
      .map((rec) => enrichRecord(rec, employees))
      .sort(sortByDateDesc);
  }
  const rows = await sb<any[]>("attendance_logs?select=*&order=attendance_date.desc,updated_at.desc");
  return rows.map((row) => mapAttendance(row, employees)).sort(sortByDateDesc);
}

async function listLogs(): Promise<ActivityLog[]> {
  if (!supabaseConfigured()) return [...memoryDb().logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const rows = await sb<any[]>("attendance_audit_logs?select=*&order=created_at.desc&limit=120");
  return rows.map((row) => ({
    id: String(row.id),
    timestamp: row.created_at,
    action: row.action,
    user: row.metadata?.user || "system",
    details: row.metadata?.details || row.action,
    type: row.metadata?.type || "info",
    cardUid: row.metadata?.cardUid
  }));
}

async function listDevices(): Promise<DeviceStatus[]> {
  if (!supabaseConfigured()) return [...memoryDb().devices];
  const rows = await sb<any[]>("devices?select=*&order=name.asc");
  return rows.map(mapDevice);
}

function listBackups(db: Database): BackupHistory[] {
  return [
    {
      id: `BACKUP-${Date.now()}`,
      filename: `tappresensi-export-${todayISO()}.json`,
      timestamp: new Date().toISOString(),
      size: "on-demand",
      recordCount: {
        employees: db.employees.length,
        attendance: db.attendance.length,
        logs: db.logs.length
      }
    },
    ...db.backups
  ].slice(0, 6);
}

function enrichRecord(record: AttendanceRecord, employees: Employee[]): AttendanceRecord {
  const employee = employees.find((e) => e.id === record.employeeId);
  return {
    ...record,
    employeeName: employee?.name || record.employeeName,
    division: employee?.division || record.division,
    shift: employee?.shift || record.shift,
    rfidUid: employee?.rfidUid || record.rfidUid
  };
}

export async function getBootstrap(): Promise<BootstrapPayload> {
  const employees = await listEmployees();
  const attendance = await listAttendance(employees);
  const logs = await listLogs();
  const devices = await listDevices();
  const db = { employees, attendance, logs, devices, backups: memoryDb().backups };
  return {
    employees,
    attendance,
    logs,
    devices,
    backups: listBackups(db),
    stats: computeStats(employees, attendance),
    mode: supabaseConfigured() ? "supabase" : "demo-memory"
  };
}

export async function exportDatabase() {
  const payload = await getBootstrap();
  return {
    exportedAt: new Date().toISOString(),
    app: "TAPPRESENSI Vercel 4-Tap",
    ...payload
  };
}

export async function addActivityLog(input: Omit<ActivityLog, "id" | "timestamp">): Promise<ActivityLog> {
  const log: ActivityLog = { id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(), ...input };
  if (!supabaseConfigured()) {
    memoryDb().logs.unshift(log);
    return log;
  }
  await sb<any[]>("attendance_audit_logs", {
    method: "POST",
    headers: supabaseHeaders("return=minimal"),
    body: JSON.stringify({
      action: log.action,
      target_table: "system",
      target_id: log.cardUid || null,
      metadata: { user: log.user, details: log.details, type: log.type, cardUid: log.cardUid }
    })
  });
  return log;
}

export async function createEmployee(data: Omit<Employee, "id" | "joinedDate">): Promise<Employee> {
  const normalized: Omit<Employee, "id" | "joinedDate"> = { ...data, rfidUid: normalizeCardUid(data.rfidUid) };
  if (!supabaseConfigured()) {
    const id = `EMP-${String(memoryDb().employees.length + 1).padStart(3, "0")}`;
    const employee: Employee = { ...normalized, id, joinedDate: todayISO() };
    memoryDb().employees.push(employee);
    await addActivityLog({ action: "Employee Created", user: "admin", details: `Karyawan ${employee.name} ditambahkan.`, type: "success" });
    return employee;
  }
  const inserted = await sb<any[]>("employees", {
    method: "POST",
    headers: supabaseHeaders("return=representation"),
    body: JSON.stringify({ full_name: normalized.name, division: normalized.division, shift: normalized.shift, email: normalized.email, phone: normalized.phone, is_active: normalized.isActive })
  });
  const row = inserted[0];
  if (normalized.rfidUid) {
    await sb("rfid_cards", {
      method: "POST",
      headers: supabaseHeaders("return=minimal"),
      body: JSON.stringify({ employee_id: row.id, rfid_uid: normalized.rfidUid, is_active: true })
    });
  }
  await addActivityLog({ action: "Employee Created", user: "admin", details: `Karyawan ${normalized.name} ditambahkan.`, type: "success" });
  return { ...normalized, id: row.id, joinedDate: row.created_at?.slice(0, 10) || todayISO() };
}

export async function updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
  const cleaned: Partial<Employee> = {};
  for (const [key, value] of Object.entries(data) as [keyof Employee, Employee[keyof Employee]][]) {
    if (value !== undefined) (cleaned as any)[key] = value;
  }
  if (typeof cleaned.rfidUid === "string") cleaned.rfidUid = normalizeCardUid(cleaned.rfidUid);
  if (!supabaseConfigured()) {
    const db = memoryDb();
    const idx = db.employees.findIndex((e) => e.id === id);
    if (idx < 0) throw Object.assign(new Error("Karyawan tidak ditemukan."), { status: 404 });
    db.employees[idx] = { ...db.employees[idx], ...cleaned };
    db.attendance = db.attendance.map((r) => enrichRecord(r, db.employees));
    await addActivityLog({ action: "Employee Updated", user: "admin", details: `Profil ${db.employees[idx].name} diperbarui.`, type: "info" });
    return db.employees[idx];
  }
  await sb(`employees?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: supabaseHeaders("return=minimal"),
    body: JSON.stringify({
      ...(cleaned.name !== undefined ? { full_name: cleaned.name } : {}),
      ...(cleaned.division !== undefined ? { division: cleaned.division } : {}),
      ...(cleaned.shift !== undefined ? { shift: cleaned.shift } : {}),
      ...(cleaned.email !== undefined ? { email: cleaned.email } : {}),
      ...(cleaned.phone !== undefined ? { phone: cleaned.phone } : {}),
      ...(cleaned.isActive !== undefined ? { is_active: cleaned.isActive } : {})
    })
  });
  if (cleaned.rfidUid !== undefined) {
    const existing = await sb<any[]>(`rfid_cards?employee_id=eq.${encodeURIComponent(id)}&select=id`);
    if (existing[0]) {
      await sb(`rfid_cards?id=eq.${existing[0].id}`, { method: "PATCH", headers: supabaseHeaders("return=minimal"), body: JSON.stringify({ rfid_uid: cleaned.rfidUid, is_active: Boolean(cleaned.rfidUid) }) });
    } else if (cleaned.rfidUid) {
      await sb("rfid_cards", { method: "POST", headers: supabaseHeaders("return=minimal"), body: JSON.stringify({ employee_id: id, rfid_uid: cleaned.rfidUid, is_active: true }) });
    }
  }
  await addActivityLog({ action: "Employee Updated", user: "admin", details: `Profil karyawan ${id} diperbarui.`, type: "info" });
  const employees = await listEmployees();
  const employee = employees.find((e) => e.id === id);
  if (!employee) throw Object.assign(new Error("Karyawan tidak ditemukan."), { status: 404 });
  return employee;
}

export async function deleteEmployee(id: string): Promise<void> {
  if (!supabaseConfigured()) {
    const db = memoryDb();
    const employee = db.employees.find((e) => e.id === id);
    db.employees = db.employees.filter((e) => e.id !== id);
    db.attendance = db.attendance.filter((a) => a.employeeId !== id);
    await addActivityLog({ action: "Employee Deleted", user: "admin", details: `Karyawan ${employee?.name || id} dihapus.`, type: "warning" });
    return;
  }
  await sb(`employees?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: supabaseHeaders("return=minimal") });
  await addActivityLog({ action: "Employee Deleted", user: "admin", details: `Karyawan ${id} dihapus.`, type: "warning" });
}

export async function saveAttendanceRecord(record: AttendanceRecord): Promise<AttendanceRecord> {
  const employees = await listEmployees();
  const enriched = enrichRecord(record, employees);
  if (!supabaseConfigured()) {
    const db = memoryDb();
    const idx = db.attendance.findIndex((r) => r.id === enriched.id || (r.employeeId === enriched.employeeId && r.date === enriched.date));
    if (idx >= 0) db.attendance[idx] = { ...db.attendance[idx], ...enriched, updatedAt: new Date().toISOString() };
    else db.attendance.unshift({ ...enriched, updatedAt: new Date().toISOString() });
    return enrichRecord(idx >= 0 ? db.attendance[idx] : db.attendance[0], db.employees);
  }
  const existing = enriched.employeeId
    ? await sb<any[]>(`attendance_logs?employee_id=eq.${encodeURIComponent(enriched.employeeId)}&attendance_date=eq.${enriched.date}&select=id`)
    : [];
  const body = {
    employee_id: enriched.employeeId,
    rfid_uid: enriched.rfidUid,
    attendance_date: enriched.date,
    check_in: enriched.checkIn,
    break_start: enriched.breakStart,
    break_end: enriched.breakEnd,
    check_out: enriched.checkOut,
    status: enriched.status,
    source: enriched.source,
    device_id: enriched.deviceId,
    note: enriched.note || null,
    updated_at: new Date().toISOString()
  };
  if (existing[0]) {
    await sb(`attendance_logs?id=eq.${existing[0].id}`, { method: "PATCH", headers: supabaseHeaders("return=minimal"), body: JSON.stringify(body) });
    return { ...enriched, id: existing[0].id };
  }
  const inserted = await sb<any[]>("attendance_logs", { method: "POST", headers: supabaseHeaders("return=representation"), body: JSON.stringify(body) });
  return { ...enriched, id: inserted[0]?.id || enriched.id };
}

function nextTapField(record: AttendanceRecord): TapField | null {
  for (const item of TAP_FLOW) {
    if (!record[item.field]) return item.field;
  }
  return null;
}

export async function processDeviceTap(input: { rfidUid: string; deviceId: string; deviceName?: string; powerMode?: "AC" | "Battery"; battery?: number }): Promise<{ record: AttendanceRecord | null; eventType: string; message: string; employee?: Employee }> {
  const rfidUid = normalizeCardUid(input.rfidUid);
  const employees = await listEmployees();
  const employee = employees.find((e) => e.isActive && normalizeCardUid(e.rfidUid) === rfidUid);
  const date = todayISO();

  await upsertDeviceSeen(input.deviceId, input.deviceName || input.deviceId, input.powerMode || "AC", input.battery ?? 100);

  if (!employee) {
    await addActivityLog({ action: "Unregistered Card Tapped", user: input.deviceId, details: `Kartu RFID tidak dikenal: [${rfidUid}]`, type: "warning", cardUid: rfidUid });
    return { record: null, eventType: "unknown_card", message: `Kartu ${rfidUid} belum terdaftar.` };
  }

  const attendance = await listAttendance(employees);
  const existing = attendance.find((r) => r.employeeId === employee.id && r.date === date);
  const record = existing ? { ...existing } : createEmptyRecord(employee, date, input.deviceId);
  const field = nextTapField(record);
  if (!field) {
    await addActivityLog({ action: "Extra Tap Ignored", user: input.deviceId, details: `${employee.name} melakukan tap tambahan setelah Pulang.`, type: "warning", cardUid: rfidUid });
    return { record, eventType: "extra_tap", message: "Empat tap hari ini sudah lengkap.", employee };
  }

  const time = nowTimeHHmm();
  record[field] = time;
  record.source = "rfid";
  record.deviceId = input.deviceId;
  record.rfidUid = rfidUid;
  record.employeeId = employee.id;
  record.employeeName = employee.name;
  record.division = employee.division;
  record.shift = employee.shift;
  record.status = deriveStatus(employee, record);
  record.updatedAt = new Date().toISOString();

  const saved = await saveAttendanceRecord(record);
  const flow = TAP_FLOW.find((item) => item.field === field);
  await addActivityLog({ action: `RFID Tap - ${flow?.label}`, user: input.deviceId, details: `${employee.name} tercatat ${flow?.label} pada ${time}.`, type: "success", cardUid: rfidUid });
  return { record: saved, eventType: flow?.event || field, message: `${flow?.label} ${employee.name} tercatat ${time}.`, employee };
}

function deriveStatus(employee: Employee, record: AttendanceRecord): AttendanceRecord["status"] {
  if (!record.checkIn) return "incomplete";
  if (isLateForShift(employee.shift, record.checkIn)) return "late";
  if (record.checkIn && record.breakStart && record.breakEnd && record.checkOut) return "present";
  return "incomplete";
}

async function upsertDeviceSeen(deviceId: string, name: string, powerMode: "AC" | "Battery", battery: number) {
  const now = new Date().toISOString();
  if (!supabaseConfigured()) {
    const db = memoryDb();
    const idx = db.devices.findIndex((d) => d.deviceId === deviceId);
    const device: DeviceStatus = { deviceId, name, location: "Kantor Utama", online: true, lastSeen: now, powerMode, battery, pendingQueue: 0 };
    if (idx >= 0) db.devices[idx] = { ...db.devices[idx], ...device };
    else db.devices.push(device);
    return;
  }
  await sb("devices?on_conflict=id", {
    method: "POST",
    headers: supabaseHeaders("resolution=merge-duplicates,return=minimal"),
    body: JSON.stringify({ id: deviceId, name, location: "Kantor Utama", is_active: true, last_seen: now, power_mode: powerMode, battery_percent: battery, pending_queue: 0 })
  });
}

export function computeStats(employees: Employee[], records: AttendanceRecord[]): DashboardStats {
  const today = todayISO();
  const active = employees.filter((e) => e.isActive);
  const todayRecords = records.filter((r) => r.date === today);
  const present = todayRecords.filter((r) => ["present", "late", "incomplete"].includes(r.status) && r.checkIn).length;
  const late = todayRecords.filter((r) => r.status === "late").length;
  const incomplete = todayRecords.filter((r) => r.status === "incomplete").length;
  const onTime = Math.max(0, present - late);

  const divisionStats = DIVISIONS.map((division) => {
    const total = active.filter((e) => e.division === division).length;
    const presentInDivision = todayRecords.filter((r) => r.division === division && r.checkIn).length;
    return { name: division, total, present: presentInDivision };
  });

  const shiftStats = (Object.keys(SHIFT_RULES) as ShiftName[]).map((shift) => {
    const total = active.filter((e) => e.shift === shift).length;
    const presentInShift = todayRecords.filter((r) => r.shift === shift && r.checkIn).length;
    return { name: shift, total, present: presentInShift };
  });

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const weeklyTrends = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const iso = d.toISOString().slice(0, 10);
    const dayRecords = records.filter((r) => r.date === iso);
    return {
      dayName: dayNames[d.getDay()],
      present: dayRecords.filter((r) => r.checkIn && r.status !== "late").length,
      late: dayRecords.filter((r) => r.status === "late").length,
      incomplete: dayRecords.filter((r) => r.status === "incomplete").length
    };
  });

  return {
    totalEmployees: employees.length,
    activeEmployees: active.length,
    todayPresentCount: present,
    todayLateCount: late,
    todayIncompleteCount: incomplete,
    onTimeRate: present > 0 ? Math.round((onTime / present) * 100) : 100,
    divisionStats,
    shiftStats,
    weeklyTrends
  };
}
