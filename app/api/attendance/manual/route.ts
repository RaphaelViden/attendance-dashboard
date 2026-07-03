import { requireAdmin } from "@/lib/auth";
import { getBootstrap, saveAttendanceRecord } from "@/lib/repository";
import { jsonError, jsonOk } from "@/lib/http";
import { createEmptyRecord, isLateForShift, todayISO } from "@/lib/time";
import type { TapField } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validFields: TapField[] = ["checkIn", "breakStart", "breakEnd", "checkOut"];

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const employeeId = String(body.employeeId || "");
    const field = String(body.field || body.type || "checkIn") as TapField;
    if (!validFields.includes(field)) throw Object.assign(new Error("Jenis tap manual tidak valid."), { status: 400 });

    const data = await getBootstrap();
    const employee = data.employees.find((e) => e.id === employeeId);
    if (!employee) throw Object.assign(new Error("Karyawan tidak ditemukan."), { status: 404 });

    const date = String(body.date || todayISO());
    const record = data.attendance.find((r) => r.employeeId === employeeId && r.date === date) || createEmptyRecord(employee, date, "dashboard");
    record[field] = String(body.time || new Date().toTimeString().slice(0, 5)).slice(0, 5);
    record.source = "manual";
    record.deviceId = "dashboard";
    record.note = body.note ? String(body.note) : record.note;
    record.status = record.checkIn && isLateForShift(employee.shift, record.checkIn) ? "late" : record.checkIn && record.breakStart && record.breakEnd && record.checkOut ? "present" : "incomplete";
    const saved = await saveAttendanceRecord(record);
    return jsonOk(saved);
  } catch (error) {
    return jsonError(error, "Gagal menyimpan presensi manual.");
  }
}
