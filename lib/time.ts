import type { AttendanceDay, ShiftName } from "./types";

export const shiftRules: Record<ShiftName, { start: string; end: string }> = {
  Pagi: { start: "08:00", end: "16:00" },
  Siang: { start: "14:00", end: "22:00" },
  Middle: { start: "12:00", end: "20:00" },
  "Middle Closing": { start: "12:00", end: "22:00" },
  "Pagi Middle": { start: "08:00", end: "20:00" },
  Fullday: { start: "08:00", end: "22:00" }
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .format(date)
    .replace(".", ":");
}

export function timeToMinutes(value?: string) {
  if (!value || !value.includes(":")) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function minutesToDuration(minutes: number) {
  if (minutes <= 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}j ${m}m` : `${h}j`;
}

export function workMinutes(row: AttendanceDay) {
  const masuk = timeToMinutes(row.masuk);
  const mulai = timeToMinutes(row.mulaiIstirahat);
  const selesai = timeToMinutes(row.selesaiIstirahat);
  const pulang = timeToMinutes(row.pulang);

  if (masuk === null || pulang === null) return 0;
  if (mulai !== null && selesai !== null) return Math.max(0, mulai - masuk) + Math.max(0, pulang - selesai);
  return Math.max(0, pulang - masuk);
}

export function workDuration(row: AttendanceDay) {
  return minutesToDuration(workMinutes(row));
}

export function attendanceStatus(row: AttendanceDay, shift: ShiftName) {
  if (!row.masuk) return "Belum Hadir";
  const actual = timeToMinutes(row.masuk);
  const expected = timeToMinutes(shiftRules[shift].start);
  if (actual !== null && expected !== null && actual > expected + 5) return "Terlambat";
  if (row.pulang) return "Selesai";
  return "Berjalan";
}
