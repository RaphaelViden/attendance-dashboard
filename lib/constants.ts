import type { EmployeeDivision, ShiftName, TapField, TapEventType } from "./types";

export const DIVISIONS: EmployeeDivision[] = ["Casier", "Kitchen", "Produksi", "Part-time"];

export const SHIFT_RULES: Record<ShiftName, { start: string; end: string; label: string }> = {
  "Pagi": { start: "08:00", end: "16:00", label: "08.00-16.00" },
  "Siang": { start: "14:00", end: "22:00", label: "14.00-22.00" },
  "Middle": { start: "12:00", end: "20:00", label: "12.00-20.00" },
  "Middle Closing": { start: "12:00", end: "22:00", label: "12.00-22.00" },
  "Pagi Middle": { start: "08:00", end: "20:00", label: "08.00-20.00" },
  "Fullday": { start: "08:00", end: "22:00", label: "08.00-22.00" }
};

export const SHIFT_NAMES = Object.keys(SHIFT_RULES) as ShiftName[];

export const TAP_FLOW: { field: TapField; event: TapEventType; label: string }[] = [
  { field: "checkIn", event: "masuk", label: "Masuk" },
  { field: "breakStart", event: "mulai_istirahat", label: "Mulai Istirahat" },
  { field: "breakEnd", event: "selesai_istirahat", label: "Selesai Istirahat" },
  { field: "checkOut", event: "pulang", label: "Pulang" }
];
