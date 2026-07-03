import { requireAdmin } from "@/lib/auth";
import { createEmployee, getBootstrap } from "@/lib/repository";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const data = await getBootstrap();
    return jsonOk(data.employees);
  } catch (error) {
    return jsonError(error, "Gagal mengambil data karyawan.");
  }
}

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const employee = await createEmployee({
      name: String(body.name || "").trim(),
      division: body.division,
      shift: body.shift,
      rfidUid: String(body.rfidUid || "").trim(),
      email: String(body.email || "").trim(),
      phone: body.phone ? String(body.phone) : "",
      isActive: body.isActive !== false
    });
    return jsonOk(employee, 201);
  } catch (error) {
    return jsonError(error, "Gagal menambah karyawan.");
  }
}
