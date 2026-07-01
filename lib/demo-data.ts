import type { AttendanceLog, DeviceStatus, Employee } from "./types";

export const employees: Employee[] = [
  {
    id: "emp-001",
    name: "Raphael Viden",
    division: "Engineering",
    position: "Hardware Programmer",
    rfidUid: "B3:3D:1F:D3",
    email: "raphael@kantor.local",
    isActive: true
  },
  {
    id: "emp-002",
    name: "Budi Santoso",
    division: "Operations",
    position: "Operations Staff",
    rfidUid: "8A:12:4F:90",
    email: "budi@kantor.local",
    isActive: true
  },
  {
    id: "emp-003",
    name: "Siti Rahma",
    division: "Finance",
    position: "Finance Admin",
    rfidUid: "04:91:AA:2C",
    email: "siti@kantor.local",
    isActive: true
  },
  {
    id: "emp-004",
    name: "Andi Pratama",
    division: "Design",
    position: "Product Designer",
    rfidUid: "7C:3F:80:19",
    email: "andi@kantor.local",
    isActive: true
  },
  {
    id: "emp-005",
    name: "Nadia Putri",
    division: "Marketing",
    position: "Marketing Officer",
    rfidUid: "D2:14:9A:EF",
    email: "nadia@kantor.local",
    isActive: true
  },
  {
    id: "emp-006",
    name: "Dimas Arya",
    division: "Engineering",
    position: "Firmware Engineer",
    rfidUid: "A9:01:18:61",
    email: "dimas@kantor.local",
    isActive: true
  }
];

const month = "2026-07";

export const attendanceLogs: AttendanceLog[] = [
  {
    id: "log-001",
    employeeId: "emp-001",
    date: `${month}-01`,
    checkIn: "08:03",
    checkOut: "17:08",
    status: "present",
    source: "rfid",
    deviceId: "attendance-esp32-001"
  },
  {
    id: "log-002",
    employeeId: "emp-002",
    date: `${month}-01`,
    checkIn: "08:21",
    checkOut: "17:00",
    status: "late",
    source: "rfid",
    deviceId: "attendance-esp32-001",
    note: "Datang setelah batas toleransi"
  },
  {
    id: "log-003",
    employeeId: "emp-003",
    date: `${month}-01`,
    checkIn: "07:54",
    checkOut: "17:11",
    status: "present",
    source: "rfid",
    deviceId: "attendance-esp32-001"
  },
  {
    id: "log-004",
    employeeId: "emp-004",
    date: `${month}-01`,
    checkIn: null,
    checkOut: null,
    status: "leave",
    source: "manual",
    deviceId: "dashboard",
    note: "Cuti disetujui admin"
  },
  {
    id: "log-005",
    employeeId: "emp-005",
    date: `${month}-01`,
    checkIn: null,
    checkOut: null,
    status: "absent",
    source: "sync",
    deviceId: "system"
  },
  {
    id: "log-006",
    employeeId: "emp-006",
    date: `${month}-01`,
    checkIn: "08:09",
    checkOut: "17:22",
    status: "present",
    source: "rfid",
    deviceId: "attendance-esp32-001"
  },
  {
    id: "log-007",
    employeeId: "emp-001",
    date: `${month}-02`,
    checkIn: "08:00",
    checkOut: "17:04",
    status: "present",
    source: "rfid",
    deviceId: "attendance-esp32-001"
  },
  {
    id: "log-008",
    employeeId: "emp-002",
    date: `${month}-02`,
    checkIn: "07:58",
    checkOut: "17:02",
    status: "present",
    source: "rfid",
    deviceId: "attendance-esp32-001"
  },
  {
    id: "log-009",
    employeeId: "emp-003",
    date: `${month}-02`,
    checkIn: null,
    checkOut: null,
    status: "sick",
    source: "manual",
    deviceId: "dashboard",
    note: "Sakit"
  },
  {
    id: "log-010",
    employeeId: "emp-004",
    date: `${month}-02`,
    checkIn: "08:14",
    checkOut: "17:15",
    status: "present",
    source: "rfid",
    deviceId: "attendance-esp32-001"
  },
  {
    id: "log-011",
    employeeId: "emp-005",
    date: `${month}-02`,
    checkIn: "08:27",
    checkOut: "17:10",
    status: "late",
    source: "rfid",
    deviceId: "attendance-esp32-001"
  },
  {
    id: "log-012",
    employeeId: "emp-006",
    date: `${month}-02`,
    checkIn: "07:49",
    checkOut: "17:21",
    status: "present",
    source: "rfid",
    deviceId: "attendance-esp32-001"
  }
];

export const deviceStatus: DeviceStatus = {
  deviceId: "attendance-esp32-001",
  name: "Main Entrance Reader",
  location: "Kantor Utama",
  online: true,
  lastSeen: "2026-07-01 08:31",
  powerMode: "AC",
  battery: 92,
  pendingQueue: 0
};
