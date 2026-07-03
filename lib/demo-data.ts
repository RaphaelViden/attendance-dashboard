import { addDays, isoDate } from "./time";
import type { ActivityLog, AttendanceRecord, BackupHistory, DeviceStatus, Employee } from "./types";

const today = new Date();
const d0 = isoDate(today);
const d1 = isoDate(addDays(today, -1));
const d2 = isoDate(addDays(today, -2));

export const seedEmployees: Employee[] = [
  { id: "EMP-001", name: "Raphael Viden", division: "Produksi", shift: "Pagi", rfidUid: "B3:3D:1F:D3", email: "raphael@kantor.local", phone: "081234567890", isActive: true, joinedDate: "2026-01-12" },
  { id: "EMP-002", name: "Budi Santoso", division: "Kitchen", shift: "Siang", rfidUid: "8A:12:4F:90", email: "budi@kantor.local", phone: "082198765432", isActive: true, joinedDate: "2026-02-01" },
  { id: "EMP-003", name: "Siti Rahma", division: "Casier", shift: "Middle", rfidUid: "04:91:AA:2C", email: "siti@kantor.local", phone: "083145678912", isActive: true, joinedDate: "2026-02-14" },
  { id: "EMP-004", name: "Andi Pratama", division: "Produksi", shift: "Middle Closing", rfidUid: "7C:3F:80:19", email: "andi@kantor.local", phone: "085278912345", isActive: true, joinedDate: "2026-03-20" },
  { id: "EMP-005", name: "Nadia Putri", division: "Part-time", shift: "Pagi Middle", rfidUid: "D2:14:9A:EF", email: "nadia@kantor.local", phone: "087812345678", isActive: true, joinedDate: "2026-04-11" },
  { id: "EMP-006", name: "Dimas Arya", division: "Kitchen", shift: "Fullday", rfidUid: "A9:01:18:61", email: "dimas@kantor.local", phone: "081398761234", isActive: true, joinedDate: "2026-05-05" }
];

export const seedAttendance: AttendanceRecord[] = [
  { id: `ATT-EMP-001-${d0}`, employeeId: "EMP-001", employeeName: "Raphael Viden", division: "Produksi", shift: "Pagi", rfidUid: "B3:3D:1F:D3", date: d0, checkIn: "08:01", breakStart: "12:00", breakEnd: "13:00", checkOut: "16:04", status: "late", source: "rfid", deviceId: "attendance-esp32-001" },
  { id: `ATT-EMP-002-${d0}`, employeeId: "EMP-002", employeeName: "Budi Santoso", division: "Kitchen", shift: "Siang", rfidUid: "8A:12:4F:90", date: d0, checkIn: "13:56", breakStart: "18:00", breakEnd: "18:45", checkOut: null, status: "incomplete", source: "rfid", deviceId: "attendance-esp32-001" },
  { id: `ATT-EMP-003-${d0}`, employeeId: "EMP-003", employeeName: "Siti Rahma", division: "Casier", shift: "Middle", rfidUid: "04:91:AA:2C", date: d0, checkIn: "11:53", breakStart: "15:00", breakEnd: "15:45", checkOut: "20:05", status: "present", source: "rfid", deviceId: "attendance-esp32-001" },
  { id: `ATT-EMP-004-${d0}`, employeeId: "EMP-004", employeeName: "Andi Pratama", division: "Produksi", shift: "Middle Closing", rfidUid: "7C:3F:80:19", date: d0, checkIn: null, breakStart: null, breakEnd: null, checkOut: null, status: "leave", source: "manual", deviceId: "dashboard", note: "Izin/cuti" },
  { id: `ATT-EMP-001-${d1}`, employeeId: "EMP-001", employeeName: "Raphael Viden", division: "Produksi", shift: "Pagi", rfidUid: "B3:3D:1F:D3", date: d1, checkIn: "07:52", breakStart: "12:01", breakEnd: "12:57", checkOut: "16:08", status: "present", source: "rfid", deviceId: "attendance-esp32-001" },
  { id: `ATT-EMP-002-${d1}`, employeeId: "EMP-002", employeeName: "Budi Santoso", division: "Kitchen", shift: "Siang", rfidUid: "8A:12:4F:90", date: d1, checkIn: "14:04", breakStart: "18:02", breakEnd: "18:50", checkOut: "22:10", status: "late", source: "rfid", deviceId: "attendance-esp32-001" },
  { id: `ATT-EMP-003-${d2}`, employeeId: "EMP-003", employeeName: "Siti Rahma", division: "Casier", shift: "Middle", rfidUid: "04:91:AA:2C", date: d2, checkIn: "11:55", breakStart: "15:02", breakEnd: "15:42", checkOut: "20:01", status: "present", source: "rfid", deviceId: "attendance-esp32-001" }
];

export const seedLogs: ActivityLog[] = [
  { id: "LOG-001", timestamp: new Date(Date.now() - 3600000).toISOString(), action: "System Initialized", user: "system", details: "Aplikasi TAPPRESENSI Vercel 4-tap diinisialisasi.", type: "info" },
  { id: "LOG-002", timestamp: new Date(Date.now() - 1800000).toISOString(), action: "RFID Sync Ready", user: "device", details: "Endpoint /api/device/tap siap menerima tap ESP32/Raspberry Pi.", type: "success" }
];

export const seedDevices: DeviceStatus[] = [
  { deviceId: "attendance-esp32-001", name: "Main Entrance Reader", location: "Kantor Utama", online: true, lastSeen: new Date().toISOString(), powerMode: "AC", battery: 92, pendingQueue: 0 }
];

export const seedBackups: BackupHistory[] = [
  { id: "BACKUP-001", filename: "demo-export.json", timestamp: new Date().toISOString(), size: "demo", recordCount: { employees: seedEmployees.length, attendance: seedAttendance.length, logs: seedLogs.length } }
];
