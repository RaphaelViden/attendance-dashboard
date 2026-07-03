import { requireAdmin } from "@/lib/auth";
import { getBootstrap } from "@/lib/repository";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const data = await getBootstrap();
    return jsonOk(data.stats);
  } catch (error) {
    return jsonError(error, "Gagal mengambil analitik.");
  }
}
