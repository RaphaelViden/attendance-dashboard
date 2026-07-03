import type { AttendanceDay, BootstrapData, DeviceStatus, Employee, TapEventType } from "./types";
import { formatTime, todayISO } from "./time";

const employees: Employee[] = [
  { id: "emp-001", userId: "001", name: "Raphael Viden", email: "raphael@kantor.local", division: "Produksi", shift: "Pagi", cardUid: "B3:3D:1F:D3", active: true },
  { id: "emp-002", userId: "002", name: "Budi Santoso", email: "budi@kantor.local", division: "Kitchen", shift: "Middle", cardUid: "4A:82:B6:C3", active: true },
  { id: "emp-003", userId: "003", name: "Siti Rahma", email: "siti@kantor.local", division: "Casier", shift: "Siang", cardUid: "19:7C:22:90", active: true },
  { id: "emp-004", userId: "004", name: "Nadia Putri", email: "nadia@kantor.local", division: "Part-time", shift: "Middle Closing", cardUid: "88:12:40:EF", active: true },
  { id: "emp-005", userId: "005", name: "Dimas Arya", email: "dimas@kantor.local", division: "Produksi", shift: "Fullday", cardUid: "72:9B:10:AC", active: true }
];

const attendance: AttendanceDay[] = [
  { id: "att-001", employeeId: "emp-001", date: todayISO(), masuk: "08:02", mulaiIstirahat: "12:05", selesaiIstirahat: "13:03", pulang: "16:05", source: "RFID", deviceId: "ESP32-ENTRANCE-01" },
  { id: "att-002", employeeId: "emp-002", date: todayISO(), masuk: "12:00", mulaiIstirahat: "15:30", selesaiIstirahat: "16:15", pulang: "20:12", source: "RFID", deviceId: "ESP32-ENTRANCE-01" },
  { id: "att-003", employeeId: "emp-003", date: todayISO(), masuk: "14:08", mulaiIstirahat: "18:00", selesaiIstirahat: "18:30", source: "RFID", deviceId: "ESP32-ENTRANCE-01" }
];

const device: DeviceStatus = {
  id: "ESP32-ENTRANCE-01",
  name: "Main Entrance Reader",
  location: "Kantor Utama",
  online: true,
  lastSeen: new Date().toISOString(),
  battery: 92,
  pendingQueue: 0
};

function normalizeUid(uid: string) {
  return uid.trim().replace(/\s+/g, ":").replace(/-/g, ":").toUpperCase();
}

function nextTapType(day?: AttendanceDay): TapEventType {
  if (!day?.masuk) return "masuk";
  if (!day.mulaiIstirahat) return "mulai_istirahat";
  if (!day.selesaiIstirahat) return "selesai_istirahat";
  if (!day.pulang) return "pulang";
  return "extra_tap";
}

export function getBootstrap(): BootstrapData {
  return { employees, attendance, device };
}

export function recordTap(payload: { rfid_uid: string; device_id?: string; device_secret?: string; tapped_at?: string }) {
  const configuredSecret = process.env.DEVICE_SECRET || "DEV-SECRET-CHANGE-ME";
  if (payload.device_secret && payload.device_secret !== configuredSecret) {
    return { ok: false, status: 401, message: "Device secret tidak valid." };
  }

  const uid = normalizeUid(payload.rfid_uid);
  const employee = employees.find((item) => normalizeUid(item.cardUid) === uid && item.active);
  if (!employee) {
    return { ok: false, status: 404, message: "Kartu RFID belum terdaftar.", rfid_uid: uid };
  }

  const date = new Date(payload.tapped_at || Date.now()).toISOString().slice(0, 10);
  const time = payload.tapped_at ? formatTime(new Date(payload.tapped_at)) : formatTime();
  let row = attendance.find((item) => item.employeeId === employee.id && item.date === date);
  if (!row) {
    row = {
      id: `att-${Date.now()}`,
      employeeId: employee.id,
      date,
      source: "RFID",
      deviceId: payload.device_id || device.id
    };
    attendance.unshift(row);
  }

  const eventType = nextTapType(row);
  if (eventType === "masuk") row.masuk = time;
  if (eventType === "mulai_istirahat") row.mulaiIstirahat = time;
  if (eventType === "selesai_istirahat") row.selesaiIstirahat = time;
  if (eventType === "pulang") row.pulang = time;

  device.lastSeen = new Date().toISOString();
  device.id = payload.device_id || device.id;
  device.online = true;

  return { ok: true, status: 200, event_type: eventType, time, employee, attendance: row };
}
