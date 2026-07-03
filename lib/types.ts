export type Division = "Casier" | "Kitchen" | "Produksi" | "Part-time";

export type ShiftName =
  | "Pagi"
  | "Siang"
  | "Middle"
  | "Middle Closing"
  | "Pagi Middle"
  | "Fullday";

export type TapEventType = "masuk" | "mulai_istirahat" | "selesai_istirahat" | "pulang" | "extra_tap";

export type Employee = {
  id: string;
  userId: string;
  name: string;
  email: string;
  division: Division;
  shift: ShiftName;
  cardUid: string;
  active: boolean;
};

export type AttendanceDay = {
  id: string;
  employeeId: string;
  date: string;
  masuk?: string;
  mulaiIstirahat?: string;
  selesaiIstirahat?: string;
  pulang?: string;
  source: "RFID" | "MANUAL" | "SYNC";
  deviceId?: string;
};

export type DeviceStatus = {
  id: string;
  name: string;
  location: string;
  online: boolean;
  lastSeen: string;
  battery: number;
  pendingQueue: number;
};

export type BootstrapData = {
  employees: Employee[];
  attendance: AttendanceDay[];
  device: DeviceStatus;
};
