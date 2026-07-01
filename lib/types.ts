export type Role = "employee" | "admin";

export type Employee = {
  id: string;
  name: string;
  division: string;
  position: string;
  rfidUid: string;
  email: string;
  isActive: boolean;
};

export type AttendanceStatus = "present" | "late" | "absent" | "leave" | "sick" | "wfh";

export type AttendanceLog = {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  source: "rfid" | "manual" | "sync";
  deviceId: string;
  note?: string;
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
