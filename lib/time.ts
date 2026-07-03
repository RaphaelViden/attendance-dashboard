import { SHIFT_RULES } from "./constants";
import type { AttendanceRecord, Employee, ShiftName } from "./types";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTimeHHmm(): string {
  return new Date().toTimeString().slice(0, 5);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, offset: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + offset);
  return d;
}

export function timeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [hh, mm] = time.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

export function minutesToDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0j 0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}j ${m}m`;
}

export function workMinutes(record: Pick<AttendanceRecord, "checkIn" | "breakStart" | "breakEnd" | "checkOut">): number {
  const inMin = timeToMinutes(record.checkIn);
  const breakStart = timeToMinutes(record.breakStart);
  const breakEnd = timeToMinutes(record.breakEnd);
  const outMin = timeToMinutes(record.checkOut);

  if (inMin == null || outMin == null) return 0;
  if (breakStart != null && breakEnd != null) {
    return Math.max(0, breakStart - inMin) + Math.max(0, outMin - breakEnd);
  }
  return Math.max(0, outMin - inMin);
}

export function workDuration(record: Pick<AttendanceRecord, "checkIn" | "breakStart" | "breakEnd" | "checkOut">): string {
  return minutesToDuration(workMinutes(record));
}

export function isLateForShift(shift: ShiftName, checkIn: string): boolean {
  const start = timeToMinutes(SHIFT_RULES[shift].start) ?? 0;
  const actual = timeToMinutes(checkIn) ?? 0;
  return actual > start;
}

export function dateRange(startISO: string, endISO: string): string[] {
  const result: string[] = [];
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    result.push(isoDate(d));
  }
  return result;
}

export function formatIDDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function normalizeCardUid(uid: string): string {
  return uid.trim().toUpperCase().replace(/\s+/g, ":").replace(/-/g, ":");
}

export function createEmptyRecord(employee: Employee | null, date: string, deviceId = "dashboard"): AttendanceRecord {
  return {
    id: `ATT-${employee?.id ?? "unknown"}-${date}`,
    employeeId: employee?.id ?? null,
    employeeName: employee?.name,
    division: employee?.division,
    shift: employee?.shift,
    rfidUid: employee?.rfidUid,
    date,
    checkIn: null,
    breakStart: null,
    breakEnd: null,
    checkOut: null,
    status: "incomplete",
    source: "manual",
    deviceId,
    updatedAt: new Date().toISOString()
  };
}
