export type EmployeeDivision = "Casier" | "Kitchen" | "Produksi" | "Part-time";
export type ShiftName = "Pagi" | "Siang" | "Middle" | "Middle Closing" | "Pagi Middle" | "Fullday";
export type AttendanceStatus = "present" | "late" | "absent" | "leave" | "sick" | "wfh" | "incomplete";
export type AttendanceSource = "rfid" | "manual" | "sync" | "device-mock";
export type TapField = "checkIn" | "breakStart" | "breakEnd" | "checkOut";
export type TapEventType = "masuk" | "mulai_istirahat" | "selesai_istirahat" | "pulang" | "extra_tap" | "unknown_card";

export type Employee = {
  id: string;
  name: string;
  division: EmployeeDivision;
  shift: ShiftName;
  rfidUid: string;
  email: string;
  phone?: string;
  isActive: boolean;
  joinedDate: string;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string | null;
  employeeName?: string;
  division?: EmployeeDivision;
  shift?: ShiftName;
  rfidUid?: string;
  date: string;
  checkIn: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  source: AttendanceSource;
  deviceId: string;
  note?: string;
  updatedAt?: string;
};

export type ActivityLog = {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  type: "info" | "success" | "warning" | "error";
  cardUid?: string;
};

export type BackupHistory = {
  id: string;
  filename: string;
  timestamp: string;
  size: string;
  recordCount: {
    employees: number;
    attendance: number;
    logs: number;
  };
};

export type DeviceStatus = {
  deviceId: string;
  name: string;
  location: string;
  online: boolean;
  lastSeen: string;
  powerMode: "AC" | "Battery";
  battery: number;
  pendingQueue: number;
};

export type DashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  todayPresentCount: number;
  todayLateCount: number;
  todayIncompleteCount: number;
  onTimeRate: number;
  divisionStats: { name: EmployeeDivision; total: number; present: number }[];
  shiftStats: { name: ShiftName; total: number; present: number }[];
  weeklyTrends: { dayName: string; present: number; late: number; incomplete: number }[];
};

export type BootstrapPayload = {
  employees: Employee[];
  attendance: AttendanceRecord[];
  logs: ActivityLog[];
  backups: BackupHistory[];
  devices: DeviceStatus[];
  stats: DashboardStats;
  mode: "demo-memory" | "supabase";
};

export type AdminUser = {
  id: string;
  username: string;
  name: string;
  role: "Super Admin" | "Admin";
};
