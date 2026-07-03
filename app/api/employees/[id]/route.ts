import { requireAdmin } from "@/lib/auth";
import { deleteEmployee, updateEmployee } from "@/lib/repository";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Params) {
  try {
    requireAdmin(request);
    const { id } = await ctx.params;
    const body = await request.json();
    return jsonOk(await updateEmployee(id, body));
  } catch (error) {
    return jsonError(error, "Gagal memperbarui karyawan.");
  }
}

export async function DELETE(request: Request, ctx: Params) {
  try {
    requireAdmin(request);
    const { id } = await ctx.params;
    await deleteEmployee(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error, "Gagal menghapus karyawan.");
  }
}
