import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/auth";
import { getBootstrap } from "@/lib/repository";
import { dateRange, formatIDDate, workDuration } from "@/lib/time";
import { SHIFT_RULES } from "@/lib/constants";
import { jsonError } from "@/lib/http";
import type { AttendanceRecord, Employee } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function attendanceCell(record?: AttendanceRecord): string {
  if (!record) return "-";
  const lines = [
    `Masuk: ${record.checkIn || "-"}`,
    `Istirahat mulai: ${record.breakStart || "-"}`,
    `Istirahat selesai: ${record.breakEnd || "-"}`,
    `Pulang: ${record.checkOut || "-"}`,
    `Jam kerja: ${workDuration(record)}`
  ];
  return lines.join("\n");
}

function recordKey(employee: Employee, date: string) {
  return `${employee.id}__${date}`;
}

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const url = new URL(request.url);
    const today = new Date().toISOString().slice(0, 10);
    const start = url.searchParams.get("start") || today.slice(0, 8) + "01";
    const end = url.searchParams.get("end") || today;
    const days = dateRange(start, end);

    const data = await getBootstrap();
    const byKey = new Map<string, AttendanceRecord>();
    for (const rec of data.attendance) {
      if (rec.employeeId) byKey.set(`${rec.employeeId}__${rec.date}`, rec);
    }

    const aoa: any[][] = [];
    aoa.push(["Catatan Kehadiran Karyawan"]);
    aoa.push([`Tanggal Kehadiran: ${start} sampai ${end}`, "", "", `Tanggal Dibuat: ${new Date().toLocaleString("id-ID")}`]);
    aoa.push([]);

    for (const employee of data.employees) {
      aoa.push([
        `User ID: ${employee.id}`,
        `Nama: ${employee.name}`,
        `Departemen: ${employee.division}`,
        `Shift: ${employee.shift} (${SHIFT_RULES[employee.shift].label})`
      ]);
      aoa.push(["Tanggal", ...days.map((d) => formatIDDate(d))]);
      aoa.push(["Tap & Jam Kerja", ...days.map((day) => attendanceCell(byKey.get(recordKey(employee, day))))]);
      aoa.push([]);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 18 }, ...days.map(() => ({ wch: 21 }))];
    ws["!rows"] = aoa.map((row, index) => ({ hpt: index === 0 ? 28 : row[0] === "Tap & Jam Kerja" ? 74 : 20 }));
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(3, days.length) } }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Presensi");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rekap-presensi-${start}-sd-${end}.xlsx"`
      }
    });
  } catch (error) {
    return jsonError(error, "Gagal membuat export XLSX.");
  }
}
