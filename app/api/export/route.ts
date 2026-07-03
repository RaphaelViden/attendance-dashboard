import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getBootstrap } from "@/lib/store";
import { attendanceStatus, shiftRules, workDuration } from "@/lib/time";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") || new Date().toISOString().slice(0, 10);
  const end = searchParams.get("end") || start;
  const data = getBootstrap();
  const rows = data.attendance
    .filter((item) => item.date >= start && item.date <= end)
    .map((item) => {
      const employee = data.employees.find((emp) => emp.id === item.employeeId);
      return {
        "User ID": employee?.userId || "-",
        Nama: employee?.name || "-",
        Divisi: employee?.division || "-",
        Shift: employee?.shift || "-",
        "Jam Shift": employee ? `${shiftRules[employee.shift].start}-${shiftRules[employee.shift].end}` : "-",
        Tanggal: item.date,
        Masuk: item.masuk || "-",
        "Mulai Istirahat": item.mulaiIstirahat || "-",
        "Selesai Istirahat": item.selesaiIstirahat || "-",
        Pulang: item.pulang || "-",
        "Jam Kerja": workDuration(item),
        Status: employee ? attendanceStatus(item, employee.shift) : "-",
        Sumber: item.source
      };
    });

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 10 }, { wch: 24 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
    { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Rekap Presensi");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rekap-presensi-${start}-sd-${end}.xlsx"`
    }
  });
}
